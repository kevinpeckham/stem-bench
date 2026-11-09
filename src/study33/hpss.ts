/**
 * Study 33 (docs/BRIEF-STUDY33.md): median-filtering harmonic/percussive
 * separation (Fitzgerald 2010). Harmonic content is steady across time
 * frames; percussive content is broadband within a frame. Median-filter
 * the magnitude spectrogram along each axis, soft-mask, resynthesize the
 * harmonic part. The DSP stand-in for "non-drum stem sum" on a mix.
 */
import { fft } from "../study9/analysis.js";

const FRAME = 1024;
const HOP = 256;

function median(xs: number[]): number {
	const s = [...xs].sort((a, b) => a - b);
	return s[s.length >> 1]!;
}

/** The harmonic component of `x`, same length. medT/medF are median window sizes (odd). */
export function hpssHarmonic(x: Float32Array, medT = 17, medF = 17): Float32Array {
	const bins = FRAME / 2 + 1;
	const nFrames = Math.max(0, Math.floor((x.length - FRAME) / HOP) + 1);
	if (nFrames === 0) return new Float32Array(x.length);
	const window = new Float32Array(FRAME);
	for (let i = 0; i < FRAME; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FRAME);

	// STFT
	const res: Float32Array[] = [];
	const ims: Float32Array[] = [];
	const mag: Float32Array[] = [];
	for (let t = 0; t < nFrames; t++) {
		const re = new Float32Array(FRAME);
		const im = new Float32Array(FRAME);
		const start = t * HOP;
		for (let i = 0; i < FRAME; i++) re[i] = (x[start + i] ?? 0) * window[i]!;
		fft(re, im);
		const m = new Float32Array(bins);
		for (let k = 0; k < bins; k++) m[k] = Math.hypot(re[k]!, im[k]!);
		res.push(re);
		ims.push(im);
		mag.push(m);
	}

	// Harmonic enhancement: median across time per bin. Percussive: median across frequency per frame.
	const hT = medT >> 1;
	const hF = medF >> 1;
	const mask: Float32Array[] = [];
	for (let t = 0; t < nFrames; t++) {
		const row = new Float32Array(bins);
		for (let k = 0; k < bins; k++) {
			const tw: number[] = [];
			for (let d = -hT; d <= hT; d++) tw.push(mag[Math.min(nFrames - 1, Math.max(0, t + d))]![k]!);
			const fw: number[] = [];
			for (let d = -hF; d <= hF; d++) fw.push(mag[t]![Math.min(bins - 1, Math.max(0, k + d))]!);
			const h = median(tw);
			const p = median(fw);
			row[k] = (h * h) / (h * h + p * p + 1e-12);
		}
		mask.push(row);
	}

	// Mask + inverse STFT (conjugate trick) + overlap-add with window-square normalization.
	const out = new Float32Array(x.length);
	const wsum = new Float32Array(x.length);
	for (let t = 0; t < nFrames; t++) {
		const re = new Float32Array(FRAME);
		const im = new Float32Array(FRAME);
		for (let k = 0; k < FRAME; k++) {
			const bin = k < bins ? k : FRAME - k;
			const m = mask[t]![bin]!;
			re[k] = res[t]![k]! * m;
			im[k] = -ims[t]![k]! * m;
		}
		fft(re, im);
		const start = t * HOP;
		for (let i = 0; i < FRAME; i++) {
			const j = start + i;
			if (j >= out.length) break;
			out[j]! += (re[i]! / FRAME) * window[i]!;
			wsum[j]! += window[i]! * window[i]!;
		}
	}
	for (let i = 0; i < out.length; i++) if (wsum[i]! > 1e-8) out[i]! /= wsum[i]!;
	return out;
}
