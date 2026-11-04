/**
 * Study 17 arm C (docs/BRIEF-STUDY17.md): chroma evidence into the
 * shipped matcher. For each bar of the shared grid, the mean of the
 * chromagram's L2-normalized frames whose start lies in that bar is
 * fed to production's `chordOf` with no bass estimate and the same
 * previous-chord hysteresis `chordsPerBar` applies. No new parameter:
 * window, hop, fold and normalization are Study 12's; templates,
 * penalties and the hysteresis margin are production's. A bar with no
 * frames or zero mass is "N.C.".
 */
import { chordOf } from "../fixture/chords.js";

export function chromaChordsPerBar(
	frames: Float32Array[],
	hopSec: number,
	barStarts: number[],
): string[] {
	const out: string[] = [];
	let previous: string | undefined;
	for (let b = 0; b + 1 < barStarts.length; b++) {
		const from = barStarts[b]!;
		const to = barStarts[b + 1]!;
		const pool = new Float64Array(12);
		let count = 0;
		for (let i = 0; i < frames.length; i++) {
			const t = i * hopSec;
			if (t >= from && t < to) {
				const f = frames[i]!;
				for (let c = 0; c < 12; c++) pool[c]! += f[c]!;
				count++;
			}
		}
		let mass = 0;
		for (let c = 0; c < 12; c++) mass += pool[c]!;
		if (count === 0 || mass <= 1e-9) {
			out.push("N.C.");
			previous = "N.C.";
			continue;
		}
		for (let c = 0; c < 12; c++) pool[c]! /= count;
		const { chord } = chordOf(pool, null, previous);
		out.push(chord);
		previous = chord;
	}
	return out;
}
