/**
 * Study 37 (docs/BRIEF-STUDY37.md), part C: the harmonic-rhythm period
 * witness. Given a beat lattice (a tracker's beats) and chord-change
 * times (a chord reader's segment starts), score candidate bar lengths
 * in beats and pick the one whose bar lines carry the harmonic rhythm.
 * Mechanical, unit-tested (tests/study37.test.ts), no model.
 */

export interface Segment {
	start: number;
	end: number;
	chord: string;
}

/**
 * Chord-change beat indices: each segment start after the first (and
 * any transition into or out of "no chord" is ignored) snapped to the
 * nearest beat when within half a beat interval of it. Deduplicated and
 * sorted.
 */
export function changeBeats(segments: Segment[], beats: number[], noChord = "N"): number[] {
	const out = new Set<number>();
	for (let i = 1; i < segments.length; i++) {
		const a = segments[i - 1]!;
		const b = segments[i]!;
		if (a.chord === noChord || b.chord === noChord || a.chord === b.chord) continue;
		const t = b.start;
		// binary search for the nearest beat
		let lo = 0;
		let hi = beats.length - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (beats[mid]! < t) lo = mid + 1;
			else hi = mid;
		}
		let j = lo;
		if (j > 0 && Math.abs(beats[j - 1]! - t) < Math.abs(beats[j]! - t)) j = j - 1;
		const left = j > 0 ? beats[j]! - beats[j - 1]! : j + 1 < beats.length ? beats[j + 1]! - beats[j]! : 0;
		if (left > 0 && Math.abs(beats[j]! - t) <= left / 2) out.add(j);
	}
	return [...out].sort((x, y) => x - y);
}

export interface CandidateScore {
	/** Bar length in beats. */
	k: number;
	/** Phase: beat index of the first bar line, 0 ≤ p < k. */
	phase: number;
	/** Fraction of bars whose first beat carries a chord change. */
	startRate: number;
	/** Fraction of bars with no chord change strictly inside them. */
	stability: number;
	/** startRate × stability. */
	score: number;
	bars: number;
}

/**
 * Score one bar length at its best phase. Bars are the groups of k
 * beats from phase p; only bars that lie entirely between the first and
 * last change (inclusive) count, so leading and trailing chordless
 * stretches do not dilute either rate.
 */
export function scoreBarLength(changes: number[], k: number): CandidateScore {
	if (changes.length === 0) return { k, phase: 0, startRate: 0, stability: 0, score: 0, bars: 0 };
	const first = changes[0]!;
	const last = changes[changes.length - 1]!;
	const set = new Set(changes);
	let best: CandidateScore | null = null;
	for (let p = 0; p < k; p++) {
		// first bar line at or after `first` with this phase
		let start = first + ((((p - first) % k) + k) % k);
		let bars = 0;
		let starts = 0;
		let stable = 0;
		for (; start + k - 1 <= last; start += k) {
			bars++;
			if (set.has(start)) starts++;
			let interior = false;
			for (let j = start + 1; j < start + k; j++) {
				if (set.has(j)) {
					interior = true;
					break;
				}
			}
			if (!interior) stable++;
		}
		if (bars === 0) continue;
		const startRate = starts / bars;
		const stability = stable / bars;
		const cand = { k, phase: p, startRate, stability, score: startRate * stability, bars };
		if (!best || cand.score > best.score || (cand.score === best.score && cand.startRate > best.startRate)) best = cand;
	}
	return best ?? { k, phase: 0, startRate: 0, stability: 0, score: 0, bars: 0 };
}

export const RATIOS = [1 / 2, 2 / 3, 1, 3 / 2, 2] as const;

/** Integer bar lengths reachable from the base at the registered ratios (k ≥ 2, exact integers only). */
export function candidateLengths(baseK: number, ratios: readonly number[] = RATIOS): number[] {
	const ks = new Set<number>();
	for (const r of ratios) {
		const k = baseK * r;
		if (Math.abs(k - Math.round(k)) < 1e-9 && Math.round(k) >= 2) ks.add(Math.round(k));
	}
	return [...ks].sort((a, b) => a - b);
}

export interface WitnessResult {
	/** Chosen bar length in beats, or the base when abstaining. */
	k: number;
	ratio: number;
	abstain: string | null;
	margin: number | null;
	ranked: CandidateScore[];
	changes: number;
}

/**
 * The witness: pick the candidate with the highest score; abstain (keep
 * the base) when there are fewer than `minChanges` changes or the score
 * margin over the runner-up is below `minMargin`. Ties at the top break
 * toward the SHORTER bar (the collapse-safe direction).
 */
export function harmonicPeriod(changes: number[], baseK: number, minChanges = 8, minMargin = 0.1, ratios: readonly number[] = RATIOS): WitnessResult {
	const ks = candidateLengths(baseK, ratios);
	const ranked = ks.map((k) => scoreBarLength(changes, k)).sort((a, b) => b.score - a.score || a.k - b.k);
	if (changes.length < minChanges) return { k: baseK, ratio: 1, abstain: "too few changes", margin: null, ranked, changes: changes.length };
	const top = ranked[0]!;
	const second = ranked[1];
	const margin = second ? top.score - second.score : top.score;
	if (margin < minMargin) return { k: baseK, ratio: 1, abstain: "thin margin", margin, ranked, changes: changes.length };
	return { k: top.k, ratio: top.k / baseK, abstain: null, margin, ranked, changes: changes.length };
}

/** Collapse identical neighbours: the merge step of the collapse-safe policy. */
export function mergeIdentical<T>(cells: T[]): T[] {
	const out: T[] = [];
	for (const c of cells) if (out.length === 0 || out[out.length - 1] !== c) out.push(c);
	return out;
}
