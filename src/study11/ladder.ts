/**
 * Study 11 instruments (docs/BRIEF-STUDY11.md): the tempo ladder rule
 * and the subdivision test, both pure. Zero model spend.
 *
 * tempoLadderMatch: declared d matches detected x at rung r when
 * |d / (r·x) − 1| ≤ TOLERANCE (a RATIO, production's shipped 2 % rule
 * in settingsChartDisagreement — registered instead of the response
 * draft's absolute ±3, which tightens incorrectly at high rungs).
 * Rungs 1, 2 and ½ are always on the ladder; the 3:2 rungs (1.5, ⅔)
 * only under compound evidence (L-gated) or always (L-open) — the two
 * registered variants whose difference G2 measures.
 *
 * subdivisionOf: evaluated AT A NAMED TEMPO HYPOTHESIS, not at
 * whatever the detector said: r̂(L/3) vs r̂(L/2) on the detrended
 * summed onset envelope, L = 60·fps/bpm, values averaged over lag ±1.
 * Subdivision 3 iff r̂(L/3) > r̂(L/2). For a 3:2 rung the hypothesis
 * is the SLOWER tempo of the declared/detected pair (the dotted-pulse
 * level is where the triplet subdivision lives). detrend and
 * autocorrelation mirror the production port (src/study9/analysis.ts
 * at a99fb18) line for line; they are module-private there, so the
 * mirror is pinned by test against the port's observable behavior.
 */

export const LADDER_TOLERANCE = 0.02;
export const RUNGS_ALWAYS = [1, 2, 0.5];
export const RUNGS_COMPOUND = [1.5, 2 / 3];

export type LadderVariant = "L-gated" | "L-open";

export interface LadderMatch {
	match: boolean;
	rung: number | null;
}

export function tempoLadderMatch(
	declared: number,
	detected: number,
	subdivision: 2 | 3,
	variant: LadderVariant,
): LadderMatch {
	if (!(declared > 0) || !(detected > 0)) return { match: false, rung: null };
	const rungs =
		variant === "L-open" || subdivision === 3 ? [...RUNGS_ALWAYS, ...RUNGS_COMPOUND] : RUNGS_ALWAYS;
	for (const r of rungs) {
		if (Math.abs(declared / (r * detected) - 1) <= LADDER_TOLERANCE) return { match: true, rung: r };
	}
	return { match: false, rung: null };
}

/** Mirrors the port's detrend (analysis.ts a99fb18), line for line. */
export function detrendMirror(onset: Float32Array, fps: number): Float32Array {
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

/** Mirrors the port's autocorrelation, line for line. */
export function autocorrelationMirror(x: Float32Array, lag: number): number {
	let s = 0;
	for (let i = lag; i < x.length; i++) s += x[i]! * x[i - lag]!;
	return s / Math.max(1, x.length - lag);
}

export interface SubdivisionRead {
	subdivision: 2 | 3;
	rBeat: number;
	r2: number;
	r3: number;
}

/**
 * Registered floor: subdivision 3 needs real energy at the one-third
 * lag, ≥ 0.4 of the beat peak — on the development smokes compound
 * items sit near 0.9×, straight items near 0, and triplet swing in
 * between (0.17–0.47: a genuine 3-feel at the sub-beat, reported
 * apart per the brief). Without the floor a straight item with NO
 * subdivision energy at all flips on noise.
 */
export const SUB3_FLOOR = 0.4;

/**
 * Amendment 2: a subdivision-3 claim is only a claim when the
 * hypothesis PULSE exists — r̂ at the beat lag itself must clear an
 * absolute floor. Without it, a bogus 1.5× hypothesis has rBeat ≈ 0,
 * the relative floor is vacuous, and r̂(L/3) > r̂(L/2) degenerates to
 * "shorter lag wins on the autocorrelation main lobe" (measured:
 * genuine pulse hypotheses sit at r̂ 0.36–0.75, bogus ones at
 * 0.001–0.01 — three orders of magnitude of separation).
 */
export const BEAT_FLOOR = 0.1;

/** r̂ at a (possibly fractional) lag: the mean of the integer lags ±1 around it. */
function rAt(x: Float32Array, lag: number): number {
	const center = Math.round(lag);
	let s = 0;
	let n = 0;
	for (const k of [center - 1, center, center + 1]) {
		if (k >= 1 && k < x.length) {
			s += autocorrelationMirror(x, k);
			n++;
		}
	}
	return n ? s / n : 0;
}

/** The subdivision of the beat at `bpm`: does it split in two or in three? */
export function subdivisionOf(onset: Float32Array, fps: number, bpm: number): SubdivisionRead {
	const x = detrendMirror(onset, fps);
	const beatLag = (60 / bpm) * fps;
	const zero = autocorrelationMirror(x, 0) || 1;
	const rBeat = rAt(x, beatLag) / zero;
	const r2 = rAt(x, beatLag / 2) / zero;
	const r3 = rAt(x, beatLag / 3) / zero;
	const sub3 = rBeat >= BEAT_FLOOR && r3 > r2 && r3 >= SUB3_FLOOR * rBeat;
	return { subdivision: sub3 ? 3 : 2, rBeat, r2, r3 };
}

/**
 * The registered wrong-tempo multipliers: genuinely wrong declared
 * values for the false-accept measure. The ×1.5 rows apply only to
 * straight-meter items (on a compound item a 1.5× declaration can be
 * a legitimate count, so it is not "genuinely wrong" there).
 */
export const WRONG_MULTIPLIERS = [1.07, 0.93, 1.12, 0.88, 1.5, 1.33, 0.8] as const;

export function wrongTempoSet(trueBpm: number, compound: boolean): { multiplier: number; declared: number }[] {
	return WRONG_MULTIPLIERS.filter((m) => !(compound && m === 1.5)).map((m) => ({
		multiplier: m,
		declared: Math.round(trueBpm * m * 10) / 10,
	}));
}
