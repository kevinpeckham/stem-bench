/**
 * Study 26 instruments (docs/BRIEF-STUDY26.md): the alignment-ends
 * repair recipe — interior LSQ tempo, trusted span, end extrapolation,
 * per-end onset comb slide — plus the audible-span envelope used by
 * the app's bar-1 acceptance rule. Pure arithmetic; browser-worker
 * compatible by construction (no model, no node APIs).
 */
import { detrendMirror } from "../study11/ladder.js";
import { fitUniformGrid } from "../study22/grid.js";

/** Trusted-bar tolerance and end-slide range, as fractions of the period. */
export const TRUST_FRACTION = 0.25;
export const SLIDE_FRACTION = 0.25;
export const SLIDE_STEP_SEC = 0.01;
/** Refuse when the trusted span covers less than this share of bars. */
export const MIN_TRUSTED_SHARE = 0.5;

export interface InteriorFit {
	period: number;
	/** Predicted bar-start time for chart bar index i. */
	predict: (i: number) => number;
}

/** Least-squares (period, phase) over the middle 60% of bars. */
export function interiorFit(ts: number[]): InteriorFit {
	const n = ts.length;
	const lo = Math.floor(0.2 * n);
	const hi = Math.max(lo + 2, Math.ceil(0.8 * n));
	const fit = fitUniformGrid(ts.slice(lo, hi));
	return { period: fit.period, predict: (i) => fit.phase + (i - lo) * fit.period };
}

export interface TrustedSpan {
	iFirst: number;
	iLast: number;
}

/**
 * Trusted bar: within TRUST_FRACTION·period of the interior fit.
 * iFirst opens a run of 4 trusted bars; iLast closes one.
 */
export function trustedSpan(ts: number[], fit: InteriorFit): TrustedSpan | null {
	const tol = TRUST_FRACTION * fit.period;
	const trusted = ts.map((t, i) => Math.abs(t - fit.predict(i)) <= tol);
	let iFirst = -1;
	for (let i = 0; i + 3 < trusted.length; i++) {
		if (trusted[i] && trusted[i + 1] && trusted[i + 2] && trusted[i + 3]) {
			iFirst = i;
			break;
		}
	}
	let iLast = -1;
	for (let i = trusted.length - 1; i >= 3; i--) {
		if (trusted[i] && trusted[i - 1] && trusted[i - 2] && trusted[i - 3]) {
			iLast = i;
			break;
		}
	}
	if (iFirst < 0 || iLast < iFirst) return null;
	return { iFirst, iLast };
}

/** The δ in ±range maximizing mean onset energy at times+δ (10 ms comb). */
export function combSlide(
	onset: Float32Array,
	fps: number,
	times: number[],
	range: number,
): number {
	const x = detrendMirror(onset, fps);
	let best = 0;
	let bestScore = Number.NEGATIVE_INFINITY;
	for (let d = -range; d <= range + 1e-9; d += SLIDE_STEP_SEC) {
		let sum = 0;
		let count = 0;
		for (const t of times) {
			const f = Math.round((t + d) * fps);
			if (f >= 0 && f < x.length) {
				sum += x[f]!;
				count++;
			}
		}
		const score = count > 0 ? sum / count : Number.NEGATIVE_INFINITY;
		if (score > bestScore) {
			bestScore = score;
			best = d;
		}
	}
	return best;
}

export interface RecipeOut {
	barStarts: number[];
	confidence: ("aligned" | "extrapolated")[];
	interiorPeriod: number;
	iFirst: number;
	iLast: number;
	slides: { intro: number; outro: number };
}

/**
 * The repair recipe (brief steps 1–6). Returns null — the registered
 * refusal — when the trusted span covers under MIN_TRUSTED_SHARE of
 * bars (the arrangement-mismatch case).
 */
export function repairEnds(
	ts: number[],
	onset: Float32Array,
	fps: number,
): RecipeOut | null {
	const n = ts.length;
	const fit = interiorFit(ts);
	const span = trustedSpan(ts, fit);
	if (!span || span.iLast - span.iFirst + 1 < MIN_TRUSTED_SHARE * n) return null;
	const { iFirst, iLast } = span;
	const p = fit.period;
	const intro = Array.from({ length: iFirst }, (_, k) => ts[iFirst]! - (iFirst - k) * p);
	const outro = Array.from({ length: n - 1 - iLast }, (_, j) => ts[iLast]! + (j + 1) * p);
	const introSlide = intro.length > 0 ? combSlide(onset, fps, intro, SLIDE_FRACTION * p) : 0;
	const outroSlide = outro.length > 0 ? combSlide(onset, fps, outro, SLIDE_FRACTION * p) : 0;
	const barStarts = [
		...intro.map((t) => t + introSlide),
		...ts.slice(iFirst, iLast + 1),
		...outro.map((t) => t + outroSlide),
	];
	const confidence = barStarts.map((_, i) =>
		i >= iFirst && i <= iLast ? ("aligned" as const) : ("extrapolated" as const),
	);
	return { barStarts, confidence, interiorPeriod: p, iFirst, iLast, slides: { intro: introSlide, outro: outroSlide } };
}

/** First/last time a peak-normalized signal's 10 ms envelope exceeds 5% of peak. */
export function audibleSpan(
	samples: Float32Array,
	rate: number,
	thresholdFrac = 0.05,
): { first: number; last: number } {
	const hop = Math.round(rate * 0.01);
	let peak = 0;
	for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]!));
	const thr = peak * thresholdFrac;
	let first = -1;
	let last = -1;
	for (let f = 0; f * hop < samples.length; f++) {
		let m = 0;
		const end = Math.min(samples.length, (f + 1) * hop);
		for (let i = f * hop; i < end; i++) m = Math.max(m, Math.abs(samples[i]!));
		if (m >= thr) {
			if (first < 0) first = f * 0.01;
			last = f * 0.01;
		}
	}
	return { first, last };
}
