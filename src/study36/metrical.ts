/**
 * Study 36 graders (docs/BRIEF-STUDY36.md): bar-level metrical grading
 * of beat/downbeat trackers and the production detector against
 * registered truth. Every score here is mechanical and unit-tested
 * (tests/study36.test.ts).
 */

export interface TrackerSummary {
	/** Median inter-beat interval in seconds, or null with fewer than two beats. */
	beatSec: number | null;
	/** Median inter-downbeat interval in seconds, or null with fewer than two downbeats. */
	barSec: number | null;
	/** Beats per bar: round(barSec / beatSec), or null. */
	beatsPerBar: number | null;
	/** 60 / beatSec, or null. */
	bpm: number | null;
	beatCount: number;
	downbeatCount: number;
}

export function median(xs: number[]): number {
	const s = [...xs].sort((a, b) => a - b);
	const m = s.length >> 1;
	return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

const diffs = (xs: number[]): number[] => xs.slice(1).map((x, i) => x - xs[i]!);

/** Period, grouping and tempo read off a tracker's beat and downbeat times. */
export function summarizeTracker(beats: number[], downbeats: number[]): TrackerSummary {
	const beatSec = beats.length >= 2 ? median(diffs(beats)) : null;
	const barSec = downbeats.length >= 2 ? median(diffs(downbeats)) : null;
	const beatsPerBar = beatSec && barSec ? Math.round(barSec / beatSec) : null;
	return {
		beatSec,
		barSec,
		beatsPerBar,
		bpm: beatSec ? 60 / beatSec : null,
		beatCount: beats.length,
		downbeatCount: downbeats.length,
	};
}

/** The metrical folds an estimate may sit at relative to truth: thirds, halves, two-thirds, unity and their inverses. */
export const FOLDS = [1 / 3, 1 / 2, 2 / 3, 1, 3 / 2, 2, 3] as const;

export interface FoldResult {
	/** The fold (est ≈ truth × ratio) with the smallest relative error. */
	ratio: number;
	/** |est / (truth × ratio) − 1| at that fold. */
	errPct: number;
	/** Within tolerance at ratio 1. */
	strict: boolean;
	/** Within tolerance at some fold. */
	folded: boolean;
}

/** Compare an estimated period (or tempo) to truth, strict and octave-folded, at a relative tolerance (default 4 %). */
export function foldCompare(est: number, truth: number, tolerance = 0.04): FoldResult {
	let best: { ratio: number; errPct: number } | null = null;
	for (const ratio of FOLDS) {
		const errPct = Math.abs(est / (truth * ratio) - 1);
		if (!best || errPct < best.errPct) best = { ratio, errPct };
	}
	const strictErr = Math.abs(est / truth - 1);
	return {
		ratio: best!.ratio,
		errPct: best!.errPct,
		strict: strictErr <= tolerance,
		folded: best!.errPct <= tolerance,
	};
}

export type MeterClass = 3 | 4 | "compound";

/**
 * Whether a tracker's beats-per-bar reading satisfies the truth class.
 * 4/4 is satisfied by 4 (or 8, a doubled beat); 3/4 by 3 only; compound
 * (6/8) by 6 (eighths) or 2 (dotted quarters). A 2 on a 4/4 song is a
 * halved beat with the right bar and is counted wrong here, since the
 * grouping label would be wrong on the chart.
 */
export function meterSatisfied(beatsPerBar: number | null, truth: MeterClass): boolean {
	if (beatsPerBar === null) return false;
	if (truth === 4) return beatsPerBar === 4 || beatsPerBar === 8;
	if (truth === 3) return beatsPerBar === 3;
	return beatsPerBar === 6 || beatsPerBar === 2;
}

/** The production detector's meter string as a class. */
export function meterStringClass(meter: string): MeterClass | null {
	if (meter === "4/4") return 4;
	if (meter === "3/4") return 3;
	if (meter === "6/8") return "compound";
	return null;
}

/** Beats to the bar the production pipeline places for a meter string (its own convention: beats of the bar). */
export function productionBeatsPerBar(meter: string): number {
	return meter === "3/4" ? 3 : meter === "6/8" ? 6 : 4;
}

export interface FScore {
	f: number;
	precision: number;
	recall: number;
	matched: number;
	estimated: number;
	reference: number;
}

/**
 * Downbeat F-measure in the mir_eval convention: one-to-one greedy
 * matching within ±window seconds (default 70 ms). References before
 * `from` or after `to` are ignored so a tracker is not penalized for the
 * silence a truth grid extends into.
 */
export function downbeatF(est: number[], ref: number[], window = 0.07, from = Number.NEGATIVE_INFINITY, to = Number.POSITIVE_INFINITY): FScore {
	const refs = ref.filter((r) => r >= from && r <= to).sort((a, b) => a - b);
	const ests = [...est].sort((a, b) => a - b);
	const used = new Array<boolean>(ests.length).fill(false);
	let matched = 0;
	for (const r of refs) {
		let bestI = -1;
		let bestD = window;
		for (let i = 0; i < ests.length; i++) {
			if (used[i]) continue;
			const d = Math.abs(ests[i]! - r);
			if (d <= bestD) {
				bestD = d;
				bestI = i;
			}
			if (ests[i]! - r > window) break;
		}
		if (bestI >= 0) {
			used[bestI] = true;
			matched++;
		}
	}
	const precision = ests.length ? matched / ests.length : 0;
	const recall = refs.length ? matched / refs.length : 0;
	const f = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
	return { f, precision, recall, matched, estimated: ests.length, reference: refs.length };
}

/** A uniform downbeat grid from bar one to the end of the audio (bars before bar one included back to time zero). */
export function uniformDownbeats(barOne: number, barSec: number, durationSec: number): number[] {
	const out: number[] = [];
	let t = barOne;
	while (t - barSec >= 0) t -= barSec;
	for (; t <= durationSec; t += barSec) out.push(t);
	return out;
}
