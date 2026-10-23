/**
 * Study 4 Amendment 2 fixture verification (docs/BRIEF-STUDY4.md): is
 * the pulse PHYSICALLY in the committed MP3s? Each metered mix decodes
 * back to samples (ffmpeg), reduces to a 100 Hz onset-energy envelope
 * (half-wave rectified first difference of RMS), and autocorrelates;
 * the beat period must appear as a correlation peak within ±4% of
 * 60/bpm (or a half/double of it — a human tapping either level counts
 * as hearing the pulse). Mechanical, committed, run once and recorded.
 */
import { execFileSync } from "node:child_process";
import fixture from "../corpus/fixture4.json";
import { barSeconds } from "../src/study4/synth4.js";

const HOP = 220.5; // 100 envelope frames per second at 22050 Hz
let pass = 0;
let fail = 0;
for (const item of fixture.items as {
	id: string;
	pulseless: boolean;
	mp3: string;
	truth: { tempo: number | null; meter: string };
}[]) {
	if (item.pulseless || item.truth.tempo === null) continue;
	const raw = execFileSync("ffmpeg", [
		"-loglevel", "error", "-i",
		new URL(`../${item.mp3}`, import.meta.url).pathname,
		"-f", "f32le", "-ac", "1", "-ar", "22050", "-",
	], { maxBuffer: 64 * 1024 * 1024 });
	const samples = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
	const frames = Math.floor(samples.length / HOP);
	const rms = new Float64Array(frames);
	for (let f = 0; f < frames; f++) {
		let acc = 0;
		const from = Math.floor(f * HOP);
		const to = Math.min(samples.length, Math.floor((f + 1) * HOP));
		for (let i = from; i < to; i++) acc += samples[i]! * samples[i]!;
		rms[f] = Math.sqrt(acc / Math.max(1, to - from));
	}
	const onset = new Float64Array(frames);
	for (let f = 1; f < frames; f++) onset[f] = Math.max(0, rms[f]! - rms[f - 1]!);
	const mean = onset.reduce((a, b) => a + b, 0) / frames;
	for (let f = 0; f < frames; f++) onset[f]! -= mean;
	// Autocorrelation over lags 25..200 frames (0.25–2.0 s periods).
	let bestLag = 0;
	let bestR = Number.NEGATIVE_INFINITY;
	for (let lag = 25; lag <= 200; lag++) {
		let r = 0;
		for (let f = 0; f + lag < frames; f++) r += onset[f]! * onset[f + lag]!;
		if (r > bestR) {
			bestR = r;
			bestLag = lag;
		}
	}
	const period = bestLag / 100;
	const meter = item.truth.meter as "4/4" | "3/4" | "6/8";
	const beat =
		meter === "6/8" ? barSeconds(meter, item.truth.tempo) / 2 : 60 / item.truth.tempo;
	// The beat, its halves/doubles, or the bar (3x in 3/4: a waltz pulses by the bar).
	const ratios = [1, 2, 0.5, 3, 4].map((m) => Math.abs(period - beat * m) / (beat * m));
	const ok = Math.min(...ratios) <= 0.04;
	console.log(
		`${item.id}: beat ${beat.toFixed(3)}s, autocorr peak ${period.toFixed(2)}s → ${ok ? "PASS" : "FAIL"}`,
	);
	ok ? pass++ : fail++;
}
console.log(`\npulse verification: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
