/**
 * Study 22 (docs/BRIEF-STUDY22.md): the bar grid from the recording
 * alone. Truth = the Study 12 chart-anchored alignment; arms = A0
 * (least-squares ceiling), A2 (declared tempo + blind phase, primary),
 * A1 (shipped detector + blind phase, reported). Sanity gate runs the
 * A2 pipeline on each chart's synthetic reference render, whose true
 * bar starts are known exactly. $0, no model, no transcription.
 */
import { readFileSync, writeFileSync } from "node:fs";
import charts20b from "../corpus/mmkk-charts-20b.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import type { Meter4 } from "../src/study4/synth4.js";
import { analyse, extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";
import { fitUniformGrid, latticeHits, phaseFromOnset } from "../src/study22/grid.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;

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

const beatsOf = (meter: string) => (meter === "3/4" ? 3 : 4);

const songs = [...(mmkkCharts.songs as ChartSong[]), ...(charts20b.songs as ChartSong[])];

const out: Record<string, unknown> = {};
let g1 = true;
let g2 = true;

for (const chart of songs) {
	console.log(`\n${chart.slug} (declared ${chart.bpm} bpm ${chart.meter}):`);
	const bars: RefBar[] = [];
	for (const s of chart.sections)
		for (const chords of s.bars)
			bars.push({ chords: chords.map((c) => c.replace(/\(.*\)$/, "")), bpm: chart.bpm });

	// Truth: the Study 12 chart-anchored alignment, recomputed.
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const ref = renderReference(bars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const truth = ref.barStarts.map((s) => aligned.mapSeconds(s));
	const n = truth.length;
	const declaredPeriod = (beatsOf(chart.meter) * 60) / chart.bpm;

	// S22-G1 sanity: A2 pipeline on the synthetic render, exact truth known.
	const refFeat = extractFeatures(asBuffer(ref.samples, RATE));
	const refPhase = phaseFromOnset(refFeat.onset, refFeat.fps, declaredPeriod);
	const sanity = latticeHits({ period: declaredPeriod, phase: refPhase }, ref.barStarts);
	if (sanity.hitRate < 0.95) g1 = false;

	// Arms on the real recording.
	const feat = extractFeatures(asBuffer(mix, RATE));
	const detection = analyse(feat);
	const a0fit = fitUniformGrid(truth);
	const a0 = latticeHits(a0fit, truth);

	const a2phase = phaseFromOnset(feat.onset, feat.fps, declaredPeriod);
	const a2 = latticeHits({ period: declaredPeriod, phase: a2phase }, truth);
	if (a2.hitRate < 0.8) g2 = false;

	const a1period = detection.tempo.bpm
		? (beatsOf(detection.meter.value) * 60) / detection.tempo.bpm
		: 0;
	const a1phase = a1period ? phaseFromOnset(feat.onset, feat.fps, a1period) : 0;
	const a1 = a1period
		? latticeHits({ period: a1period, phase: a1phase }, truth)
		: { hits: 0, n, hitRate: 0, meanAbsMs: 0, tolMs: 0 };

	console.log(
		`  sanity (render): ${(sanity.hitRate * 100).toFixed(1)}% | A0 ceiling: ${(a0.hitRate * 100).toFixed(1)}% (period ${a0fit.period.toFixed(3)}s vs declared ${declaredPeriod.toFixed(3)}s, mean |err| ${a0.meanAbsMs}ms)`,
	);
	console.log(
		`  A2 declared+phase: ${(a2.hitRate * 100).toFixed(1)}% (phase ${a2phase.toFixed(2)}s vs truth start ${truth[0]!.toFixed(2)}s, tol ±${a2.tolMs}ms) | A1 detector: ${detection.tempo.bpm.toFixed(1)} bpm ${detection.meter.value} -> ${(a1.hitRate * 100).toFixed(1)}% (declared/detected = ${(chart.bpm / (detection.tempo.bpm || 1)).toFixed(3)})`,
	);
	const durations = truth.slice(1).map((t, i) => t - truth[i]!);
	const sortedD = [...durations].sort((a, b) => a - b);
	out[chart.slug] = {
		declared: { bpm: chart.bpm, meter: chart.meter, periodSec: declaredPeriod },
		bars: n,
		truthStart: Math.round(truth[0]! * 1000) / 1000,
		truthJitter: {
			medianBar: sortedD[Math.floor(sortedD.length / 2)],
			p5: sortedD[Math.floor(0.05 * sortedD.length)],
			p95: sortedD[Math.floor(0.95 * sortedD.length)],
		},
		sanity,
		a0: { ...a0, fit: { period: a0fit.period, phase: a0fit.phase } },
		a2: { ...a2, period: declaredPeriod, phase: a2phase },
		a1: { ...a1, period: a1period, detected: detection.tempo, meter: detection.meter },
	};
}

writeFileSync(`${root}results/study22.json`, `${JSON.stringify({ version: 1, songs: out }, null, "\t")}\n`);
console.log(`\nS22-G1 (A2 pipeline on each synthetic render >= 95%): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S22-G2 (A2 >= 80% of bars on each real song): ${g2 ? "PASS" : "FAIL"}`);
