/**
 * Study 33 (docs/BRIEF-STUDY33.md): the stereo file as two stems.
 * Pilot: letter-lands × five transcription-input arms (R stems sum,
 * A mono mix, B L/R pseudo-stems, C mid/side, D HPSS harmonic), one
 * grid and one hint set shared by all arms, plus the $0 synthetic
 * separation sweep. `--matrix` adds peaceful-dreams (needs Kevin's
 * explicit go-ahead after the pilot's results are committed).
 * Pilot fence $0.3; matrix fence $0.6.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import charts20b from "../corpus/mmkk-charts-20b.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { expandChords, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { chromagram } from "../src/study12/chroma.js";
import {
	classOf,
	mod,
	w1TimeZero,
	w4Harmonic,
	w7Section,
	weightedVote,
} from "../src/study31/witnesses.js";
import { applyRatioRule } from "../src/study32/corpus32.js";
import { chordTonePurity, renderPanned } from "../src/study33/corpus33.js";
import { hpssHarmonic } from "../src/study33/hpss.js";
import { loadStereo, mergeNotes, midSide, peakNorm } from "../src/study33/stereo.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const UNCAPPED = 600;
const LEAD = 0.07;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench33-"));
const MATRIX = process.argv.includes("--matrix");

function readEnvLocal(): string | null {
	try {
		const m = readFileSync(`${root}.env.local`, "utf8").match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/);
		return m?.[1]?.trim() ?? null;
	} catch {
		return null;
	}
}

function loadRaw(path: string): Float32Array {
	const buf = readFileSync(path);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function transcribe(samples: Float32Array, name: string): Note[] {
	const rawFile = join(dir, `${name}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	const proc = Bun.spawnSync(
		["node", `${root}scripts/transcribe-child.mjs`, `${root}src/fixture/model.json`, `${root}src/fixture/weights.json`, rawFile],
		{ maxBuffer: 256 * 1024 * 1024 },
	);
	if (proc.exitCode !== 0) throw new Error(`transcription failed (${name}): ${proc.stderr.toString().slice(0, 400)}`);
	return (JSON.parse(proc.stdout.toString()) as [number, number, number, number][]).map(
		([start, duration, pitch, amplitude]) => ({ start, end: start + duration, pitch, amplitude }),
	);
}

function nchordPerBar(samples: Float32Array, barStarts: number[], name: string): string[] {
	const rawFile = join(dir, `${name}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	const barsFile = `${rawFile}.bars.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", rawFile, "--out", `${barsFile}.out`, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np.exitCode !== 0) throw new Error(`nchord failed (${name})`);
	return (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar;
}

interface ChartSong {
	slug: string;
	bpm: number;
	meter: string;
	sections: { bars: string[][] }[];
}
const SONGS: { chart: ChartSong; truth: number; key: string; refPct: number }[] = [
	{
		chart: (mmkkCharts.songs as ChartSong[]).find((s) => s.slug === "letter-lands")!,
		truth: -0.121,
		key: "F#",
		refPct: 72 / 76,
	},
];
if (MATRIX)
	SONGS.push({
		chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "peaceful-dreams")!,
		truth: -0.119,
		key: "D",
		refPct: 151 / 153,
	});

const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");
const gateway = createGateway({ apiKey });
let tokensIn = 0;
let tokensOut = 0;

/** The shipped grid, vote and placement on the mono mix — shared by every arm. */
function placeGrid(mono: Float32Array, beats: number, beatSec: number, slug: string) {
	const feat = extractFeatures(asBuffer(mono, RATE), UNCAPPED);
	const declared = beats * beatSec;
	const grid = chartlessGrid(feat.onset, feat.fps, declared, mono, RATE);
	const span = audibleSpan(mono, RATE);
	const beat = grid.period / beats;
	const w1lead = w1TimeZero(grid.anchor + LEAD, beat, beats);
	const nBeats = grid.n * beats;
	const beatStarts = Array.from({ length: nBeats }, (_, j) => grid.anchor + j * beat);
	const labels = nchordPerBar(mono, beatStarts, `${slug}-beats`);
	const w4ship = applyRatioRule(w4Harmonic(labels, beats));
	const ch = chromagram(mono);
	const j0 = Math.max(0, Math.ceil((0 - grid.anchor) / beat));
	const beatChroma: Float32Array[] = [];
	for (let j = j0; j < nBeats; j++) {
		const f0 = Math.max(0, Math.floor((grid.anchor + j * beat) / ch.hopSec));
		const f1 = Math.min(ch.frames.length, Math.floor((grid.anchor + (j + 1) * beat) / ch.hopSec));
		const acc = new Float32Array(12);
		for (let f = f0; f < f1; f++) for (let k = 0; k < 12; k++) acc[k]! += ch.frames[f]![k]!;
		let norm = 0;
		for (let k = 0; k < 12; k++) norm += acc[k]! * acc[k]!;
		norm = Math.sqrt(norm) || 1;
		for (let k = 0; k < 12; k++) acc[k]! /= norm;
		beatChroma.push(acc);
	}
	const raw7 = w7Section(beatChroma, beats);
	const w7 = raw7.cls === null ? raw7 : { cls: mod(raw7.cls + j0, beats), detail: raw7.detail };
	const ship = weightedVote(
		[
			{ cls: w1lead.cls, weight: 2 },
			{ cls: w4ship.cls, weight: 2 },
			{ cls: w7.cls, weight: 1 },
		],
		beats,
	);
	const cls = ship.undecided ? 0 : ship.decided;
	let anchor = grid.anchor + cls * beat;
	while (anchor > span.first + 0.25 * beat) anchor -= grid.period;
	if (anchor < span.first - grid.period) anchor += grid.period;
	const barStarts = Array.from({ length: grid.n }, (_, i) => anchor + i * grid.period);
	return { grid, beat, cls, anchor, barStarts, truthCls: classOf(0, grid.anchor, beat, beats) };
}

const results: Record<string, unknown> = {};
const armPcts: Record<string, Record<string, number>> = {};

for (const song of SONGS) {
	const slug = song.chart.slug;
	const beats = song.chart.meter === "3/4" ? 3 : 4;
	const beatSec = 60 / song.chart.bpm;
	const mono = loadRaw(`${root}corpus-mmkk/${slug}/mix.mp3.22050.f32le.raw`);
	const { l, r } = loadStereo(`${root}corpus-mmkk/${slug}/mix.mp3`);
	const { mid, side } = midSide(l, r);

	const placed = placeGrid(mono, beats, beatSec, slug);
	console.log(
		`[${slug}] grid period ${placed.grid.period.toFixed(3)}s n ${placed.grid.n} | vote cls ${placed.cls} | bar one placed ${placed.anchor.toFixed(3)}s (truth ${song.truth.toFixed(3)}s)`,
	);
	const hints = nchordPerBar(mono, placed.barStarts, `${slug}-bars`).map((c) => (c === "" ? "N.C." : c));

	const truthBars: string[][] = [];
	for (const s of song.chart.sections) for (const b of s.bars) truthBars.push(b);
	const nGrade = Math.min(placed.grid.n, truthBars.length);

	// The five transcription inputs.
	const manifest = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
		(x) => x.slug === slug,
	)!;
	const stems = manifest.stems
		.filter((st) => !/drum/i.test(st.name))
		.map((st) => loadRaw(`${root}corpus-mmkk/${slug}/${st.url.split("/").pop()}.22050.f32le.raw`));
	const len = Math.max(...stems.map((x) => x.length));
	const sum = new Float32Array(len);
	for (const x of stems) for (let i = 0; i < x.length; i++) sum[i]! += x[i]!;

	const arms: Record<string, Float32Array[]> = {
		R: [peakNorm(sum)],
		A: [peakNorm(mono)],
		B: [peakNorm(l), peakNorm(r)],
		C: [peakNorm(mid), peakNorm(side)],
		D: [peakNorm(hpssHarmonic(mono))],
	};

	const songResult: Record<string, unknown> = {};
	armPcts[slug] = {};
	for (const [arm, buffers] of Object.entries(arms)) {
		let notes: Note[] = [];
		for (const [i, buf] of buffers.entries()) notes = mergeNotes(notes, transcribe(buf, `${slug}-${arm}-${i}`));
		console.log(`[${slug}] arm ${arm}: ${notes.length} transcribed notes from ${buffers.length} buffer(s)`);
		const result = await generateText({
			model: gateway(MODEL),
			system: system23(),
			prompt: question23({
				title: slug.replace(/-/g, " "),
				bpm: song.chart.bpm,
				key: song.key,
				meter: song.chart.meter,
				barNotes: describeBars(notes, placed.barStarts),
				hintPerBar: hints,
			}),
			temperature: 0,
			maxOutputTokens: 8000,
			maxRetries: 4,
			providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } },
		} as Parameters<typeof generateText>[0]);
		tokensIn += result.totalUsage?.inputTokens ?? 0;
		tokensOut += result.totalUsage?.outputTokens ?? 0;
		const json = result.text.match(/\{[\s\S]*\}/)?.[0];
		const parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
		if (!parsed?.success) {
			console.log(`[${slug}] arm ${arm}: NO VALID ANSWER`);
			songResult[arm] = { pct: null, noteCount: notes.length };
			armPcts[slug]![arm] = 0;
			continue;
		}
		const expanded = expandChords(parsed.output.chords);
		const perBar = Array.from({ length: nGrade }, (_, i) => expanded[i] ?? "");
		const roots = rootScore(perBar, truthBars.slice(0, nGrade));
		const pct = roots.right / roots.bearing;
		armPcts[slug]![arm] = pct;
		songResult[arm] = { pct, roots, noteCount: notes.length };
		console.log(
			`[${slug}] arm ${arm}: roots ${roots.right}/${roots.bearing} = ${(pct * 100).toFixed(1)}% (stems ref ${(song.refPct * 100).toFixed(1)}%)`,
		);
	}
	results[slug] = { placed: { cls: placed.cls, anchor: placed.anchor, n: placed.grid.n }, arms: songResult, refPct: song.refPct };
}

// ---- The synthetic separation sweep ($0) ----
console.log("\n[sweep] rendering and transcribing the panned synthetics");
const sweep: Record<string, Record<string, number>> = {};
const ceilingSong = renderPanned(0);
const ceilingNotes = transcribe(peakNorm(ceilingSong.chordsOnly), "sweep-chords-only");
const ceiling = chordTonePurity(ceilingNotes, ceilingSong.barStarts, ceilingSong.chords).purity;
console.log(`[sweep] chords-only ceiling purity ${(ceiling * 100).toFixed(1)}%`);
for (const width of [0, 0.5, 1]) {
	const p = renderPanned(width);
	const ms = midSide(p.l, p.r);
	const inputs: Record<string, Float32Array> = {
		mono: peakNorm(ms.mid),
		left: peakNorm(p.l),
		side: peakNorm(ms.side),
		hpss: peakNorm(hpssHarmonic(ms.mid)),
	};
	sweep[String(width)] = {};
	for (const [name, buf] of Object.entries(inputs)) {
		const notes = transcribe(buf, `sweep-${width}-${name}`);
		const purity = chordTonePurity(notes, p.barStarts, p.chords).purity;
		sweep[String(width)]![name] = purity;
		console.log(`[sweep] width ${width} ${name}: purity ${(purity * 100).toFixed(1)}% (${notes.length} notes)`);
	}
}

// ---- Gates ----
const slugs = Object.keys(armPcts);
const mean = (f: (s: string) => number) => slugs.reduce((acc, s) => acc + f(s), 0) / slugs.length;
const g1 = SONGS.every((s) => (armPcts[s.chart.slug]!.R ?? 0) >= s.refPct - 0.05);
const g2 = mean((s) => armPcts[s]!.B! - armPcts[s]!.A!) <= 0.02;
const g3 = mean((s) => armPcts[s]!.D! - armPcts[s]!.A!) >= -0.02;
console.log(`\nS33-G1 (arm R reproduces the frozen stems refs): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S33-G2 (L/R-as-two-stems is not worth it: B <= A + 0.02): ${g2 ? "PASS" : "FAIL"}`);
console.log(`S33-G3 (HPSS does not hurt: D >= A - 0.02): ${g3 ? "PASS" : "FAIL"}`);
console.log(`tokens ${tokensIn} in / ${tokensOut} out`);

writeFileSync(
	`${root}results/study33${MATRIX ? "" : "-pilot"}.json`,
	`${JSON.stringify(
		{
			version: 1,
			model: MODEL,
			matrix: MATRIX,
			songs: results,
			sweep: { ceiling, widths: sweep },
			gates: { "S33-G1": g1 ? "PASS" : "FAIL", "S33-G2": g2 ? "PASS" : "FAIL", "S33-G3": g3 ? "PASS" : "FAIL" },
			tokensIn,
			tokensOut,
		},
		null,
		"\t",
	)}\n`,
);
console.log(`results written (${MATRIX ? "matrix" : "pilot"})`);
