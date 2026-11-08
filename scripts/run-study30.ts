/**
 * Study 30 (docs/BRIEF-STUDY30.md): downbeat disambiguation for the
 * chartless grid — D1 chroma novelty (primary) vs D2 kick-band onsets
 * (secondary) over whole-beat candidates, then the Study 28 re-draft
 * of the two captured songs on the disambiguated grid. Fence $0.5.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import charts20b from "../corpus/mmkk-charts-20b.json";
import eatV131 from "../corpus/mmkk-charts-eat-v131.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { expandChords, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { chromaNovelty, disambiguate, lowpass4 } from "../src/study30/downbeat.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;

function readEnvLocal(): string | null {
	try {
		const m = readFileSync(`${root}.env.local`, "utf8").match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/);
		return m?.[1]?.trim() ?? null;
	} catch {
		return null;
	}
}
const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");
const gateway = createGateway({ apiKey });

interface ChartSong {
	slug: string;
	bpm: number;
	meter: string;
	sections: { name: string; bars: string[][] }[];
}
const beatsOf = (m: string) => (m === "3/4" ? 3 : 4);
function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
function bars(chart: ChartSong): string[][] {
	const out: string[][] = [];
	for (const s of chart.sections) for (const b of s.bars) out.push(b);
	return out;
}

const SONGS: { chart: ChartSong; key: string; truth: number; refPct: number | null }[] = [
	{
		chart: (mmkkCharts.songs as ChartSong[]).find((s) => s.slug === "letter-lands")!,
		key: "F#",
		truth: -0.121,
		refPct: 72 / 76,
	},
	{
		chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "peaceful-dreams")!,
		key: "D",
		truth: -0.119,
		refPct: 151 / 153,
	},
	{
		chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "mop-heart")!,
		key: "A",
		truth: -0.066,
		refPct: null,
	},
	{
		chart: { ...(eatV131.songs as ChartSong[])[0]!, slug: "eat-all-the-clocks" },
		key: "Em",
		truth: 0.415,
		refPct: null,
	},
];

const dir = mkdtempSync(join(tmpdir(), "stem-bench30-"));
const out: Record<string, unknown> = {};
let g1 = true;
let g2 = true;
let d2Right = 0;
let tokensIn = 0;
let tokensOut = 0;

for (const song of SONGS) {
	const { chart } = song;
	const beats = beatsOf(chart.meter);
	const declared = (beats * 60) / chart.bpm;
	const beat = declared / beats;
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const feat = extractFeatures(asBuffer(mix, RATE));
	const grid = chartlessGrid(feat.onset, feat.fps, declared, mix, RATE);
	const span = audibleSpan(mix, RATE);

	const nov = chromaNovelty(mix);
	const d1 = disambiguate(grid.anchor, grid.period, beats, span.first, grid.n, nov.env, nov.fps);
	const kick = extractFeatures(asBuffer(lowpass4(mix, RATE, 150), RATE));
	const d2 = disambiguate(grid.anchor, grid.period, beats, span.first, grid.n, kick.onset, kick.fps);

	// Nearest whole-period representative of the truth inside the window.
	const near = (a: number) => {
		let t = song.truth;
		while (t - a > grid.period / 2) t -= grid.period;
		while (a - t > grid.period / 2) t += grid.period;
		return Math.abs(a - t);
	};
	const d1Ok = near(d1.anchor) <= 0.1 * beat;
	const d2Ok = near(d2.anchor) <= 0.1 * beat;
	if (!d1Ok) g1 = false;
	if (d2Ok) d2Right++;
	out[chart.slug] = {
		base: grid,
		d1: { anchor: d1.anchor, shift: d1.shift, ok: d1Ok, scores: d1.scores },
		d2: { anchor: d2.anchor, shift: d2.shift, ok: d2Ok },
		truth: song.truth,
	};
	console.log(
		`${chart.slug}: base ${grid.anchor.toFixed(3)}s | D1 novelty -> ${d1.anchor.toFixed(3)}s (shift ${d1.shift}) ${d1Ok ? "DOWNBEAT" : "WRONG"} | D2 kick -> ${d2.anchor.toFixed(3)}s (shift ${d2.shift}) ${d2Ok ? "downbeat" : "wrong"} | truth ${song.truth.toFixed(3)}s`,
	);

	// Arm B: re-draft the two captured songs on the D1 grid.
	if (song.refPct === null) continue;
	const truthBars = bars(chart);
	const nGrade = Math.min(grid.n, truthBars.length);
	const barStarts = Array.from({ length: grid.n }, (_, i) => d1.anchor + i * grid.period);
	const barsFile = join(dir, `bars-${chart.slug}.json`);
	const outFile = `${barsFile}.out.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync(
		[PY, NCHORD, "--raw", `${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`, "--out", outFile, "--bars", barsFile],
		{ maxBuffer: 64 * 1024 * 1024 },
	);
	if (np.exitCode !== 0) throw new Error(`nchord failed (${chart.slug})`);
	const hintsRaw = (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar;
	const m = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
		(x) => x.slug === chart.slug,
	)!;
	const stems = m.stems
		.filter((s) => !/drum/i.test(s.name))
		.map((s) => loadRaw(`${root}corpus-mmkk/${chart.slug}/${s.url.split("/").pop()}.22050.f32le.raw`));
	const len = Math.max(...stems.map((s) => s.length));
	const sum = new Float32Array(len);
	for (const s of stems) for (let i = 0; i < s.length; i++) sum[i]! += s[i]!;
	let peak = 0;
	for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(sum[i]!));
	if (peak > 0) for (let i = 0; i < len; i++) sum[i]! /= peak;
	const rawFile = join(dir, `${chart.slug}.raw`);
	writeFileSync(rawFile, Buffer.from(sum.buffer, sum.byteOffset, sum.byteLength));
	const proc = Bun.spawnSync(
		["node", `${root}scripts/transcribe-child.mjs`, `${root}src/fixture/model.json`, `${root}src/fixture/weights.json`, rawFile],
		{ maxBuffer: 256 * 1024 * 1024 },
	);
	if (proc.exitCode !== 0) throw new Error(`transcription failed (${chart.slug})`);
	const rows = JSON.parse(proc.stdout.toString()) as [number, number, number, number][];
	const notes: Note[] = rows.map(([start, duration, pitch, amplitude]) => ({
		start,
		end: start + duration,
		pitch,
		amplitude,
	}));
	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23({
			title: chart.slug.replace(/-/g, " "),
			bpm: chart.bpm,
			key: song.key,
			meter: chart.meter,
			barNotes: describeBars(notes, barStarts),
			hintPerBar: hintsRaw.map((c) => (c === "" ? "N.C." : c)),
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
		console.log(`${chart.slug}: NO VALID ANSWER -> S30-G2 MISS`);
		g2 = false;
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const perBar = Array.from({ length: nGrade }, (_, i) => expanded[i] ?? "");
	const roots = rootScore(perBar, truthBars.slice(0, nGrade));
	const pct = roots.right / roots.bearing;
	const ok = pct >= song.refPct - 0.05;
	if (!ok) g2 = false;
	(out[chart.slug] as Record<string, unknown>).redraft = { roots, pct, refPct: song.refPct };
	console.log(
		`  re-draft on the D1 grid: roots ${roots.right}/${roots.bearing} = ${(pct * 100).toFixed(1)}% (ref ${(song.refPct * 100).toFixed(1)}%, Study 28 had ${chart.slug === "letter-lands" ? "81.3" : "89.5"}%) -> S30-G2 ${ok ? "ok" : "MISS"}`,
	);
}

console.log(`\nS30-G1 (D1 finds the downbeat on all four): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S30-G2 (re-drafts within 5 points of the references): ${g2 ? "PASS" : "FAIL"}`);
console.log(`D2 (kick-band, secondary): right on ${d2Right}/4`);
console.log(`tokens ${tokensIn} in / ${tokensOut} out`);
writeFileSync(
	`${root}results/study30.json`,
	`${JSON.stringify(
		{
			version: 1,
			model: MODEL,
			songs: out,
			d2Right,
			gates: { "S30-G1": g1 ? "PASS" : "FAIL", "S30-G2": g2 ? "PASS" : "FAIL" },
			tokensIn,
			tokensOut,
		},
		null,
		"\t",
	)}\n`,
);
rmSync(dir, { recursive: true, force: true });
