/**
 * Study 26 (docs/BRIEF-STUDY26.md): the alignment-ends repair. $0 —
 * no model calls. Per song: baseline DTW vs the true grid, arm R4 (the
 * repair recipe) with gates S26-G1/G2, arm R1 (trim-to-drums ablation)
 * for gate S26-G3.
 */
import { readFileSync, writeFileSync } from "node:fs";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import charts20b from "../corpus/mmkk-charts-20b.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import {
	audibleSpan,
	interiorFit,
	repairEnds,
} from "../src/study26/recipe.js";
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
let g3 = true;

function align(refFrames: Float32Array[], mix: Float32Array, barStartsRef: number[]): number[] {
	const rec = chromagram(mix);
	const aligned = dtwAlign(refFrames, rec.frames, rec.hopSec, { subsequence: true });
	return barStartsRef.map((s) => aligned.mapSeconds(s));
}

function endErrors(bars: number[], trueGrid: number[], n: number): { first4: number[]; last4: number[] } {
	const e = (i: number) => Math.abs((bars[i] ?? Number.POSITIVE_INFINITY) - trueGrid[i]!);
	return {
		first4: [0, 1, 2, 3].map(e),
		last4: [n - 4, n - 3, n - 2, n - 1].map(e),
	};
}
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
	const refFrames = chromagram(ref.samples).frames;
	const ts = align(refFrames, mix, ref.barStarts);
	const base = endErrors(ts, trueGrid, n);
	const mixSpan = audibleSpan(mix, RATE);
	console.log(`\n${chart.slug} (bar ${period.toFixed(3)}s, true anchor ${anchor.toFixed(3)}s):`);
	console.log(`  baseline |err| vs truth: first4 ${fmt(base.first4)} | last4 ${fmt(base.last4)}`);

	// R4 — the repair recipe.
	const feat = extractFeatures(asBuffer(mix, RATE));
	const recipe = repairEnds(ts, feat.onset, feat.fps);
	let r4: Record<string, unknown>;
	if (!recipe) {
		r4 = { outcome: "refused" };
		if (MATCHED.has(chart.slug)) g1 = false;
		if (chart.slug === "eat-all-the-clocks") {
			console.log("  R4: REFUSED (trusted span under half the bars) -> S26-G2 ok");
		} else {
			console.log("  R4: REFUSED -> S26-G1 MISS");
		}
	} else {
		const errs = endErrors(recipe.barStarts, trueGrid, n);
		const durs = recipe.barStarts.slice(1).map((t, i) => t - recipe.barStarts[i]!);
		const median = [...durs].sort((a, b) => a - b)[Math.floor((durs.length - 1) / 2)]!;
		const bar1Ok = Math.abs(recipe.barStarts[0]! - mixSpan.first) <= period;
		const medianOk = Math.abs(median - period) / period <= 0.15;
		const endsOk = [...errs.first4, ...errs.last4].every((e) => e <= 0.25 * period);
		const ok = bar1Ok && medianOk && endsOk;
		if (MATCHED.has(chart.slug) && !ok) g1 = false;
		if (chart.slug === "eat-all-the-clocks") g2 = false; // should have refused
		const periodErrPct = (Math.abs(recipe.interiorPeriod - period) / period) * 100;
		r4 = {
			outcome: "repaired",
			interiorPeriod: recipe.interiorPeriod,
			interiorPeriodErrPct: Math.round(periodErrPct * 100) / 100,
			trusted: { iFirst: recipe.iFirst, iLast: recipe.iLast },
			slides: recipe.slides,
			bar1: recipe.barStarts[0],
			firstSound: mixSpan.first,
			median,
			first4: errs.first4,
			last4: errs.last4,
			appAccept: { bar1Ok, medianOk },
			endsWithinQuarterBar: endsOk,
		};
		console.log(
			`  R4: interior ${recipe.interiorPeriod.toFixed(4)}s (${periodErrPct.toFixed(2)}% off declared) | trusted ${recipe.iFirst}..${recipe.iLast} | slides ${recipe.slides.intro.toFixed(2)}/${recipe.slides.outro.toFixed(2)}s`,
		);
		console.log(
			`  R4 |err| vs truth: first4 ${fmt(errs.first4)} | last4 ${fmt(errs.last4)} | bar1 ${bar1Ok ? "ok" : "FAIL"} median ${medianOk ? "ok" : "FAIL"} ends<=0.25bar ${endsOk ? "ok" : "FAIL"} -> S26-G1 ${MATCHED.has(chart.slug) ? (ok ? "ok" : "MISS") : "n/a"}`,
		);
	}

	// R1 — trim-to-drums ablation.
	const m = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
		(x) => x.slug === chart.slug,
	)!;
	const drumStems = m.stems.filter((s) => /drum/i.test(s.name));
	let r1: Record<string, unknown> | null = null;
	if (drumStems.length > 0) {
		const arrs = drumStems.map((s) =>
			loadRaw(`${root}corpus-mmkk/${chart.slug}/${s.url.split("/").pop()}.22050.f32le.raw`),
		);
		const len = Math.max(...arrs.map((a) => a.length));
		const drums = new Float32Array(len);
		for (const a of arrs) for (let i = 0; i < a.length; i++) drums[i]! += a[i]!;
		const span = audibleSpan(drums, RATE);
		const from = Math.max(0, Math.round((span.first - 0.5) * RATE));
		const to = Math.min(mix.length, Math.round((span.last + 0.5) * RATE));
		const sliced = mix.slice(from, to);
		const tsSliced = align(refFrames, sliced, ref.barStarts).map((t) => t + from / RATE);
		const errs = endErrors(tsSliced, trueGrid, n);
		const within = [...errs.first4, ...errs.last4].every((e) => e <= period);
		if ((chart.slug === "letter-lands" || chart.slug === "peaceful-dreams") && !within) g3 = false;
		r1 = {
			drumSpan: span,
			first4: errs.first4,
			last4: errs.last4,
			endsWithinOneBar: within,
		};
		console.log(
			`  R1 (trim to drums ${span.first.toFixed(2)}–${span.last.toFixed(2)}s) |err| vs truth: first4 ${fmt(errs.first4)} | last4 ${fmt(errs.last4)} -> ${within ? "ends within one bar" : "still off"}`,
		);
	}

	out[chart.slug] = {
		declared: { bpm: chart.bpm, meter: chart.meter, period },
		anchor,
		bars: n,
		firstSound: mixSpan.first,
		baseline: { first4: base.first4, last4: base.last4 },
		R4: r4,
		R1: r1,
	};
}

writeFileSync(
	`${root}results/study26.json`,
	`${JSON.stringify({ version: 1, songs: out }, null, "\t")}\n`,
);
console.log(`\nS26-G1 (recipe: app acceptance + ends within 0.25 bar of truth, three matched songs): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S26-G2 (recipe refuses eat-all-the-clocks): ${g2 ? "PASS" : "FAIL"}`);
console.log(`S26-G3 (trim-to-drums brings letter/peaceful ends within one bar): ${g3 ? "PASS" : "FAIL"}`);
