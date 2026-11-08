/**
 * Study 27 instruments (docs/BRIEF-STUDY27.md): recipe v5 — the v3
 * trust/phase machinery with one added move, a single whole-grid slide
 * of the uniform line onto the onset lattice, fenced at ±0.5 beat so
 * the slide can correct sub-beat phase but can never hop to the
 * neighboring beat. Pure arithmetic; browser-worker compatible.
 */
import {
	combSlide,
	MIN_TRUSTED_SHARE,
	trustedSpan,
	TRUST_FRACTION,
	type InteriorFit,
} from "../study26/recipe.js";

export interface RephaseOut {
	barStarts: number[];
	confidence: ("aligned" | "re-phased")[];
	period: number;
	delta: number;
	iFirst: number;
	iLast: number;
}

/**
 * Recipe v5. `period` is the onset joint comb's fit at the declared
 * tempo (jointOnsetComb, Study 24); `beatsPerBar` comes from the
 * chart's meter. Returns null — the registered refusal, unchanged
 * from v2/v3 — when the trusted span covers under half the bars.
 */
export function rephaseGrid(
	ts: number[],
	onset: Float32Array,
	fps: number,
	period: number,
	beatsPerBar: number,
): RephaseOut | null {
	const n = ts.length;
	const lo = Math.floor(0.2 * n);
	const hi = Math.max(lo + 2, Math.ceil(0.8 * n));
	const residuals = ts
		.slice(lo, hi)
		.map((t, j) => t - (lo + j) * period)
		.sort((a, b) => a - b);
	const phase = residuals[Math.floor(residuals.length / 2)]!;
	const fit: InteriorFit = { period, predict: (i) => phase + i * period };
	const span = trustedSpan(ts, fit);
	if (!span || span.iLast - span.iFirst + 1 < MIN_TRUSTED_SHARE * n) return null;
	const line = Array.from({ length: n }, (_, i) => phase + i * period);
	const delta = combSlide(onset, fps, line, 0.5 * (period / beatsPerBar));
	const barStarts = line.map((t) => t + delta);
	const tol = TRUST_FRACTION * period;
	const confidence = barStarts.map((t, i) =>
		Math.abs(ts[i]! - t) <= tol ? ("aligned" as const) : ("re-phased" as const),
	);
	return { barStarts, confidence, period, delta, iFirst: span.iFirst, iLast: span.iLast };
}
