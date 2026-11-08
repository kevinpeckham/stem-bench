/**
 * Study 29 (docs/BRIEF-STUDY29.md): can a backbeat-heavy mix pull
 * recipe v5 off the downbeat? Arms 1/2 synthetic catch maps, arm 3
 * kick-removed real mixes (gated), arm 4 the real phase errors in
 * beats. $0.
 */
import { readFileSync, writeFileSync } from "node:fs";
import charts20b from "../corpus/mmkk-charts-20b.json";
import eatV131 from "../corpus/mmkk-charts-eat-v131.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import { jointOnsetComb } from "../src/study24/tempo.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { rephaseGrid } from "../src/study27/rephase.js";
import { beatEnvelope, classifyGrid, FPS, highpass4 } from "../src/study29/backbeat.js";
import type { Meter4 } from "../src/study4/synth4.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const study27 = JSON.parse(readFileSync(`${root}results/study27.json`, "utf8")) as {
	armA: { winner: { anchor: number } };
	songs: Record<string, { delta?: number }>;
};
const study25 = JSON.parse(readFileSync(`${root}results/study25.json`, "utf8")) as {
	songs: Record<string, { anchor: { time: number } }>;
};

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
const out: Record<string, unknown> = {};

// ---- Arm 1: synthetic catch map ----
const catchMap: Record<string, Record<string, [number, number]>> = {};
for (const bpm of [120, 200]) {
	const beat = 60 / bpm;
	const period = 4 * beat;
	const anchor = 1.0;
	for (const w of [1.0, 0.6, 0.3, 0.1]) {
		const env = beatEnvelope(bpm, 60, anchor, w);
		let lo = Number.POSITIVE_INFINITY;
		let hi = Number.NEGATIVE_INFINITY;
		for (let x = -1.0; x <= 1.0001; x += 0.05) {
			const ts = Array.from({ length: 60 }, (_, i) => anchor + x * beat + i * period);
			const v5 = rephaseGrid(ts, env, FPS, period, 4);
			if (!v5) continue;
			const cls = classifyGrid(v5.barStarts[0]!, anchor, bpm);
			if (cls === "downbeat") {
				lo = Math.min(lo, x);
				hi = Math.max(hi, x);
			}
		}
		catchMap[`${bpm}bpm`] ??= {};
		catchMap[`${bpm}bpm`]![`w=${w}`] = [Number(lo.toFixed(2)), Number(hi.toFixed(2))];
		console.log(`Arm 1 ${bpm} bpm w=${w}: downbeat caught for x in [${lo.toFixed(2)}, ${hi.toFixed(2)}] beats`);
	}
}
out.arm1 = catchMap;

// ---- Arm 2: in-window competitors (120 bpm, w=0.3, x=0) ----
const arm2: Record<string, { deltaBeats: number; cls: string }> = {};
{
	const bpm = 120;
	const beat = 60 / bpm;
	const period = 4 * beat;
	const anchor = 1.0;
	const ts = Array.from({ length: 60 }, (_, i) => anchor + i * period);
	for (const h of [0, 0.3, 0.6, 1.0]) {
		for (const pickup of [0, 0.8]) {
			const env = beatEnvelope(bpm, 60, anchor, 0.3, {
				hihatW: h || undefined,
				pickupW: pickup || undefined,
			});
			const v5 = rephaseGrid(ts, env, FPS, period, 4);
			if (!v5) continue;
			const key = `h=${h},pickup=${pickup}`;
			const deltaBeats = v5.delta / beat;
			const cls = Math.abs(deltaBeats) <= 0.1 ? "downbeat" : classifyGrid(v5.barStarts[0]!, anchor, bpm);
			arm2[key] = { deltaBeats: Number(deltaBeats.toFixed(3)), cls };
			console.log(`Arm 2 ${key}: delta ${deltaBeats.toFixed(3)} beats (${cls})`);
		}
	}
}
out.arm2 = arm2;

// ---- Arms 3 + 4 + G2 control: real songs ----
const cases: { chart: ChartSong; truthAnchor: number }[] = [
	{
		chart: (mmkkCharts.songs as ChartSong[]).find((s) => s.slug === "letter-lands")!,
		truthAnchor: study25.songs["letter-lands"]!.anchor.time,
	},
	{
		chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "peaceful-dreams")!,
		truthAnchor: study25.songs["peaceful-dreams"]!.anchor.time,
	},
	{
		chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "mop-heart")!,
		truthAnchor: study27.armA.winner.anchor,
	},
	{
		chart: { ...(eatV131.songs as ChartSong[])[0]!, slug: "eat-all-the-clocks" },
		truthAnchor: study25.songs["eat-all-the-clocks"]!.anchor.time,
	},
];

function runV5(chart: ChartSong, mix: Float32Array) {
	const refBars: RefBar[] = [];
	for (const s of chart.sections)
		for (const chords of s.bars)
			refBars.push({
				chords: chords.map((c) => c.replace(/\(.*\)$/, "")).filter((c) => c !== "" && c !== "N.C."),
				bpm: chart.bpm,
			});
	for (const r of refBars) if (r.chords.length === 0) r.chords = ["A5"];
	const ref = renderReference(refBars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const ts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	const feat = extractFeatures(asBuffer(mix, RATE));
	const period = (beatsOf(chart.meter) * 60) / chart.bpm;
	const comb = jointOnsetComb(feat.onset, feat.fps, period);
	return { v5: rephaseGrid(ts, feat.onset, feat.fps, comb.period, beatsOf(chart.meter)), ts, period };
}

let g1 = true;
let g2 = true;
const arm3: Record<string, unknown> = {};
const arm4: Record<string, unknown> = {};
const fmt = (xs: number[]) => xs.map((x) => x.toFixed(2)).join("/");
for (const c of cases) {
	const slug = c.chart.slug;
	const period = (beatsOf(c.chart.meter) * 60) / c.chart.bpm;
	const beat = period / beatsOf(c.chart.meter);
	const mix = loadRaw(`${root}corpus-mmkk/${slug}/mix.mp3.22050.f32le.raw`);

	// G2 control: full mix reproduces Study 27.
	const full = runV5(c.chart, mix);
	const prior = study27.songs[slug === "eat-all-the-clocks" ? "eat-71-corrected" : slug] as { delta?: number };
	const controlOk =
		full.v5 !== null && prior?.delta !== undefined && Math.abs(full.v5.delta - prior.delta) <= 0.002;
	if (!controlOk) g2 = false;

	// Arm 4: real phase error in beats (the delta the slide applied, plus
	// mop's DTW-phase distance to the lattice).
	const deltaBeats = full.v5 ? Math.abs(full.v5.delta) / beat : Number.NaN;
	arm4[slug] = { deltaBeats: Number(deltaBeats.toFixed(3)) };
	if (slug === "mop-heart" && full.v5) {
		const dtwPhase = full.v5.barStarts[0]! - full.v5.delta;
		const err = Math.abs(dtwPhase - c.truthAnchor) / beat;
		(arm4[slug] as Record<string, number>).dtwPhaseErrBeats = Number(err.toFixed(3));
	}

	// Arm 3: kick-removed mix.
	const manifest = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
		(x) => x.slug === slug,
	)!;
	const parts: Float32Array[] = [];
	for (const stem of manifest.stems) {
		const s = loadRaw(`${root}corpus-mmkk/${slug}/${stem.url.split("/").pop()}.22050.f32le.raw`);
		parts.push(/drum/i.test(stem.name) ? highpass4(s, RATE, 150) : s);
	}
	const len = Math.max(...parts.map((s) => s.length));
	const remix = new Float32Array(len);
	for (const s of parts) for (let i = 0; i < s.length; i++) remix[i]! += s[i]!;
	let peak = 0;
	for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(remix[i]!));
	if (peak > 0) for (let i = 0; i < len; i++) remix[i]! /= peak;

	const hp = runV5(c.chart, remix);
	if (!hp.v5) {
		console.log(`${slug} (kick removed): v5 REFUSED -> S29-G1 MISS`);
		g1 = false;
		arm3[slug] = { outcome: "refused" };
		continue;
	}
	const n = hp.v5.barStarts.length;
	const trueGrid = Array.from({ length: n }, (_, i) => c.truthAnchor + i * period);
	const e = (i: number) => Math.abs(hp.v5!.barStarts[i]! - trueGrid[i]!);
	const first4 = [0, 1, 2, 3].map(e);
	const last4 = [n - 4, n - 3, n - 2, n - 1].map(e);
	const lo = Math.floor(0.2 * n);
	const hi = Math.ceil(0.8 * n);
	const midMean = Array.from({ length: hi - lo }, (_, k) => e(lo + k)).reduce((a, b) => a + b, 0) / (hi - lo);
	const span = audibleSpan(remix, RATE);
	const bar1Ok = Math.abs(hp.v5.barStarts[0]! - span.first) <= period;
	const endsOk = [...first4, ...last4].every((x) => x <= 0.25 * period);
	const midLimit = slug === "mop-heart" ? 0.15 : slug === "eat-all-the-clocks" ? Number.POSITIVE_INFINITY : 0.1;
	const ok = endsOk && midMean <= midLimit && (slug !== "mop-heart" || bar1Ok);
	if (!ok) g1 = false;
	const confSplit = hp.v5.confidence.filter((x) => x === "aligned").length;
	arm3[slug] = {
		deltaBeats: Number((hp.v5.delta / beat).toFixed(3)),
		first4,
		last4,
		midMean,
		alignedBars: `${confSplit}/${n}`,
	};
	console.log(
		`${slug} (kick removed): delta ${(hp.v5.delta / beat).toFixed(3)} beats | first4 ${fmt(first4)} | last4 ${fmt(last4)} | mid mean ${midMean.toFixed(3)}s | aligned ${confSplit}/${n} | control(full mix = study27) ${controlOk ? "ok" : "DRIFT"} -> S29-G1 ${ok ? "ok" : "MISS"}`,
	);
}
out.arm3 = arm3;
out.arm4 = arm4;

console.log(`\nS29-G1 (kick-removed mixes keep the Study 27 standards): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S29-G2 (full-mix control reproduces Study 27): ${g2 ? "PASS" : "FAIL"}`);
writeFileSync(
	`${root}results/study29.json`,
	`${JSON.stringify(
		{ version: 1, ...out, gates: { "S29-G1": g1 ? "PASS" : "FAIL", "S29-G2": g2 ? "PASS" : "FAIL" } },
		null,
		"\t",
	)}\n`,
);
