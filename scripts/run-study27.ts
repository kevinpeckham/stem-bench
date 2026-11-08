/**
 * Study 27 (docs/BRIEF-STUDY27.md): Arm A adjudicates mop-heart's true
 * anchor (oracle vs mix-comb vs drums-comb, hint-root scored); Arm B
 * runs recipe v5 (whole-grid re-phase, half-beat fence) on all songs,
 * with eat-all-the-clocks against both the superseded 86-bar fixture
 * and the corrected 71-bar chart. $0: no model calls.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import charts20b from "../corpus/mmkk-charts-20b.json";
import eatV131 from "../corpus/mmkk-charts-eat-v131.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import { rootScore } from "../src/study23/grade23.js";
import { jointOnsetComb } from "../src/study24/tempo.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { rephaseGrid } from "../src/study27/rephase.js";
import type { Meter4 } from "../src/study4/synth4.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
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
function bars(chart: ChartSong): string[][] {
	const out: string[][] = [];
	for (const s of chart.sections) for (const b of s.bars) out.push(b);
	return out;
}
const dir = mkdtempSync(join(tmpdir(), "stem-bench27-"));
function hintsFor(mixRaw: string, barStarts: number[], tag: string): string[] {
	const barsFile = join(dir, `bars-${tag}.json`);
	const outFile = `${barsFile}.out.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", mixRaw, "--out", outFile, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np.exitCode !== 0) throw new Error(`nchord failed (${tag})`);
	return (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar;
}

function alignAndFeatures(chart: ChartSong, mix: Float32Array) {
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
	return { ts, feat };
}

const out: Record<string, unknown> = {};

// ---- Arm A: mop-heart anchor adjudication ----
const mopChart = (charts20b.songs as ChartSong[]).find((s) => s.slug === "mop-heart")!;
const mopTruthBars = bars(mopChart);
const mopPeriod = (beatsOf(mopChart.meter) * 60) / mopChart.bpm;
const mopMixRaw = `${root}corpus-mmkk/mop-heart/mix.mp3.22050.f32le.raw`;
const mopMix = loadRaw(mopMixRaw);
const { ts: mopTs, feat: mopFeat } = alignAndFeatures(mopChart, mopMix);
const mopComb = jointOnsetComb(mopFeat.onset, mopFeat.fps, mopPeriod);
const v5Mix = rephaseGrid(mopTs, mopFeat.onset, mopFeat.fps, mopComb.period, beatsOf(mopChart.meter));
if (!v5Mix) throw new Error("v5 refused mop on the mix: cannot adjudicate");

const mopManifest = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
	(s) => s.slug === "mop-heart",
)!;
const drumStem = mopManifest.stems.find((s) => /drum/i.test(s.name));
if (!drumStem) throw new Error("mop-heart has no drum stem");
const drums = loadRaw(`${root}corpus-mmkk/mop-heart/${drumStem.url.split("/").pop()}.22050.f32le.raw`);
const drumFeat = extractFeatures(asBuffer(drums, RATE));
const v5Drums = rephaseGrid(mopTs, drumFeat.onset, drumFeat.fps, mopComb.period, beatsOf(mopChart.meter));
if (!v5Drums) throw new Error("v5 refused mop on drums: cannot adjudicate");

const candidates: { id: string; anchor: number }[] = [
	{ id: "A1-oracle", anchor: study25.songs["mop-heart"]!.anchor.time },
	{ id: "A2-mix-comb", anchor: v5Mix.barStarts[0]! },
	{ id: "A3-drums-comb", anchor: v5Drums.barStarts[0]! },
];
const n140 = mopTruthBars.length;
const scores: Record<string, { anchor: number; right: number; bearing: number }> = {};
for (const c of candidates) {
	const grid = Array.from({ length: n140 }, (_, i) => c.anchor + i * mopPeriod);
	const h = hintsFor(mopMixRaw, grid, c.id);
	const s = rootScore(
		Array.from({ length: n140 }, (_, i) => h[i] ?? ""),
		mopTruthBars,
	);
	scores[c.id] = { anchor: c.anchor, right: s.right, bearing: s.bearing };
	console.log(`Arm A ${c.id}: anchor ${c.anchor.toFixed(3)}s -> hints ${s.right}/${s.bearing}`);
}
// Registered rule: highest root score wins; ties within 1 root -> A3.
const ranked = candidates.map((c) => ({ ...c, right: scores[c.id]!.right })).sort((a, b) => b.right - a.right);
const top = ranked[0]!;
const a3 = scores["A3-drums-comb"]!;
const winner = a3.right >= top.right - 1 ? { id: "A3-drums-comb", anchor: a3.anchor } : top;
console.log(`Arm A refined mop anchor: ${winner.id} at ${winner.anchor.toFixed(3)}s`);
out.armA = { scores, winner };

// ---- Arm B: v5 on all songs ----
const cases: { key: string; chart: ChartSong; truthAnchor: number | null; expectRefusal: boolean }[] = [
	{
		key: "letter-lands",
		chart: (mmkkCharts.songs as ChartSong[]).find((s) => s.slug === "letter-lands")!,
		truthAnchor: study25.songs["letter-lands"]!.anchor.time,
		expectRefusal: false,
	},
	{
		key: "peaceful-dreams",
		chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "peaceful-dreams")!,
		truthAnchor: study25.songs["peaceful-dreams"]!.anchor.time,
		expectRefusal: false,
	},
	{ key: "mop-heart", chart: mopChart, truthAnchor: winner.anchor, expectRefusal: false },
	{
		key: "eat-86-fixture",
		chart: (mmkkCharts.songs as ChartSong[]).find((s) => s.slug === "eat-all-the-clocks")!,
		truthAnchor: null,
		expectRefusal: true,
	},
	{
		key: "eat-71-corrected",
		chart: { ...(eatV131.songs as ChartSong[])[0]!, slug: "eat-all-the-clocks" },
		truthAnchor: study25.songs["eat-all-the-clocks"]!.anchor.time,
		expectRefusal: false,
	},
];

let g1 = true;
let g2 = true;
let g3 = true;
const fmt = (xs: number[]) => xs.map((x) => x.toFixed(2)).join("/");
for (const c of cases) {
	const period = (beatsOf(c.chart.meter) * 60) / c.chart.bpm;
	const slugDir = c.chart.slug;
	const mix = c.key === "mop-heart" ? mopMix : loadRaw(`${root}corpus-mmkk/${slugDir}/mix.mp3.22050.f32le.raw`);
	const { ts, feat } = c.key === "mop-heart" ? { ts: mopTs, feat: mopFeat } : alignAndFeatures(c.chart, mix);
	const comb = c.key === "mop-heart" ? mopComb : jointOnsetComb(feat.onset, feat.fps, period);
	const v5 = rephaseGrid(ts, feat.onset, feat.fps, comb.period, beatsOf(c.chart.meter));
	if (!v5) {
		console.log(`${c.key}: v5 REFUSED ${c.expectRefusal ? "(registered right answer)" : "-> GATE MISS"}`);
		out[c.key] = { outcome: "refused" };
		if (!c.expectRefusal) {
			if (c.key === "mop-heart") g1 = false;
			else if (c.key === "eat-71-corrected") g3 = false;
			else g2 = false;
		}
		continue;
	}
	if (c.expectRefusal) {
		console.log(`${c.key}: v5 did NOT refuse -> S27-G3 MISS`);
		g3 = false;
		out[c.key] = { outcome: "not-refused", delta: v5.delta };
		continue;
	}
	const n = v5.barStarts.length;
	const trueGrid = Array.from({ length: n }, (_, i) => c.truthAnchor! + i * period);
	const e = (i: number) => Math.abs(v5.barStarts[i]! - trueGrid[i]!);
	const first4 = [0, 1, 2, 3].map(e);
	const last4 = [n - 4, n - 3, n - 2, n - 1].map(e);
	const lo = Math.floor(0.2 * n);
	const hi = Math.ceil(0.8 * n);
	const midErrs = Array.from({ length: hi - lo }, (_, k) => e(lo + k));
	const midMean = midErrs.reduce((a, b) => a + b, 0) / midErrs.length;
	const span = audibleSpan(mix, RATE);
	const bar1Ok = Math.abs(v5.barStarts[0]! - span.first) <= period;
	const durs = v5.barStarts.slice(1).map((t, i) => t - v5.barStarts[i]!);
	const median = [...durs].sort((a, b) => a - b)[Math.floor((durs.length - 1) / 2)]!;
	const medianOk = Math.abs(median - period) / period <= 0.15;
	const endsOk = [...first4, ...last4].every((x) => x <= 0.25 * period);
	out[c.key] = {
		outcome: "re-phased",
		delta: v5.delta,
		combPeriod: comb.period,
		first4,
		last4,
		midMean,
		appAccept: { bar1Ok, medianOk },
		endsWithinQuarterBar: endsOk,
	};
	let gateNote = "";
	if (c.key === "mop-heart") {
		const ok = endsOk && midMean <= 0.15 && bar1Ok && medianOk;
		if (!ok) g1 = false;
		gateNote = `S27-G1 ${ok ? "ok" : "MISS"}`;
	} else if (c.key === "eat-71-corrected") {
		if (!endsOk) g3 = false;
		gateNote = `S27-G3(ends) ${endsOk ? "ok" : "MISS"}`;
	} else {
		const ok = endsOk && midMean <= 0.1;
		if (!ok) g2 = false;
		gateNote = `S27-G2 ${ok ? "ok" : "MISS"}`;
	}
	console.log(
		`${c.key}: delta ${v5.delta >= 0 ? "+" : ""}${v5.delta.toFixed(3)}s | first4 ${fmt(first4)} | last4 ${fmt(last4)} | mid mean ${midMean.toFixed(3)}s | app ${bar1Ok && medianOk ? "ok" : "FAIL"} -> ${gateNote}`,
	);
}

console.log(`\nS27-G1 (mop on the refined true grid): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S27-G2 (letter + peaceful, no regression): ${g2 ? "PASS" : "FAIL"}`);
console.log(`S27-G3 (eat: 86-fixture refused, 71-chart repaired): ${g3 ? "PASS" : "FAIL"}`);
writeFileSync(
	`${root}results/study27.json`,
	`${JSON.stringify(
		{
			version: 1,
			armA: out.armA,
			songs: out,
			gates: { "S27-G1": g1 ? "PASS" : "FAIL", "S27-G2": g2 ? "PASS" : "FAIL", "S27-G3": g3 ? "PASS" : "FAIL" },
		},
		null,
		"\t",
	)}\n`,
);
rmSync(dir, { recursive: true, force: true });
