/**
 * Study 25's anchor instrument (docs/BRIEF-STUDY25.md): resolve the
 * whole-bar ambiguity of a uniform grid by the index shift whose
 * pairing maximizes the shipped reader's hint root score against the
 * chart. Oracle construction (uses the chart), registered as the
 * upper-bound arm's anchor — the committed 2026-11-07 correction
 * diagnostic turned into an instrument.
 */
import { rootScore } from "../study23/grade23.js";

export interface AnchorFit {
	/** gridStart + shift · period — the derived chart-bar-one time. */
	anchor: number;
	shift: number;
	right: number;
	bearing: number;
}

/** Registered tie-break order: 0, −1, +1, −2, +2, … (smallest |s|, negative first). */
export function shiftOrder(maxShift: number): number[] {
	const out = [0];
	for (let k = 1; k <= maxShift; k++) out.push(-k, k);
	return out;
}

/**
 * hintsU[j] is the reader's hint for the uniform grid's bar j (grid
 * from gridStart at the declared period). Chart bar i is paired with
 * grid bar i + s; missing indices grade as empty. Strictly greater
 * root score wins, in shiftOrder, so ties keep the smallest shift.
 */
export function bestShiftAnchor(
	hintsU: string[],
	truth: string[][],
	gridStart: number,
	period: number,
	maxShift = 6,
): AnchorFit {
	let best: AnchorFit | null = null;
	for (const s of shiftOrder(maxShift)) {
		const perBar = Array.from({ length: truth.length }, (_, i) => hintsU[i + s] ?? "");
		const score = rootScore(perBar, truth);
		if (best === null || score.right > best.right) {
			best = { anchor: gridStart + s * period, shift: s, right: score.right, bearing: score.bearing };
		}
	}
	if (!best) throw new Error("empty shift scan");
	return best;
}
