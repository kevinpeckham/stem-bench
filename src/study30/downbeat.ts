/**
 * Study 30 instruments (docs/BRIEF-STUDY30.md): downbeat
 * disambiguation for the chartless grid — whole-beat candidate
 * anchors scored by mean detrended energy at every bar line, with the
 * chroma-novelty signal (D1, primary) and the kick-band onset signal
 * (D2, secondary).
 */
import { detrendMirror } from "../study11/ladder.js";
import { chromagram } from "../study12/chroma.js";

/** RBJ biquad low-pass (Q = 0.7071). */
export function lowpass(x: Float32Array, rate: number, fc: number): Float32Array {
	const w0 = (2 * Math.PI * fc) / rate;
	const q = Math.SQRT1_2;
	const alpha = Math.sin(w0) / (2 * q);
	const cosw = Math.cos(w0);
	const b0 = (1 - cosw) / 2;
	const b1 = 1 - cosw;
	const b2 = (1 - cosw) / 2;
	const a0 = 1 + alpha;
	const a1 = -2 * cosw;
	const a2 = 1 - alpha;
	const y = new Float32Array(x.length);
	let x1 = 0;
	let x2 = 0;
	let y1 = 0;
	let y2 = 0;
	for (let i = 0; i < x.length; i++) {
		const xi = x[i]!;
		const yi = (b0 / a0) * xi + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
		y[i] = yi;
		x2 = x1;
		x1 = xi;
		y2 = y1;
		y1 = yi;
	}
	return y;
}

/** The brief's 4th-order skirt: the biquad applied twice. */
export function lowpass4(x: Float32Array, rate: number, fc: number): Float32Array {
	return lowpass(lowpass(x, rate, fc), rate, fc);
}

/** Chroma novelty: 1 − cosine similarity of adjacent chromagram frames. */
export function chromaNovelty(samples: Float32Array): { env: Float32Array; fps: number } {
	const c = chromagram(samples);
	const n = c.frames.length;
	const env = new Float32Array(n);
	for (let t = 1; t < n; t++) {
		const a = c.frames[t - 1]!;
		const b = c.frames[t]!;
		let dot = 0;
		let na = 0;
		let nb = 0;
		for (let k = 0; k < a.length; k++) {
			dot += a[k]! * b[k]!;
			na += a[k]! * a[k]!;
			nb += b[k]! * b[k]!;
		}
		const denom = Math.sqrt(na * nb);
		env[t] = denom > 1e-9 ? 1 - dot / denom : 0;
	}
	return { env, fps: 1 / c.hopSec };
}

/** Mean detrended energy at the grid's bar lines. */
export function scoreAnchor(
	env: Float32Array,
	fps: number,
	anchor: number,
	period: number,
	n: number,
): number {
	const x = detrendMirror(env, fps);
	let sum = 0;
	let count = 0;
	for (let i = 0; i < n; i++) {
		const f = Math.round((anchor + i * period) * fps);
		if (f >= 0 && f < x.length) {
			sum += x[f]!;
			count++;
		}
	}
	return count > 0 ? sum / count : Number.NEGATIVE_INFINITY;
}

export interface DownbeatChoice {
	anchor: number;
	shift: number;
	scores: { shift: number; anchor: number; score: number }[];
}

/**
 * All `beats` whole-beat shifts of `base`, each wrapped into the
 * physicality window (within one bar around the first sound, never
 * more than a bar before it), scored; the argmax wins.
 */
export function disambiguate(
	base: number,
	period: number,
	beats: number,
	firstSound: number,
	n: number,
	env: Float32Array,
	fps: number,
): DownbeatChoice {
	const beat = period / beats;
	const scores: { shift: number; anchor: number; score: number }[] = [];
	for (let k = 0; k < beats; k++) {
		let a = base + k * beat;
		while (a >= firstSound + period) a -= period;
		while (a < firstSound - period) a += period;
		scores.push({ shift: k, anchor: a, score: scoreAnchor(env, fps, a, period, n) });
	}
	const best = scores.reduce((p, c) => (c.score > p.score ? c : p));
	return { anchor: best.anchor, shift: best.shift, scores };
}
