/**
 * Study 23b's downbeat shootout (docs/BRIEF-STUDY23B.md): four
 * mechanical, tap-free anchor estimators and the circular anchor-error
 * grade. Pure arithmetic over instruments prior studies committed.
 */
import { phaseFromOnset } from "../study22/grid.js";

export interface NoteLite {
	start: number;
	pitch: number;
	amplitude: number;
}

/** Circular distance (mod period) from an anchor to the truth's first bar start. */
export function anchorError(anchor: number, truthStart: number, period: number): number {
	const d = (((truthStart - anchor) % period) + period) % period;
	return Math.min(d, period - d);
}

const COMB_FPS = 125;

/** E2: the onset comb over an impulse envelope of low-note starts, amplitude-weighted. */
export function bassCombAnchor(
	notes: NoteLite[],
	period: number,
	durationSec: number,
	pitchMax = 48,
): number {
	const env = new Float32Array(Math.max(1, Math.ceil(durationSec * COMB_FPS)));
	for (const n of notes) {
		if (n.pitch >= pitchMax) continue;
		const frame = Math.round(n.start * COMB_FPS);
		if (frame >= 0 && frame < env.length) env[frame]! += n.amplitude;
	}
	return phaseFromOnset(env, COMB_FPS, period);
}

export const PHASE_STEP_SEC = 0.01;

/** E3: the phase whose lattice minimizes the mean circular distance of chord-change times. */
export function changeCombAnchor(changeTimes: number[], period: number): number {
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
	return bestPhase;
}

/** E4: the earliest transcribed note that is actually loud — the only estimator that can see past a phase. */
export function musicStartAnchor(notes: NoteLite[], minAmplitude = 0.5): number | null {
	let first: number | null = null;
	for (const n of notes) {
		if (n.amplitude < minAmplitude) continue;
		if (first === null || n.start < first) first = n.start;
	}
	return first;
}
