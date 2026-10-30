/**
 * Study 12 chromagram (docs/BRIEF-STUDY12.md): a frame-level 12-bin
 * pitch-class sequence for DTW. Window 4096, hop 2048 at 22050 Hz
 * (≈ 92.9 ms per frame), Hann window, the port's own fft, bins folded
 * to pitch classes over 55–2200 Hz, each frame L2-normalized (a silent
 * frame stays zero). Deterministic and committed; pinned by test.
 */
import { fft } from "../study9/analysis.js";

export const CHROMA_WIN = 4096;
export const CHROMA_HOP = 2048;

export function chromagram(samples: Float32Array, sr = 22050): { frames: Float32Array[]; hopSec: number } {
	const frames: Float32Array[] = [];
	const re = new Float32Array(CHROMA_WIN);
	const im = new Float32Array(CHROMA_WIN);
	const hann = new Float32Array(CHROMA_WIN);
	for (let i = 0; i < CHROMA_WIN; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / CHROMA_WIN);
	const minBin = Math.max(1, Math.floor((55 * CHROMA_WIN) / sr));
	const maxBin = Math.min(CHROMA_WIN / 2 - 1, Math.ceil((2200 * CHROMA_WIN) / sr));
	for (let start = 0; start + CHROMA_WIN <= samples.length; start += CHROMA_HOP) {
		for (let i = 0; i < CHROMA_WIN; i++) {
			re[i] = samples[start + i]! * hann[i]!;
			im[i] = 0;
		}
		fft(re, im);
		const chroma = new Float32Array(12);
		for (let bin = minBin; bin <= maxBin; bin++) {
			const freq = (bin * sr) / CHROMA_WIN;
			const midi = 69 + 12 * Math.log2(freq / 440);
			const pc = ((Math.round(midi) % 12) + 12) % 12;
			chroma[pc]! += Math.sqrt(re[bin]! ** 2 + im[bin]! ** 2);
		}
		let norm = 0;
		for (let c = 0; c < 12; c++) norm += chroma[c]! ** 2;
		norm = Math.sqrt(norm);
		if (norm > 1e-9) for (let c = 0; c < 12; c++) chroma[c]! /= norm;
		frames.push(chroma);
	}
	return { frames, hopSec: CHROMA_HOP / sr };
}
