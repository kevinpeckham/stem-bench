/**
 * Study 32 (docs/BRIEF-STUDY32.md): the downbeat vote against songs
 * built to fool it. Arms 1-5 synthetic constructions, arm 6 the four
 * real songs re-cut, arm 7 the re-drafts on the 1.0-beat pads.
 * Fence $0.3 (two fable calls; all else $0).
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
import { highpass4 } from "../src/study29/backbeat.js";
import {
	applyRatioRule,
	type Item,
	padStart,
	renderSong,
	trimStart,
	withCountIn,
	withPickup,
} from "../src/study32/corpus32.js";
import {
	classOf,
	rmsEnvelope,
	strongOnsets,
	type Vote,
	w1TimeZero,
	w2LastOnset,
	w3BothEnds,
	w4Harmonic,
	w5Crashes,
	w7Section,
	weightedVote,
	mod,
} from "../src/study31/witnesses.js";
import { chromagram } from "../src/study12/chroma.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const UNCAPPED = 600;
const LEAD = 0.07;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const FULL_WEIGHTS: Record<string, number> = { w1: 2, w2: 1, w3: 1, w4: 2, w5: 1, w6: 2, w7: 1 };
const dir = mkdtempSync(join(tmpdir(), "stem-bench32-"));

function readEnvLocal(): string | null {
	try {
		const m = readFileSync(`${root}.env.local`, "utf8").match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/);
		return m?.[1]?.trim() ?? null;
	} catch {
		return null;
	}
}

interface Row {
	name: string;
	arm: string;
	truthCls: number;
	baseCorrect: boolean;
	witnesses: Record<string, number | string>;
	ship: { scores: number[]; decided: number; undecided: boolean };
	full: { decided: number; undecided: boolean };
	shipOk: boolean;
	grid: { anchor: number; period: number; n: number };
	beat: number;
	spanFirst: number;
}

let nchordCalls = 0;
function runItem(item: Item, arm: string): Row {
	const feat = extractFeatures(asBuffer(item.samples, RATE), UNCAPPED);
	const declared = item.beats * item.beatSec;
	const grid = chartlessGrid(feat.onset, feat.fps, declared, item.samples, RATE);
	const span = audibleSpan(item.samples, RATE);
	const beat = grid.period / item.beats;
	const truthCls = classOf(item.truth, grid.anchor, beat, item.beats);
	const gridEnd = grid.anchor + grid.n * grid.period;

	const w1 = w1TimeZero(grid.anchor, beat, item.beats);
	const w1lead = w1TimeZero(grid.anchor + LEAD, beat, item.beats);
	const pk = strongOnsets(feat.onset, feat.fps, beat, span);
	const w2 = w2LastOnset(pk, grid.anchor, beat, item.beats, { first: span.first, last: gridEnd });
	const w3 = w3BothEnds(pk, grid.anchor, beat, item.beats);

	const nBeats = grid.n * item.beats;
	const beatStarts = Array.from({ length: nBeats }, (_, j) => grid.anchor + j * beat);
	const rawFile = join(dir, `${arm}-${item.name.replace(/[^a-z0-9-]/gi, "_")}.raw`);
	writeFileSync(rawFile, Buffer.from(item.samples.buffer, item.samples.byteOffset, item.samples.byteLength));
	const barsFile = `${rawFile}.beats.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts: beatStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", rawFile, "--out", `${barsFile}.out`, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np.exitCode !== 0) throw new Error(`nchord failed (${item.name})`);
	nchordCalls++;
	const labels = (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar;
	const w4raw = w4Harmonic(labels, item.beats);
	const w4ship = applyRatioRule(w4raw);

	const hpEnv = rmsEnvelope(highpass4(item.samples, RATE, 5000), RATE);
	const w5 = w5Crashes(hpEnv.env, hpEnv.fps, grid.anchor, beat, item.beats);

	const ch = chromagram(item.samples);
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
	const raw7 = w7Section(beatChroma, item.beats);
	const w7 = raw7.cls === null ? raw7 : { cls: mod(raw7.cls + j0, item.beats), detail: raw7.detail };

	const ship = weightedVote(
		[
			{ cls: w1lead.cls, weight: 2 },
			{ cls: w4ship.cls, weight: 2 },
			{ cls: w7.cls, weight: 1 },
		],
		item.beats,
	);
	const w6: Vote = { cls: null, detail: { abstain: "no stems" } };
	const all: Record<string, Vote> = { w1, w2, w3, w4: w4raw, w5, w6, w7 };
	const full = weightedVote(
		Object.entries(all).map(([name, vv]) => ({ cls: vv.cls, weight: FULL_WEIGHTS[name]! })),
		item.beats,
	);
	const shipOk = !ship.undecided && ship.decided === truthCls;
	const wsum: Record<string, number | string> = {};
	for (const [k, vv] of Object.entries({ w1, w1lead, w2, w3, w4: w4ship, w5, w7 }))
		wsum[k] = vv.cls === null ? `abstain(${vv.detail.abstain ?? "?"})` : vv.cls;
	return {
		name: item.name,
		arm,
		truthCls,
		baseCorrect: truthCls === 0,
		witnesses: wsum,
		ship: { scores: ship.scores, decided: ship.decided, undecided: ship.undecided },
		full: { decided: full.decided, undecided: full.undecided },
		shipOk,
		grid,
		beat,
		spanFirst: span.first,
	};
}

const rows: Row[] = [];
const log = (r: Row) =>
	console.log(
		`[${r.arm}] ${r.name}: truth cls ${r.truthCls} (base ${r.baseCorrect ? "CORRECT" : "wrong"}) | ${Object.entries(
			r.witnesses,
		)
			.map(([k, vv]) => `${k}:${vv}`)
			.join(" ")} | ship [${r.ship.scores}] -> ${r.ship.undecided ? "undecided" : r.ship.decided} ${r.shipOk ? "ok" : r.ship.undecided ? "(base stays)" : "WRONG"}`,
	);

// ---- Arms 1-5: synthetics ----
const mk = (name: string, bpm: number, beats: number, harmonic: Parameters<typeof renderSong>[0]["harmonic"], kick = 1.0, snare = 0.6, rit?: number, ok = true) =>
	renderSong({ name, bpm, beats, bars: 48, harmonic, kickAmp: kick, snareAmp: snare, ritStretch: rit, baseShouldBeCorrect: ok });

const r132 = mk("render-132", 132, 4, "bar");
const arm1 = [mk("render-100", 100, 4, "bar"), r132, mk("render-180-double", 180, 4, "double"), mk("render-132-rit", 132, 4, "bar", 1.0, 0.6, 1.08)];
for (const it of arm1) rows.push(runItem(it, "arm1"));
rows[1]!.arm = "arm1+2a"; // the 132 render doubles as arm 2(a)

for (const it of [
	withPickup(r132, "start-pickup"),
	padStart(r132, 2 * r132.beatSec, "start-halfbar-silence"),
	padStart(r132, 2.0, "start-2s-silence"),
	withCountIn(r132, "start-countin"),
])
	rows.push(runItem(it, "arm2"));

for (const it of [
	mk("harm-one-and-three", 132, 4, "half"),
	mk("harm-two-bar", 132, 4, "double"),
	mk("harm-vamp", 132, 4, "vamp"),
	mk("harm-anticipate", 132, 4, "anticipate"),
])
	rows.push(runItem(it, "arm3"));

rows.push(runItem(mk("backbeat-heavy", 132, 4, "bar", 0.3, 1.0, undefined, false), "arm4"));

const waltz = mk("waltz-140", 140, 3, "bar");
const six8 = mk("six8-72", 72, 2, "bar");
for (const it of [waltz, withPickup(waltz, "waltz-140-pickup"), six8, withPickup(six8, "six8-72-pickup")])
	rows.push(runItem(it, "arm5"));
for (const r of rows) log(r);

// ---- Arm 6: the four real songs re-cut ----
interface ChartSong {
	slug: string;
	bpm: number;
	meter: string;
}
const REAL: { chart: ChartSong; truth: number; key: string; refPct: number | null }[] = [
	{ chart: (mmkkCharts.songs as ChartSong[]).find((s) => s.slug === "letter-lands")!, truth: -0.121, key: "F#", refPct: 72 / 76 },
	{ chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "peaceful-dreams")!, truth: -0.119, key: "D", refPct: 151 / 153 },
	{ chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "mop-heart")!, truth: -0.066, key: "A", refPct: null },
	{ chart: { ...(eatV131.songs as ChartSong[])[0]!, slug: "eat-all-the-clocks" }, truth: -0.085, key: "Em", refPct: null },
];
function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
const arm6Rows: Record<string, Row> = {};
for (const song of REAL) {
	const beats = song.chart.meter === "3/4" ? 3 : 4;
	const beatSec = 60 / song.chart.bpm;
	const mix = loadRaw(`${root}corpus-mmkk/${song.chart.slug}/mix.mp3.22050.f32le.raw`);
	const orig: Item = {
		name: `${song.chart.slug}-original`,
		samples: mix,
		bpm: song.chart.bpm,
		beats,
		beatSec,
		truth: song.truth,
		baseShouldBeCorrect: false,
	};
	const cuts = [
		orig,
		padStart(orig, 0.3 * beatSec, `${song.chart.slug}-pad0.3`),
		padStart(orig, 1.0 * beatSec, `${song.chart.slug}-pad1.0`),
		padStart(orig, 2.5 * beatSec, `${song.chart.slug}-pad2.5`),
		trimStart(orig, 1.0 * beatSec, `${song.chart.slug}-trim1.0`),
	];
	for (const it of cuts) {
		const r = runItem(it, it.name.endsWith("original") ? "arm6-orig" : "arm6");
		rows.push(r);
		arm6Rows[it.name] = r;
		log(r);
	}
}

// ---- Gates ----
const g1Items = rows.filter((r) => (r.arm.startsWith("arm1") || (r.arm === "arm5" && !r.name.includes("pickup"))));
let g1 = true;
const g1Violations: string[] = [];
for (const r of g1Items) {
	if (!r.baseCorrect) {
		g1Violations.push(`${r.name}: base NOT correct as constructed (truth cls ${r.truthCls})`);
		g1 = false;
		continue;
	}
	for (const [k, vv] of Object.entries(r.witnesses))
		if (typeof vv === "number" && vv !== 0) {
			g1Violations.push(`${r.name}: ${k} voted ${vv}`);
			g1 = false;
		}
	if (r.ship.undecided || r.ship.decided !== 0) {
		g1Violations.push(`${r.name}: ship vote did not keep class 0`);
		g1 = false;
	}
}
const g2Items = rows.filter((r) => r.arm === "arm2" || r.arm === "arm3" || r.arm === "arm4" || r.arm === "arm6" || (r.arm === "arm5" && r.name.includes("pickup")));
let g2 = true;
let undecidedCount = 0;
for (const r of g2Items) {
	if (r.ship.undecided) undecidedCount++;
	else if (r.ship.decided !== r.truthCls) {
		g2 = false;
		console.log(`S32-G2 violation: ${r.name} decided ${r.ship.decided} vs truth ${r.truthCls}`);
	}
}
const g3 = rows.filter((r) => r.arm === "arm6-orig").every((r) => r.shipOk);

// ---- Arm 7: re-drafts on the 1.0-beat pads ----
const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");
const gateway = createGateway({ apiKey });
let g4 = true;
let tokensIn = 0;
let tokensOut = 0;
const redrafts: Record<string, unknown> = {};
for (const song of REAL) {
	if (song.refPct === null) continue;
	const slug = song.chart.slug;
	const beats = 4;
	const beatSec = 60 / song.chart.bpm;
	const mix0 = loadRaw(`${root}corpus-mmkk/${slug}/mix.mp3.22050.f32le.raw`);
	const padSec = Math.floor(1.0 * beatSec * RATE) / RATE;
	const r = arm6Rows[`${slug}-pad1.0`]!;
	const cls = r.ship.undecided ? 0 : r.ship.decided;
	let anchor = r.grid.anchor + cls * r.beat;
	while (anchor > r.spanFirst + 0.25 * r.beat) anchor -= r.grid.period;
	if (anchor < r.spanFirst - r.grid.period) anchor += r.grid.period;
	const barStarts = Array.from({ length: r.grid.n }, (_, i) => anchor + i * r.grid.period);
	console.log(`[arm7] ${slug}-pad1.0: voted class ${cls} placed at ${anchor.toFixed(3)}s (true bar one ${(song.truth + padSec).toFixed(3)}s)`);

	const sections = (song.chart as unknown as { sections: { bars: string[][] }[] }).sections;
	const truthBars: string[][] = [];
	for (const s of sections) for (const b of s.bars) truthBars.push(b);
	const nGrade = Math.min(r.grid.n, truthBars.length);
	// hints on the padded mix
	const padded = new Float32Array(mix0.length + Math.floor(padSec * RATE));
	padded.set(mix0, Math.floor(padSec * RATE));
	const rawFile = join(dir, `${slug}-pad-mix.raw`);
	writeFileSync(rawFile, Buffer.from(padded.buffer, padded.byteOffset, padded.byteLength));
	const barsFile = `${rawFile}.bars.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", rawFile, "--out", `${barsFile}.out`, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np.exitCode !== 0) throw new Error(`nchord failed (${slug})`);
	const hintsRaw = (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar;
	// padded non-drum stem sum
	const manifest = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find((x) => x.slug === slug)!;
	const stems = manifest.stems
		.filter((st) => !/drum/i.test(st.name))
		.map((st) => loadRaw(`${root}corpus-mmkk/${slug}/${st.url.split("/").pop()}.22050.f32le.raw`));
	const len = Math.max(...stems.map((x) => x.length));
	const sum = new Float32Array(len + Math.floor(padSec * RATE));
	const off = Math.floor(padSec * RATE);
	for (const x of stems) for (let i = 0; i < x.length; i++) sum[off + i]! += x[i]!;
	let peak = 0;
	for (let i = 0; i < sum.length; i++) peak = Math.max(peak, Math.abs(sum[i]!));
	if (peak > 0) for (let i = 0; i < sum.length; i++) sum[i]! /= peak;
	const sumFile = join(dir, `${slug}-pad-sum.raw`);
	writeFileSync(sumFile, Buffer.from(sum.buffer, sum.byteOffset, sum.byteLength));
	const proc = Bun.spawnSync(
		["node", `${root}scripts/transcribe-child.mjs`, `${root}src/fixture/model.json`, `${root}src/fixture/weights.json`, sumFile],
		{ maxBuffer: 256 * 1024 * 1024 },
	);
	if (proc.exitCode !== 0) throw new Error(`transcription failed (${slug})`);
	const notes: Note[] = (JSON.parse(proc.stdout.toString()) as [number, number, number, number][]).map(
		([start, duration, pitch, amplitude]) => ({ start, end: start + duration, pitch, amplitude }),
	);
	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23({
			title: slug.replace(/-/g, " "),
			bpm: song.chart.bpm,
			key: song.key,
			meter: song.chart.meter,
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
		console.log(`[arm7] ${slug}: NO VALID ANSWER -> S32-G4 MISS`);
		g4 = false;
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const perBar = Array.from({ length: nGrade }, (_, i) => expanded[i] ?? "");
	const roots = rootScore(perBar, truthBars.slice(0, nGrade));
	const pct = roots.right / roots.bearing;
	const ok = pct >= song.refPct - 0.05;
	if (!ok) g4 = false;
	redrafts[slug] = { cls, anchor, roots, pct, refPct: song.refPct };
	console.log(`[arm7] ${slug}-pad1.0 re-draft: roots ${roots.right}/${roots.bearing} = ${(pct * 100).toFixed(1)}% (ref ${(song.refPct * 100).toFixed(1)}%) -> ${ok ? "ok" : "MISS"}`);
}

console.log(`\nS32-G1 (the humility gate with teeth): ${g1 ? "PASS" : "FAIL"}${g1Violations.length ? ` [${g1Violations.join("; ")}]` : ""}`);
console.log(`S32-G2 (no false moves; undecided ${undecidedCount}/${g2Items.length}): ${g2 ? "PASS" : "FAIL"}`);
console.log(`S32-G3 (originals keep their 31d verdicts): ${g3 ? "PASS" : "FAIL"}`);
console.log(`Arm 7 re-drafts follow the moved bar one: ${g4 ? "PASS" : "FAIL"}`);
console.log(`nchord calls ${nchordCalls} | tokens ${tokensIn} in / ${tokensOut} out`);
writeFileSync(
	`${root}results/study32.json`,
	`${JSON.stringify(
		{
			version: 1,
			model: MODEL,
			rows,
			redrafts,
			undecided: { count: undecidedCount, of: g2Items.length },
			gates: {
				"S32-G1": g1 ? "PASS" : "FAIL",
				"S32-G2": g2 ? "PASS" : "FAIL",
				"S32-G3": g3 ? "PASS" : "FAIL",
				"arm7": g4 ? "PASS" : "FAIL",
			},
			g1Violations,
			tokensIn,
			tokensOut,
		},
		null,
		"\t",
	)}\n`,
);
rmSync(dir, { recursive: true, force: true });
