/**
 * Study 40 (docs/BRIEF-STUDY40.md): a probe into the v0.200 detector's
 * tempo stage. The functions below are copied verbatim from
 * src/study11b/analysis200.ts (the pinned port), which keeps them
 * private; the probe exposes the pulse lag BEFORE the subdivision
 * re-pick and the autocorrelation at the lags the meter witnesses need,
 * so threshold sweeps can run on stored numbers. tests/study40.test.ts
 * pins the probe to analyse200's own bpm/subdivision/meter on local
 * audio. No model.
 */
import type { Features } from "../study11b/analysis200.js";

export function detrend(onset: Float32Array, fps: number): Float32Array {
	const out = new Float32Array(onset.length);
	const span = Math.max(1, Math.round(fps * 0.5));
	let sum = 0;
	for (let i = 0; i < onset.length; i++) {
		sum += onset[i]!;
		if (i >= span) sum -= onset[i - span]!;
		const mean = sum / Math.min(i + 1, span);
		out[i] = Math.max(0, onset[i]! - mean);
	}
	return out;
}

export function autocorrelation(x: Float32Array, lag: number): number {
	let s = 0;
	for (let i = lag; i < x.length; i++) s += x[i]! * x[i - lag]!;
	return s / Math.max(1, x.length - lag);
}

export function acNear(x: Float32Array, centre: number): number {
	let best = 0;
	for (let lag = Math.floor(centre - 1); lag <= Math.ceil(centre + 1); lag++) {
		if (lag > 0 && lag < x.length) best = Math.max(best, autocorrelation(x, lag));
	}
	return best;
}

function refineLag(scores: number[], best: number): number {
	const l = scores[best - 1] ?? scores[best]!;
	const r = scores[best + 1] ?? scores[best]!;
	const denominator = l - 2 * scores[best]! + r;
	const shift = denominator === 0 ? 0 : (0.5 * (l - r)) / denominator;
	return best + Math.max(-0.5, Math.min(0.5, shift));
}

export function refinePeriod(x: Float32Array, period: number): number {
	const base = autocorrelation(x, Math.round(period));
	let refined = period;
	for (const k of [2, 4, 8, 16, 32]) {
		const centre = refined * k;
		const window = Math.max(2, Math.round(period / 4));
		if (centre + window >= x.length / 2) break;
		let bestLag = -1;
		let bestValue = -Infinity;
		const values: number[] = [];
		for (let lag = Math.round(centre - window); lag <= Math.round(centre + window); lag++) {
			const v = autocorrelation(x, lag);
			values[lag] = v;
			if (v > bestValue) {
				bestValue = v;
				bestLag = lag;
			}
		}
		if (bestLag < 0 || bestValue < base * 0.35) break;
		if (bestLag <= Math.round(centre - window) || bestLag >= Math.round(centre + window)) break;
		refined = refineLag(values, bestLag) / k;
	}
	return refined;
}

export function findPulse(x: Float32Array, fps: number): { lag: number; confidence: number } | null {
	if (x.length < fps * 4 || autocorrelation(x, 0) <= 0) return null;
	const minLag = Math.floor((60 / 210) * fps);
	const maxLag = Math.ceil((60 / 50) * fps);
	const zero = autocorrelation(x, 0);
	const scores: number[] = [];
	let best = -1;
	let bestScore = -Infinity;
	for (let lag = minLag; lag <= maxLag; lag++) {
		const bpm = (60 * fps) / lag;
		const inBand = bpm >= 80 && bpm <= 170 ? 1 : 0.55;
		const prior = inBand * Math.exp(-0.5 * (Math.log2(bpm / 120) / 1.2) ** 2);
		const score = (autocorrelation(x, lag) / zero) * prior;
		scores[lag] = score;
		if (score > bestScore) {
			bestScore = score;
			best = lag;
		}
	}
	if (best < 0) return null;
	const lag = refinePeriod(x, refineLag(scores, best));
	const values = scores.filter((v) => Number.isFinite(v));
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	const confidence = Math.max(0, Math.min(1, (bestScore - mean) / (bestScore || 1)));
	return { lag, confidence };
}

export function meterLean(x: Float32Array, fps: number, bpm: number): number {
	const beat = (60 * fps) / bpm;
	const at = (beats: number) => acNear(x, beat * beats);
	const four = at(4) + at(8);
	const three = at(3) + at(6);
	return (three - four) / Math.max(three, four, 1e-9);
}

/** The production thresholds (analysis200.ts). */
export const DEFAULTS = { compoundMargin: 1.15, tripletShare: 0.55, dottedMargin: 1.05, dottedFloor: 0.2 } as const;

/** Everything a threshold sweep needs, per song, from one feature extraction. */
export interface TempoProbe {
	fps: number;
	/** Pulse lag in frames before any re-pick, and the detector's confidence. */
	lag0: number;
	confidence: number;
	/** The super-beat re-pick's lag (refinePeriod(1.5·lag0)), computed whether or not it fires. */
	lag1: number;
	/** Autocorrelation (acNear) at multiples of lag0: keys are the multiple as a string ("0.333", "0.5", "1", "1.5", "2", "3", "4", "6", "8"). */
	ac0: Record<string, number>;
	/** The same at multiples of lag1 ("1", "1.5", "2", "3", "4", "6", "8"). */
	ac1: Record<string, number>;
	/** meterLean at the bpm of lag0 and of lag1. */
	lean0: number;
	lean1: number;
}

export const MULT0 = [1 / 3, 1 / 2, 1, 1.5, 2, 3, 4, 6, 8] as const;
export const MULT1 = [1, 1.5, 2, 3, 4, 6, 8] as const;
export const keyOf = (m: number) => (Math.abs(m - 1 / 3) < 1e-9 ? "0.333" : String(m));

export function probe(f: Features): TempoProbe | null {
	const x = detrend(f.onset, f.fps);
	const p = findPulse(x, f.fps);
	if (!p) return null;
	const lag1 = refinePeriod(x, p.lag * 1.5);
	const ac0: Record<string, number> = {};
	for (const m of MULT0) ac0[keyOf(m)] = acNear(x, p.lag * m);
	const ac1: Record<string, number> = {};
	for (const m of MULT1) ac1[keyOf(m)] = acNear(x, lag1 * m);
	return {
		fps: f.fps,
		lag0: p.lag,
		confidence: p.confidence,
		lag1,
		ac0,
		ac1,
		// detectMeter reads the RAW onset envelope (not the detrended one the tempo stage uses) at the
		// ROUNDED bpm (one decimal), so the lean is taken exactly there, as in analyse200
		lean0: meterLean(f.onset, f.fps, Math.round(((60 * f.fps) / p.lag) * 10) / 10),
		lean1: meterLean(f.onset, f.fps, Math.round(((60 * f.fps) / lag1) * 10) / 10),
	};
}

export type Branch = "sub" | "super" | "none";

/**
 * The detector's subdivision decision from stored numbers, with the four
 * thresholds as parameters (production values in DEFAULTS). Returns the
 * branch that fired and the lag the detector keeps.
 */
export function subdivisionFrom(t: TempoProbe, th = DEFAULTS as { compoundMargin: number; tripletShare: number; dottedMargin: number; dottedFloor: number }): { branch: Branch; lag: number; subdivision: 2 | 3 } {
	const beat = t.ac0["1"]!;
	const third = t.ac0["0.333"]!;
	if (third > th.compoundMargin * t.ac0["0.5"]! && third >= th.tripletShare * beat) return { branch: "sub", lag: t.lag0, subdivision: 3 };
	const dotted = t.ac0["1.5"]!;
	if (dotted > th.dottedMargin * t.ac0["2"]! && dotted >= th.dottedFloor * beat) return { branch: "super", lag: t.lag1, subdivision: 3 };
	return { branch: "none", lag: t.lag0, subdivision: 2 };
}

/** The detector's tempo and meter from stored numbers: bpm rounded as production rounds it; 6/8 iff subdivision 3, else 3/4 on a lean above 0.03. */
export function detectionFrom(t: TempoProbe, th = DEFAULTS as { compoundMargin: number; tripletShare: number; dottedMargin: number; dottedFloor: number }): { bpm: number; meter: "4/4" | "3/4" | "6/8"; branch: Branch } {
	const s = subdivisionFrom(t, th);
	const bpm = Math.round(((60 * t.fps) / s.lag) * 10) / 10;
	const lean = s.branch === "super" ? t.lean1 : t.lean0;
	const meter = s.subdivision === 3 ? "6/8" : lean > 0.03 ? "3/4" : "4/4";
	return { bpm, meter, branch: s.branch };
}
