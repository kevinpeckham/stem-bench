/**
 * Study 11c VERBATIM PORT of stem-shovel at 2cf70cb (the v0.200.0 patch):
 * tempoLadderMatch with the declared-meter gates (compound opens the 3:2
 * rungs, triple opens x3) and the two meter predicates. Unchanged beyond
 * concatenation; pinned by test. Does not chase stem-shovel changes
 * mid-study.
 */
/**
 * The rungs of the tempo ladder other than the direct one: double, half,
 * the 3:2 pair, and three (a waltz's beats against its bar).
 */
export const TEMPO_LADDER_RUNGS = [2, 0.5, 1.5, 2 / 3, 3] as const;

/**
 * The rung at which a declared tempo and a detected one are the same grid,
 * or null. factor 1 = direct; otherwise `declared ≈ detected × factor` (a
 * fast waltz declared 224 and detected 112 matches at 2: counted in
 * eighths). Direct is tried first, then double and half, then 1.5 and 2/3
 * only when `compound`, then 3 only when `triple`. Both gates belong to
 * the declared meter (the band's intent), never to the detector's own
 * subdivision flag: stem-bench Study 11b found that flag firing at a pulse
 * two thirds off (a song at 145 detected at 96.7, a third of which is the
 * true eighth), and opening the 3:2 rungs on it excused exactly the gap
 * the comparison should expose. A 2/3 reading on a straight meter is a
 * real error, not a count (docs/tempo-grid-plan.md). ×3 is the fast waltz
 * counted three to the bar while the stems hear the bar as one beat (224
 * in 3/4 against a detected 74.7 in 6/8). `tolerance` is absolute bpm,
 * default 3.
 */
export function tempoLadderMatch(
	declared: number,
	detected: number,
	opts: { compound?: boolean; triple?: boolean; tolerance?: number } = {},
): { factor: number } | null {
	if (!(Number.isFinite(declared) && declared > 0 && Number.isFinite(detected) && detected > 0)) {
		return null;
	}
	const tolerance = opts.tolerance ?? 3;
	const factors = [1, 2, 0.5, ...(opts.compound ? [1.5, 2 / 3] : []), ...(opts.triple ? [3] : [])];
	const factor = factors.find((f) => Math.abs(declared - detected * f) <= tolerance);
	return factor === undefined ? null : { factor };
}
/**
 * Whether a meter's beats divide in three: 6/8, 9/8, 12/8, 6/16 (an eighth
 * or sixteenth denominator and a numerator of 6 or more divisible by 3).
 * 3/8 is one beat a bar and stays simple; 7/8 is additive, not compound.
 */
export function isCompoundMeter(meter: string | null | undefined): boolean {
	const match = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(meter ?? "");
	if (!match) return false;
	const top = Number(match[1]);
	const bottom = Number(match[2]);
	return (bottom === 8 || bottom === 16) && top >= 6 && top % 3 === 0;
}
/**
 * Whether a meter is a bar of three beats: 3/4, 3/8, 3/2. It is the meter
 * whose bar a detector hears as one compound beat (a fast waltz's bar of
 * three quarters reads as a dotted beat of 6/8), so its tempo can sit a
 * factor of three from the detected one. 6/8 and 9/8 divide their beats in
 * three but are not three to the bar (`isCompoundMeter`).
 */
export function isTripleMeter(meter: string | null | undefined): boolean {
	const match = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(meter ?? "");
	return match !== null && Number(match[1]) === 3;
}
