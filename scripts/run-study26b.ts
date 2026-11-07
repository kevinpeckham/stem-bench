/**
 * Study 26b (docs/BRIEF-STUDY26.md, addendum): recipe v2 — the onset
 * joint comb's period replaces the LSQ slope, end slide ±0.5·period.
 * $0, gates S26B-G1/G2.
 */
import { readFileSync, writeFileSync } from "node:fs";
import charts20b from "../corpus/mmkk-charts-20b.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import { jointOnsetComb } from "../src/study24/tempo.js";
import { audibleSpan, repairEndsV2 } from "../src/study26/recipe.js";
import type { Meter4 } from "../src/study4/synth4.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const study25 = JSON.parse(readFileSync(`${root}results/study25.json`, "utf8")) as {
	songs: Record<string, { anchor: { time: number } }>;
};

interface ChartSong {
	slug: string;
	bpm: number;
	meter: string;
	sections: { name: string; bars: string[][] }[];
}
function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
const songs = [...(mmkkCharts.songs as ChartSong[]), ...(charts20b.songs as ChartSong[])];
const beatsOf = (m: string) => (m === "3/4" ? 3 : 4);
const MATCHED = new Set(["letter-lands", "peaceful-dreams", "mop-heart"]);
const out: Record<string, unknown> = {};
let g1 = true;
let g2 = true;
const fmt = (xs: number[]) => xs.map((x) => x.toFixed(2)).join("/");

for (const chart of songs) {
	const period = (beatsOf(chart.meter) * 60) / chart.bpm;
	const anchor = study25.songs[chart.slug]!.anchor.time;
	const refBars: RefBar[] = [];
	for (const s of chart.sections)
		for (const chords of s.bars)
			refBars.push({ chords: chords.map((c) => c.replace(/\(.*\)$/, "")), bpm: chart.bpm });
	const n = refBars.length;
	const trueGrid = Array.from({ length: n }, (_, i) => anchor + i * period);
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const ref = renderReference(refBars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const ts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	const feat = extractFeatures(asBuffer(mix, RATE));
	const comb = jointOnsetComb(feat.onset, feat.fps, period);
	const mixSpan = audibleSpan(mix, RATE);

	const V3 = process.argv.includes("--v3");
	const recipe = repairEndsV2(ts, feat.onset, feat.fps, comb.period, V3 ? 0.25 : undefined);
	console.log(
		`\n${chart.slug}: comb period ${comb.period.toFixed(4)}s (declared ${period.toFixed(4)}s)`,
	);
	if (!recipe) {
		out[chart.slug] = { combPeriod: comb.period, R4b: { outcome: "refused" } };
		if (MATCHED.has(chart.slug)) g1 = false;
		console.log(
			`  v2: REFUSED ${chart.slug === "eat-all-the-clocks" ? "-> S26B-G2 ok" : "-> S26B-G1 MISS"}`,
		);
		continue;
	}
	if (chart.slug === "eat-all-the-clocks") g2 = false;
	const e = (i: number) => Math.abs(recipe.barStarts[i]! - trueGrid[i]!);
	const first4 = [0, 1, 2, 3].map(e);
	const last4 = [n - 4, n - 3, n - 2, n - 1].map(e);
	const durs = recipe.barStarts.slice(1).map((t, i) => t - recipe.barStarts[i]!);
	const median = [...durs].sort((a, b) => a - b)[Math.floor((durs.length - 1) / 2)]!;
	const bar1Ok = Math.abs(recipe.barStarts[0]! - mixSpan.first) <= period;
	const medianOk = Math.abs(median - period) / period <= 0.15;
	const endsOk = [...first4, ...last4].every((x) => x <= 0.25 * period);
	const ok = bar1Ok && medianOk && endsOk;
	if (MATCHED.has(chart.slug) && !ok) g1 = false;
	out[chart.slug] = {
		combPeriod: comb.period,
		R4b: {
			outcome: "repaired",
			trusted: { iFirst: recipe.iFirst, iLast: recipe.iLast },
			slides: recipe.slides,
			first4,
			last4,
			median,
			bar1: recipe.barStarts[0],
			firstSound: mixSpan.first,
			appAccept: { bar1Ok, medianOk },
			endsWithinQuarterBar: endsOk,
		},
	};
	console.log(
		`  v2: trusted ${recipe.iFirst}..${recipe.iLast} | slides ${recipe.slides.intro.toFixed(2)}/${recipe.slides.outro.toFixed(2)}s | first4 ${fmt(first4)} | last4 ${fmt(last4)} | bar1 ${bar1Ok ? "ok" : "FAIL"} median ${medianOk ? "ok" : "FAIL"} ends<=0.25bar ${endsOk ? "ok" : "FAIL"} -> S26B-G1 ${MATCHED.has(chart.slug) ? (ok ? "ok" : "MISS") : "n/a"}`,
	);
}

writeFileSync(
	`${root}results/study26${process.argv.includes("--v3") ? "c" : "b"}.json`,
	`${JSON.stringify({ version: 1, songs: out }, null, "\t")}\n`,
);
console.log(`\nS26B/C-G1 (recipe: app acceptance + ends within 0.25 bar of truth, three matched songs): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S26B/C-G2 (refuses eat-all-the-clocks): ${g2 ? "PASS" : "FAIL"}`);
