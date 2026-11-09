/**
 * Study 33 (docs/BRIEF-STUDY33.md): stereo plumbing. The fetch
 * converter only ever produced mono raws (`ffmpeg -ac 1`), so the
 * stereo channels of the corpus mixes are decoded here, cached beside
 * the mp3 as `<file>.22050.f32le.stereo.raw` (interleaved L/R).
 */
import { existsSync, readFileSync } from "node:fs";

export const RATE33 = 22050;

/** Decode a stereo file at 22050 Hz, cached; returns the two channels. */
export function loadStereo(path: string): { l: Float32Array; r: Float32Array } {
	const cache = `${path}.${RATE33}.f32le.stereo.raw`;
	if (!existsSync(cache)) {
		const p = Bun.spawnSync(
			["ffmpeg", "-y", "-v", "error", "-i", path, "-f", "f32le", "-ar", String(RATE33), "-ac", "2", cache],
			{ maxBuffer: 16 * 1024 * 1024 },
		);
		if (p.exitCode !== 0) throw new Error(`ffmpeg failed decoding ${path}: ${p.stderr.toString()}`);
	}
	const buf = readFileSync(cache);
	const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
	const n = Math.floor(all.length / 2);
	const l = new Float32Array(n);
	const r = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		l[i] = all[2 * i]!;
		r[i] = all[2 * i + 1]!;
	}
	return { l, r };
}

/** Mid = (L+R)/2 (identical to the fetch converter's mono downmix), side = (L−R)/2. */
export function midSide(l: Float32Array, r: Float32Array): { mid: Float32Array; side: Float32Array } {
	const n = Math.min(l.length, r.length);
	const mid = new Float32Array(n);
	const side = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		mid[i] = (l[i]! + r[i]!) / 2;
		side[i] = (l[i]! - r[i]!) / 2;
	}
	return { mid, side };
}

/** Peak-normalize a copy, as production normalizes the stem sum before transcription. */
export function peakNorm(x: Float32Array): Float32Array {
	let peak = 0;
	for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]!));
	const out = new Float32Array(x.length);
	if (peak === 0) return out;
	for (let i = 0; i < x.length; i++) out[i] = x[i]! / peak;
	return out;
}

/** Two pseudo-stems' transcriptions joined, sorted by start — "two stems, same process". */
export function mergeNotes<T extends { start: number }>(a: T[], b: T[]): T[] {
	return [...a, ...b].sort((x, y) => x.start - y.start);
}
