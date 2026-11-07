/**
 * $0 design diagnostic for the alignment-ends ASK: per-bar DTW error
 * against the TRUE grid (declared period from the Study 25 anchors),
 * by position; where the short bars sit; the app's alignmentFit checks
 * computed on the bench corpus.
 */
import { readFileSync } from "node:fs";
import charts20b from "/home/exedev/projects/stem-bench/corpus/mmkk-charts-20b.json";
import mmkkCharts from "/home/exedev/projects/stem-bench/corpus/mmkk-charts.json";
import manifestMmkk from "/home/exedev/projects/stem-bench/corpus/fixture-mmkk.json";
import { chromagram } from "/home/exedev/projects/stem-bench/src/study12/chroma.js";
import { dtwAlign } from "/home/exedev/projects/stem-bench/src/study12/dtw.js";
import { type RefBar, renderReference } from "/home/exedev/projects/stem-bench/src/study12/reference.js";
import type { Meter4 } from "/home/exedev/projects/stem-bench/src/study4/synth4.js";

const root = "/home/exedev/projects/stem-bench/";
const RATE = 22050;
const ANCHORS: Record<string, number> = JSON.parse(
	readFileSync(`${root}results/study25.json`, "utf8"),
).songs
	? Object.fromEntries(
			Object.entries(
				(JSON.parse(readFileSync(`${root}results/study25.json`, "utf8")) as {
					songs: Record<string, { anchor: { time: number } }>;
				}).songs,
			).map(([k, v]) => [k, v.anchor.time]),
		)
	: {};

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
interface ChartSong { slug: string; bpm: number; meter: string; sections: { name: string; bars: string[][] }[]; }
const songs = [...(mmkkCharts.songs as ChartSong[]), ...(charts20b.songs as ChartSong[])];
const beatsOf = (m: string) => (m === "3/4" ? 3 : 4);

function envelopeSpan(x: Float32Array, thresholdFrac = 0.05): { first: number; last: number } {
	// crude RMS envelope at 10ms hops over a peak-normalized signal
	const hop = Math.round(RATE * 0.01);
	let peak = 0;
	for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]!));
	const thr = peak * thresholdFrac;
	let first = -1;
	let last = -1;
	for (let f = 0; f * hop < x.length; f++) {
		let m = 0;
		for (let i = f * hop; i < Math.min(x.length, (f + 1) * hop); i++) m = Math.max(m, Math.abs(x[i]!));
		if (m >= thr) {
			if (first < 0) first = f * 0.01;
			last = f * 0.01;
		}
	}
	return { first, last };
}

for (const chart of songs) {
	const period = (beatsOf(chart.meter) * 60) / chart.bpm;
	const anchor = ANCHORS[chart.slug]!;
	const refBars: RefBar[] = [];
	for (const s of chart.sections) for (const chords of s.bars) refBars.push({ chords: chords.map((c) => c.replace(/\(.*\)$/, "")), bpm: chart.bpm });
	const n = refBars.length;
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const dur = mix.length / RATE;
	const ref = renderReference(refBars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, { subsequence: true });
	const ts = ref.barStarts.map((s) => aligned.mapSeconds(s));

	// per-position error vs the TRUE grid
	const err = ts.map((t, i) => t - (anchor + i * period));
	const abs = (xs: number[]) => xs.map(Math.abs);
	const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
	const seg = (a: number, b: number) => abs(err.slice(a, b));
	const firstSeg = seg(0, 4);
	const lastSeg = seg(n - 4, n);
	const midSeg = seg(Math.floor(n * 0.2), Math.floor(n * 0.8));
	// where are the short bars (duration < 0.85 declared)?
	const durs = ts.slice(1).map((t, i) => t - ts[i]!);
	const shortIdx = durs.map((d, i) => ({ d, i })).filter((x) => x.d < 0.85 * period).map((x) => x.i);
	const inEnds = shortIdx.filter((i) => i < 8 || i >= n - 12).length;

	// the mix's audible span + the drum stems' span
	const mixSpan = envelopeSpan(mix);
	const m = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find((x) => x.slug === chart.slug)!;
	const drumStems = m.stems.filter((s) => /drum/i.test(s.name));
	let drumSpan = { first: -1, last: -1 };
	if (drumStems.length > 0) {
		const arrs = drumStems.map((s) => loadRaw(`${root}corpus-mmkk/${chart.slug}/${s.url.split("/").pop()}.22050.f32le.raw`));
		const len = Math.max(...arrs.map((a) => a.length));
		const sum = new Float32Array(len);
		for (const a of arrs) for (let i = 0; i < a.length; i++) sum[i]! += a[i]!;
		drumSpan = envelopeSpan(sum);
	}

	// the app's alignmentFit checks on the bench numbers
	const bar1Ok = Math.abs(ts[0]! - mixSpan.first) <= period;
	const sorted = [...durs].sort((a, b) => a - b);
	const median = sorted[Math.floor(sorted.length / 2)]!;
	const medianOk = Math.abs(median - period) / period <= 0.15;

	console.log(`\n${chart.slug} (declared bar ${period.toFixed(3)}s, true anchor ${anchor.toFixed(3)}s, ${n} bars, ${dur.toFixed(1)}s):`);
	console.log(`  |err| vs true grid: bars 1-4 ${firstSeg.map((x) => x.toFixed(2)).join("/")} | middle mean ${mean(midSeg).toFixed(2)}s max ${Math.max(...midSeg).toFixed(2)}s | last 4 ${lastSeg.map((x) => x.toFixed(2)).join("/")}`);
	console.log(`  short bars (<0.85 declared): ${shortIdx.length}/${n - 1}, in first 8/last 12 positions: ${inEnds} — positions ${shortIdx.slice(0, 14).join(",")}${shortIdx.length > 14 ? ",…" : ""}`);
	console.log(`  mix audible ${mixSpan.first.toFixed(2)}–${mixSpan.last.toFixed(2)}s | drums ${drumSpan.first.toFixed(2)}–${drumSpan.last.toFixed(2)}s`);
	console.log(`  app alignmentFit on bench numbers: bar1 ${bar1Ok ? "ok" : "FAIL"} (ts0 ${ts[0]!.toFixed(2)} vs firstSound ${mixSpan.first.toFixed(2)}) | median ${median.toFixed(3)} ${medianOk ? "ok" : "FAIL"} (${((Math.abs(median - period) / period) * 100).toFixed(1)}% off)`);
}
