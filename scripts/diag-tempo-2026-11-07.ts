/**
 * $0 diagnostic (not a scored study): is each mmkk recording's bar
 * period constant, and at what value — measured straight off the onset
 * envelope with a wide fine comb sweep, no DTW ruler involved. Then:
 * does the DTW truth agree globally, locally, or not at all?
 */
import { readFileSync } from "node:fs";
import charts20b from "/home/exedev/projects/stem-bench/corpus/mmkk-charts-20b.json";
import mmkkCharts from "/home/exedev/projects/stem-bench/corpus/mmkk-charts.json";
import { chromagram } from "/home/exedev/projects/stem-bench/src/study12/chroma.js";
import { dtwAlign } from "/home/exedev/projects/stem-bench/src/study12/dtw.js";
import { type RefBar, renderReference } from "/home/exedev/projects/stem-bench/src/study12/reference.js";
import { detrendMirror } from "/home/exedev/projects/stem-bench/src/study11/ladder.js";
import { extractFeatures } from "/home/exedev/projects/stem-bench/src/study9/analysis.js";
import { asBuffer } from "/home/exedev/projects/stem-bench/src/study9/instruments.js";
import type { Meter4 } from "/home/exedev/projects/stem-bench/src/study4/synth4.js";

const root = "/home/exedev/projects/stem-bench/";
const RATE = 22050;
function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
interface ChartSong { slug: string; bpm: number; meter: string; sections: { name: string; bars: string[][] }[]; }
const songs = [...(mmkkCharts.songs as ChartSong[]), ...(charts20b.songs as ChartSong[])];
const beatsOf = (m: string) => (m === "3/4" ? 3 : 4);

function combEnergy(x: Float32Array, fps: number, period: number): { phase: number; score: number } {
	const duration = x.length / fps;
	let bestPhase = 0, bestScore = Number.NEGATIVE_INFINITY;
	for (let phase = 0; phase < period; phase += 0.01) {
		let sum = 0, count = 0;
		for (let t = phase; t < duration; t += period) {
			const f = Math.round(t * fps);
			if (f < x.length) { sum += x[f]!; count++; }
		}
		const s = count > 0 ? sum / count : Number.NEGATIVE_INFINITY;
		if (s > bestScore) { bestScore = s; bestPhase = phase; }
	}
	return { phase: bestPhase, score: bestScore };
}

for (const chart of songs) {
	const pD = (beatsOf(chart.meter) * 60) / chart.bpm;
	const n = chart.sections.reduce((a, s) => a + s.bars.length, 0);
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const dur = mix.length / RATE;
	console.log(`\n${chart.slug}: declared ${chart.bpm} bpm ${chart.meter} (bar ${pD.toFixed(4)}s) | ${n} chart bars = ${(n * pD).toFixed(1)}s at declared | recording ${dur.toFixed(1)}s`);

	const feat = extractFeatures(asBuffer(mix, RATE));
	const x = detrendMirror(feat.onset, feat.fps);

	// Wide fine sweep at the BAR level: 0.75..1.3 x declared, 1ms steps.
	let best = { period: 0, phase: 0, score: Number.NEGATIVE_INFINITY };
	const curve: [number, number][] = [];
	for (let p = 0.75 * pD; p <= 1.3 * pD; p += 0.001) {
		const r = combEnergy(x, feat.fps, p);
		curve.push([p, r.score]);
		if (r.score > best.score) best = { period: p, phase: r.phase, score: r.score };
	}
	const atDeclared = combEnergy(x, feat.fps, pD);
	// peak sharpness: score at best vs median of curve
	const scores = curve.map((c) => c[1]).sort((a, b) => a - b);
	const median = scores[Math.floor(scores.length / 2)]!;
	console.log(`  onset comb sweep: argmax ${best.period.toFixed(4)}s (${(60 * beatsOf(chart.meter) / best.period).toFixed(2)} bpm) score ${best.score.toFixed(1)} | at declared ${atDeclared.score.toFixed(1)} | sweep median ${median.toFixed(1)} | peak/median ${(best.score / median).toFixed(2)}`);

	// BEAT-level sweep around declared beat (sharper for constant tempo).
	const bD = pD / beatsOf(chart.meter);
	let bBest = { period: 0, score: Number.NEGATIVE_INFINITY };
	for (let p = 0.9 * bD; p <= 1.1 * bD; p += 0.0005) {
		const r = combEnergy(x, feat.fps, p);
		if (r.score > bBest.score) bBest = { period: p, score: r.score };
	}
	const beatAtDeclared = combEnergy(x, feat.fps, bD);
	console.log(`  beat comb: argmax ${bBest.period.toFixed(4)}s (declared beat ${bD.toFixed(4)}s) -> tempo ${(60 / bBest.period).toFixed(2)} bpm vs declared ${(60 / bD).toFixed(0)} | score ${bBest.score.toFixed(1)} vs declared ${beatAtDeclared.score.toFixed(1)}`);

	// DTW truth: duration stats + residual vs a uniform line at the beat-argmax bar period.
	const refBars: RefBar[] = [];
	for (const s of chart.sections) for (const chords of s.bars) refBars.push({ chords: chords.map((c) => c.replace(/\(.*\)$/, "")), bpm: chart.bpm });
	const ref = renderReference(refBars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, { subsequence: true });
	const ts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	const durs = ts.slice(1).map((t, i) => t - ts[i]!).sort((a, b) => a - b);
	const q = (f: number) => durs[Math.floor(f * (durs.length - 1))]!.toFixed(3);
	const span = ts[ts.length - 1]! - ts[0]!;
	console.log(`  DTW truth: start ${ts[0]!.toFixed(2)}s, span/(n-1) ${(span / (n - 1)).toFixed(4)}s | bar-duration quartiles ${q(0)}/${q(0.25)}/${q(0.5)}/${q(0.75)}/${q(1)}`);
	// residuals of truth vs uniform line at the comb-argmax bar period anchored by LSQ phase
	const pStar = bBest.period * beatsOf(chart.meter);
	let meanT = 0; for (const t of ts) meanT += t; meanT /= ts.length;
	const phase = meanT - pStar * (ts.length - 1) / 2;
	let within = 0, maxAbs = 0;
	for (let i = 0; i < ts.length; i++) {
		const r = Math.abs(ts[i]! - (phase + i * pStar));
		maxAbs = Math.max(maxAbs, r);
		if (r <= 0.15 * pStar) within++;
	}
	console.log(`  truth vs uniform@comb-argmax (${pStar.toFixed(4)}s): within 15% ${within}/${n}, max |resid| ${maxAbs.toFixed(2)}s`);
}
