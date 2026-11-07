/**
 * Study 24 instruments (docs/BRIEF-STUDY24.md): the joint
 * phase-and-period combs. Pure arithmetic; the chord-change times come
 * from the shipped reader and the onset envelope from the Study 9 port.
 */
import { detrendMirror } from "../study11/ladder.js";
import { anchorError } from "../study23b/downbeat.js";

export interface TempoFit {
	period: number;
	phase: number;
	/** The objective at the optimum (mean circular error for P1, mean onset energy for P2). */
	score: number;
}

/** Registered search geometry: ±10% range, 0.2% coarse step, 0.02% refinement. */
export const RANGE_FRACTION = 0.1;
export const COARSE_STEP_FRACTION = 0.002;
export const FINE_STEP_FRACTION = 0.0002;
export const PHASE_STEP_SEC = 0.01;

/** Best phase (and its score) for one candidate period over change times. */
function changePhaseScore(changeTimes: number[], period: number): { phase: number; score: number } {
	let bestPhase = 0;
	let bestScore = Number.POSITIVE_INFINITY;
	for (let phase = 0; phase < period; phase += PHASE_STEP_SEC) {
		let sum = 0;
		for (const t of changeTimes) sum += anchorError(phase, t, period);
		const score = changeTimes.length > 0 ? sum / changeTimes.length : Number.POSITIVE_INFINITY;
		if (score < bestScore) {
			bestScore = score;
			bestPhase = phase;
		}
	}
	return { phase: bestPhase, score: bestScore };
}

function scanPeriods(
	periods: number[],
	evaluate: (period: number) => { phase: number; score: number },
	lowerIsBetter: boolean,
): TempoFit {
	let best: TempoFit | null = null;
	for (const period of periods) {
		const { phase, score } = evaluate(period);
		if (
			best === null ||
			(lowerIsBetter ? score < best.score : score > best.score)
		) {
			best = { period, phase, score };
		}
	}
	if (!best) throw new Error("empty period scan");
	return best;
}

function periodLadder(center: number, halfRange: number, step: number): number[] {
	const out: number[] = [];
	for (let p = center - halfRange; p <= center + halfRange + 1e-9; p += step) out.push(p);
	return out;
}

function twoStage(
	declaredPeriod: number,
	evaluate: (period: number) => { phase: number; score: number },
	lowerIsBetter: boolean,
): TempoFit {
	const coarse = scanPeriods(
		periodLadder(declaredPeriod, declaredPeriod * RANGE_FRACTION, declaredPeriod * COARSE_STEP_FRACTION),
		evaluate,
		lowerIsBetter,
	);
	return scanPeriods(
		periodLadder(coarse.period, declaredPeriod * COARSE_STEP_FRACTION, declaredPeriod * FINE_STEP_FRACTION),
		evaluate,
		lowerIsBetter,
	);
}

/**
 * P1: the chord-change joint comb — the (period, phase) in the ±10%
 * window whose lattice minimizes the mean circular distance of the
 * shipped reader's segment-start times. The window is load-bearing: it
 * excludes the half/double-period lattices the objective would
 * otherwise prefer by degeneracy.
 */
export function jointChangeComb(changeTimes: number[], declaredPeriod: number): TempoFit {
	return twoStage(declaredPeriod, (p) => changePhaseScore(changeTimes, p), true);
}

/**
 * P2: the onset joint comb — the same search maximizing Study 22's
 * objective (mean detrended onset energy at lattice frames).
 */
export function jointOnsetComb(
	onset: Float32Array,
	fps: number,
	declaredPeriod: number,
): TempoFit {
	const x = detrendMirror(onset, fps);
	const duration = onset.length / fps;
	const evaluate = (period: number) => {
		let bestPhase = 0;
		let bestScore = Number.NEGATIVE_INFINITY;
		for (let phase = 0; phase < period; phase += PHASE_STEP_SEC) {
			let sum = 0;
			let count = 0;
			for (let t = phase; t < duration; t += period) {
				const frame = Math.round(t * fps);
				if (frame < x.length) {
					sum += x[frame]!;
					count++;
				}
			}
			const score = count > 0 ? sum / count : Number.NEGATIVE_INFINITY;
			if (score > bestScore) {
				bestScore = score;
				bestPhase = phase;
			}
		}
		return { phase: bestPhase, score: bestScore };
	};
	return twoStage(declaredPeriod, evaluate, false);
}

/**
 * Index-paired grid hits allowing one integer shift (S24-G1's pairing):
 * a joint-comb phase exists modulo the period, so the grid's bar 0 may
 * sit whole bars before the chart's. The shift is chosen mechanically
 * to maximize hits and reported beside the rate.
 */
export function shiftedIndexHits(
	barStarts: number[],
	truth: number[],
	tolSec: number,
	maxShift = 12,
): { hits: number; of: number; shift: number; meanAbsMs: number } {
	let best = { hits: -1, of: truth.length, shift: 0, meanAbsMs: 0 };
	for (let shift = -maxShift; shift <= maxShift; shift++) {
		let hits = 0;
		let sum = 0;
		let counted = 0;
		for (let i = 0; i < truth.length; i++) {
			const g = barStarts[i + shift];
			if (g === undefined) continue;
			const err = Math.abs(g - truth[i]!);
			sum += err;
			counted++;
			if (err <= tolSec) hits++;
		}
		const meanAbsMs = counted > 0 ? Math.round((sum / counted) * 1000) : 0;
		if (hits > best.hits) best = { hits, of: truth.length, shift, meanAbsMs };
	}
	return best;
}
