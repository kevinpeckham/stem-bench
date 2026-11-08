/**
 * Study 28 instrument (docs/BRIEF-STUDY28.md): the chartless grid —
 * comb period at the declared tempo, the comb's onset-lattice phase
 * registered at the lattice point nearest the first audible sound
 * (with the Study 25 Amendment 1 physicality fence), and the bar
 * count from the audible span. No chart, no DTW, no oracle.
 */
import { jointOnsetComb } from "../study24/tempo.js";
import { audibleSpan } from "../study26/recipe.js";

export interface ChartlessGrid {
	anchor: number;
	period: number;
	n: number;
}

export function chartlessGrid(
	onset: Float32Array,
	fps: number,
	declaredPeriod: number,
	samples: Float32Array,
	rate: number,
): ChartlessGrid {
	const comb = jointOnsetComb(onset, fps, declaredPeriod);
	const span = audibleSpan(samples, rate);
	const p = comb.period;
	const k = Math.round((span.first - comb.phase) / p);
	let anchor = comb.phase + k * p;
	// Physicality fence (Study 25 Amendment 1): bar one may lead the
	// first sound by less than one bar, never more.
	if (anchor < span.first - p) anchor += p;
	const n = Math.max(1, Math.round((span.last - anchor) / p));
	return { anchor, period: p, n };
}
