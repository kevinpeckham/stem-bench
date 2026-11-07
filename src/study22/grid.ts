/**
 * Study 22 instruments (docs/BRIEF-STUDY22.md): uniform bar grids and
 * how well they fit a song. Pure arithmetic, no model, no audio I/O —
 * the onset envelope comes in from the Study 9 production port.
 */
import { detrendMirror } from "../study11/ladder.js";

export interface UniformFit {
	period: number;
	phase: number;
}

/** Least-squares (period, phase) over truth bar starts: the ceiling arm. */
export function fitUniformGrid(truth: number[]): UniformFit {
	const n = truth.length;
	if (n < 2) return { period: 0, phase: truth[0] ?? 0 };
	const meanI = (n - 1) / 2;
	let meanT = 0;
	for (const t of truth) meanT += t;
	meanT /= n;
	let num = 0;
	let den = 0;
	for (let i = 0; i < n; i++) {
		num += (i - meanI) * (truth[i]! - meanT);
		den += (i - meanI) ** 2;
	}
	const period = num / den;
	return { period, phase: meanT - period * meanI };
}

export function uniformGrid(fit: UniformFit, n: number): number[] {
	return Array.from({ length: n }, (_, i) => fit.phase + i * fit.period);
}

export interface GridScore {
	hits: number;
	n: number;
	hitRate: number;
	meanAbsMs: number;
	tolMs: number;
}

export const TOL_FRACTION = 0.15;

/** Bar i of the grid against bar i of truth; tolerance is a fraction of the median truth bar. */
export function gridHits(grid: number[], truth: number[], tolFraction = TOL_FRACTION): GridScore {
	const durations = truth
		.slice(1)
		.map((t, i) => t - truth[i]!)
		.sort((a, b) => a - b);
	const median = durations[Math.floor(durations.length / 2)] ?? 0;
	const tol = median * tolFraction;
	let hits = 0;
	let sumAbs = 0;
	for (let i = 0; i < truth.length; i++) {
		const err = Math.abs((grid[i] ?? Number.POSITIVE_INFINITY) - truth[i]!);
		sumAbs += Number.isFinite(err) ? err : 0;
		if (err <= tol) hits++;
	}
	return {
		hits,
		n: truth.length,
		hitRate: hits / truth.length,
		meanAbsMs: Math.round((sumAbs / truth.length) * 1000),
		tolMs: Math.round(tol * 1000),
	};
}

export const PHASE_STEP_SEC = 0.01;

/**
 * The blind downbeat estimate: the phase in [0, period) whose bar-period
 * comb collects the most detrended onset energy (nearest-frame reads).
 * The registered failure mode: every beat has onsets, so the comb may
 * lock to a louder beat of the bar than beat one.
 */
export function phaseFromOnset(onset: Float32Array, fps: number, periodSec: number): number {
	const x = detrendMirror(onset, fps);
	const duration = onset.length / fps;
	let bestPhase = 0;
	let bestScore = -1;
	for (let phase = 0; phase < periodSec; phase += PHASE_STEP_SEC) {
		let sum = 0;
		let count = 0;
		for (let t = phase; t < duration; t += periodSec) {
			const frame = Math.round(t * fps);
			if (frame < x.length) {
				sum += x[frame]!;
				count++;
			}
		}
		const score = count > 0 ? sum / count : -1;
		if (score > bestScore) {
			bestScore = score;
			bestPhase = phase;
		}
	}
	return bestPhase;
}
