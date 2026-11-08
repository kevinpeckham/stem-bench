/**
 * Study 31 (docs/BRIEF-STUDY31.md): the downbeat from witnesses the
 * song already carries. Seven witnesses vote by beat class on the
 * Study 28 lattice; G2 screens them on the one correct base (eat);
 * the surviving weighted vote is gated categorically; letter and
 * peaceful are re-drafted on the voted grid. Fence $0.5.
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
import { chromagram } from "../src/study12/chroma.js";
import { expandChords, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { highpass4 } from "../src/study29/backbeat.js";
import { lowpass4 } from "../src/study30/downbeat.js";
import {
	classOf,
	mod,
	rmsEnvelope,
	strongOnsets,
	type Vote,
	w1TimeZero,
	w2LastOnset,
	w3BothEnds,
	w4Harmonic,
	w5Crashes,
	w6Decide,
	w7Section,
	weightedVote,
} from "../src/study31/witnesses.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const WEIGHTS: Record<string, number> = { w1: 2, w2: 1, w3: 1, w4: 2, w5: 1, w6: 2, w7: 1 };

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
function histOf(times: number[], anchor: number, beat: number, beats: number): number[] {
	const h = new Array(beats).fill(0) as number[];
	for (const t of times) h[classOf(t, anchor, beat, beats)]!++;
	return h;
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

const dir = mkdtempSync(join(tmpdir(), "stem-bench31-"));
const perSong: Record<
	string,
	{
		grid: { anchor: number; period: number; n: number };
		beat: number;
		beats: number;
		truthCls: number;
		votes: Record<string, Vote>;
		span: { first: number; last: number };
	}
> = {};

// ---- Pass 1: every witness on every song ----
for (const song of SONGS) {
	const { chart } = song;
	const beats = beatsOf(chart.meter);
	const declared = (beats * 60) / chart.bpm;
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const feat = extractFeatures(asBuffer(mix, RATE));
	const grid = chartlessGrid(feat.onset, feat.fps, declared, mix, RATE);
	const span = audibleSpan(mix, RATE);
	const beat = grid.period / beats;
	const truthCls = classOf(song.truth, grid.anchor, beat, beats);
	const nBeats = grid.n * beats;
	const beatStarts = Array.from({ length: nBeats }, (_, j) => grid.anchor + j * beat);

	const votes: Record<string, Vote> = {};
	votes.w1 = w1TimeZero(grid.anchor, beat, beats);
	const pk = strongOnsets(feat.onset, feat.fps, beat, span);
	votes.w2 = w2LastOnset(pk, grid.anchor, beat, beats, span);
	votes.w3 = w3BothEnds(pk, grid.anchor, beat, beats);

	// W4: per-beat chord labels from the bench's nchord (disclosed substitution).
	const barsFile = join(dir, `beats-${chart.slug}.json`);
	const outFile = `${barsFile}.out.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts: beatStarts }));
	const np = Bun.spawnSync(
		[PY, NCHORD, "--raw", `${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`, "--out", outFile, "--bars", barsFile],
		{ maxBuffer: 64 * 1024 * 1024 },
	);
	if (np.exitCode !== 0) throw new Error(`nchord failed (${chart.slug})`);
	const labels = (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar;
	votes.w4 = w4Harmonic(labels, beats);

	// W5: crashes.
	const hpEnv = rmsEnvelope(highpass4(mix, RATE, 5000), RATE);
	votes.w5 = w5Crashes(hpEnv.env, hpEnv.fps, grid.anchor, beat, beats);

	// W6: the stems.
	const manifest = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
		(x) => x.slug === chart.slug,
	)!;
	const stemRaw = (s: { url: string }) =>
		loadRaw(`${root}corpus-mmkk/${chart.slug}/${s.url.split("/").pop()}.22050.f32le.raw`);
	const drumStem = manifest.stems.find((s) => /drum/i.test(s.name));
	const bassStem = manifest.stems.find((s) => /bass/i.test(s.name));
	let snareHist: number[] | null = null;
	let kickHist: number[] | null = null;
	let bassCls: number | null = null;
	let drumFirstHit: number | null = null;
	if (drumStem) {
		const drum = stemRaw(drumStem);
		const snareFeat = extractFeatures(asBuffer(lowpass4(highpass4(drum, RATE, 150), RATE, 2000), RATE));
		const kickFeat = extractFeatures(asBuffer(lowpass4(drum, RATE, 150), RATE));
		snareHist = histOf(strongOnsets(snareFeat.onset, snareFeat.fps, beat, span), grid.anchor, beat, beats);
		kickHist = histOf(strongOnsets(kickFeat.onset, kickFeat.fps, beat, span), grid.anchor, beat, beats);
		const drumFeat = extractFeatures(asBuffer(drum, RATE));
		drumFirstHit = strongOnsets(drumFeat.onset, drumFeat.fps, beat, { first: 0, last: span.last })[0] ?? null;
	}
	if (bassStem) {
		const bassFeat = extractFeatures(asBuffer(stemRaw(bassStem), RATE));
		const h = histOf(strongOnsets(bassFeat.onset, bassFeat.fps, beat, span), grid.anchor, beat, beats);
		bassCls = h.indexOf(Math.max(...h));
	}
	votes.w6 = w6Decide(snareHist, kickHist, bassCls, beats);

	// W7: section scale on beat-synchronous chroma.
	const ch = chromagram(mix);
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
	votes.w7 = raw7.cls === null ? raw7 : { cls: mod(raw7.cls + j0, beats), detail: raw7.detail };

	perSong[chart.slug] = { grid, beat, beats, truthCls, votes, span };
	const line = Object.entries(votes)
		.map(([k, vv]) => `${k}:${vv.cls === null ? "abstain" : vv.cls}`)
		.join(" ");
	console.log(
		`${chart.slug}: base cls 0, truth cls ${truthCls} | ${line}${drumFirstHit !== null ? ` | drum first hit ${drumFirstHit.toFixed(3)}s` : ""}`,
	);
	if (chart.slug === "eat-all-the-clocks") {
		const nonDrum = manifest.stems.filter((s) => !/drum/i.test(s.name)).map(stemRaw);
		const len = Math.max(...nonDrum.map((s) => s.length));
		const sum = new Float32Array(len);
		for (const s of nonDrum) for (let i = 0; i < s.length; i++) sum[i]! += s[i]!;
		const ndSpan = audibleSpan(sum, RATE);
		(perSong[chart.slug] as Record<string, unknown>).adjudication = {
			mixFirst: span.first,
			drumFirstHit,
			nonDrumFirst: ndSpan.first,
			truth: song.truth,
			verdict: span.first < song.truth - 0.4 * beat ? "PICKUP" : "PRE-ROLL",
		};
	}
}

// ---- G2 screen on the correct bases, then the vote ----
const dropped: string[] = [];
for (const [slug, s] of Object.entries(perSong)) {
	if (s.truthCls !== 0) continue; // only a correct base can be moved off
	for (const [name, vote] of Object.entries(s.votes))
		if (vote.cls !== null && vote.cls !== s.truthCls && !dropped.includes(name)) {
			dropped.push(name);
			console.log(`S31-G2: ${name} moved the correct base on ${slug} (voted ${vote.cls}) -> dropped from the vote`);
		}
}
const g2 = dropped.length === 0;

let g1 = true;
const decisions: Record<string, { scores: number[]; decided: number; undecided: boolean; correct: boolean }> = {};
for (const [slug, s] of Object.entries(perSong)) {
	const r = weightedVote(
		Object.entries(s.votes)
			.filter(([name]) => !dropped.includes(name))
			.map(([name, vote]) => ({ cls: vote.cls, weight: WEIGHTS[name]! })),
		s.beats,
	);
	const correct = !r.undecided && r.decided === s.truthCls;
	if (!correct) g1 = false;
	decisions[slug] = { scores: r.scores, decided: r.decided, undecided: r.undecided, correct };
	console.log(
		`${slug}: vote scores [${r.scores.join(", ")}] -> ${r.undecided ? "UNDECIDED (base stays)" : `class ${r.decided}`} | truth ${s.truthCls} -> ${correct ? "ok" : "MISS"}`,
	);
}

// ---- A1/A2: solo arms ----
const solo = (name: string) =>
	Object.values(perSong).filter((s) => s.votes[name]!.cls !== null && s.votes[name]!.cls === s.truthCls).length;
const a1 = solo("w1");
const a2 = solo("w4");
console.log(`A1 time zero alone: ${a1}/4 | A2 harmonic rhythm alone: ${a2}/4`);

// ---- A4: re-drafts on the voted grid ----
let g3 = true;
let tokensIn = 0;
let tokensOut = 0;
const redrafts: Record<string, unknown> = {};
for (const song of SONGS) {
	if (song.refPct === null) continue;
	const s = perSong[song.chart.slug]!;
	const d = decisions[song.chart.slug]!;
	let anchor = s.grid.anchor + (d.undecided ? 0 : d.decided) * s.beat;
	while (anchor >= s.span.first + s.grid.period) anchor -= s.grid.period;
	while (anchor < s.span.first - s.grid.period) anchor += s.grid.period;
	const barStarts = Array.from({ length: s.grid.n }, (_, i) => anchor + i * s.grid.period);
	const truthBars = bars(song.chart);
	const nGrade = Math.min(s.grid.n, truthBars.length);
	const barsFile = join(dir, `bars-${song.chart.slug}.json`);
	const outFile = `${barsFile}.out.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync(
		[PY, NCHORD, "--raw", `${root}corpus-mmkk/${song.chart.slug}/mix.mp3.22050.f32le.raw`, "--out", outFile, "--bars", barsFile],
		{ maxBuffer: 64 * 1024 * 1024 },
	);
	if (np.exitCode !== 0) throw new Error(`nchord failed (${song.chart.slug})`);
	const hintsRaw = (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar;
	const manifest = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
		(x) => x.slug === song.chart.slug,
	)!;
	const stems = manifest.stems
		.filter((st) => !/drum/i.test(st.name))
		.map((st) => loadRaw(`${root}corpus-mmkk/${song.chart.slug}/${st.url.split("/").pop()}.22050.f32le.raw`));
	const len = Math.max(...stems.map((x) => x.length));
	const sum = new Float32Array(len);
	for (const x of stems) for (let i = 0; i < x.length; i++) sum[i]! += x[i]!;
	let peak = 0;
	for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(sum[i]!));
	if (peak > 0) for (let i = 0; i < len; i++) sum[i]! /= peak;
	const rawFile = join(dir, `${song.chart.slug}.raw`);
	writeFileSync(rawFile, Buffer.from(sum.buffer, sum.byteOffset, sum.byteLength));
	const proc = Bun.spawnSync(
		["node", `${root}scripts/transcribe-child.mjs`, `${root}src/fixture/model.json`, `${root}src/fixture/weights.json`, rawFile],
		{ maxBuffer: 256 * 1024 * 1024 },
	);
	if (proc.exitCode !== 0) throw new Error(`transcription failed (${song.chart.slug})`);
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
			title: song.chart.slug.replace(/-/g, " "),
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
		console.log(`${song.chart.slug}: NO VALID ANSWER -> S31-G3 MISS`);
		g3 = false;
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const perBar = Array.from({ length: nGrade }, (_, i) => expanded[i] ?? "");
	const roots = rootScore(perBar, truthBars.slice(0, nGrade));
	const pct = roots.right / roots.bearing;
	const ok = pct >= song.refPct - 0.05;
	if (!ok) g3 = false;
	redrafts[song.chart.slug] = { roots, pct, refPct: song.refPct };
	console.log(
		`  re-draft on the voted grid: roots ${roots.right}/${roots.bearing} = ${(pct * 100).toFixed(1)}% (ref ${(song.refPct * 100).toFixed(1)}%) -> S31-G3 ${ok ? "ok" : "MISS"}`,
	);
}

console.log(`\nS31-G1 (the vote finds the true class on all four, none undecided): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S31-G2 (no witness moved a correct base, run alone): ${g2 ? "PASS" : "FAIL"}${dropped.length ? ` (dropped: ${dropped.join(", ")})` : ""}`);
console.log(`S31-G3 (re-drafts within 5 points of the references): ${g3 ? "PASS" : "FAIL"}`);
console.log(`tokens ${tokensIn} in / ${tokensOut} out`);
writeFileSync(
	`${root}results/study31.json`,
	`${JSON.stringify(
		{
			version: 1,
			model: MODEL,
			weights: WEIGHTS,
			songs: perSong,
			dropped,
			decisions,
			arms: { a1TimeZeroAlone: a1, a2HarmonicAlone: a2 },
			redrafts,
			gates: { "S31-G1": g1 ? "PASS" : "FAIL", "S31-G2": g2 ? "PASS" : "FAIL", "S31-G3": g3 ? "PASS" : "FAIL" },
			tokensIn,
			tokensOut,
		},
		null,
		"\t",
	)}\n`,
);
rmSync(dir, { recursive: true, force: true });
