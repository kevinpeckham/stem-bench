/**
 * Study 44 (docs/BRIEF-STUDY44.md): the app's two rules on the tracker's
 * bars, ported verbatim from stem-shovel src/lib/utils/trackerBarGrid.ts
 * and beatThisGrid.ts (dev 36e7a919) so the bench measures the rule the
 * app ships, plus two candidate steadiness measures of the bench's own.
 * Mechanical; pinned by tests/study44.test.ts to the app's own cases.
 */

export interface Reading {
	beats: number[];
	downbeats: number[];
	duration: number;
}

/** numpy's median: the mean of the two middle values for an even count. */
export function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = sorted.length >> 1;
	return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Beats per bar for each pair of consecutive downbeats: the beats strictly between, plus one (the app's beatThisGrid). */
export function barCounts(beats: number[], downbeats: number[]): number[] {
	const out: number[] = [];
	for (let i = 1; i < downbeats.length; i++) {
		const from = downbeats[i - 1]!;
		const to = downbeats[i]!;
		out.push(beats.filter((b) => b > from && b < to).length + 1);
	}
	return out;
}

/** The most frequent count, the smallest on a tie; null for none. */
export function modalOf(counts: number[]): number | null {
	const tally: Record<number, number> = {};
	for (const n of counts) tally[n] = (tally[n] ?? 0) + 1;
	let best: number | null = null;
	for (const [key, n] of Object.entries(tally)) {
		const k = Number(key);
		if (best === null || n > tally[best]! || (n === tally[best] && k < best)) best = k;
	}
	return best;
}

export function meterOf(beatsPerBar: number | null): "4/4" | "3/4" | "6/8" | null {
	if (beatsPerBar === null) return null;
	if (beatsPerBar === 6) return "6/8";
	return beatsPerBar === 3 ? "3/4" : "4/4";
}

/** The app's tempo: 60 over the median inter-beat interval, whole bpm. */
export function tempoOf(beats: number[]): number | null {
	if (beats.length < 2) return null;
	return Math.round(60 / median(beats.slice(1).map((b, i) => b - beats[i]!)));
}

/**
 * Rule 1, the app's joinHalfBars verbatim: where the usual bar has an even
 * count of beats and two bars in a row each have half of it, the line
 * between them goes; a half bar with no partner stays as read. The app
 * counts a bar's beats as those at or after its downbeat and before the
 * next (its downbeats are among its beats).
 */
export function joinHalfBars(beats: number[], downbeats: number[], usual: number): number[] {
	if (usual % 2 !== 0) return downbeats;
	const count = (i: number) => beats.filter((b) => b >= downbeats[i]! && b < downbeats[i + 1]!).length;
	const out: number[] = [];
	for (let i = 0; i < downbeats.length; i++) {
		out.push(downbeats[i]!);
		const pair = i + 2 < downbeats.length && count(i) === usual / 2 && count(i + 1) === usual / 2;
		if (pair) i++;
	}
	return out;
}

/** Rule 2's measure, the app's steadyShare verbatim: the share of the bars (downbeat to downbeat) that hold `usual` beats. */
export function steadyShare(beats: number[], downbeats: number[], usual: number): number {
	let steady = 0;
	for (let i = 0; i + 1 < downbeats.length; i++) {
		const n = beats.filter((b) => b >= downbeats[i]! && b < downbeats[i + 1]!).length;
		if (n === usual) steady++;
	}
	return steady / (downbeats.length - 1);
}

/**
 * The bench's candidate: the share of bars at the usual count OR at its
 * double or half (a metrical fold, which Study 41 found costs a draft
 * nothing). A 6/8 song the tracker reads as bars of 3 and 6 by turns is
 * steady by this measure and not by the app's.
 */
export function foldShare(beats: number[], downbeats: number[], usual: number): number {
	const ok = new Set([usual, usual * 2, ...(usual % 2 === 0 ? [usual / 2] : [])]);
	let steady = 0;
	for (let i = 0; i + 1 < downbeats.length; i++) {
		const n = beats.filter((b) => b >= downbeats[i]! && b < downbeats[i + 1]!).length;
		if (ok.has(n)) steady++;
	}
	return steady / (downbeats.length - 1);
}

/** The bench's second candidate: the coefficient of variation of the inter-beat interval (a steady beat has a small one). */
export function beatCv(beats: number[]): number | null {
	if (beats.length < 3) return null;
	const iv = beats.slice(1).map((b, i) => b - beats[i]!);
	const mean = iv.reduce((a, b) => a + b, 0) / iv.length;
	const sd = Math.sqrt(iv.reduce((a, b) => a + (b - mean) ** 2, 0) / iv.length);
	return mean > 0 ? sd / mean : null;
}

export const MIN_BARS = 4;
export const MIN_STEADY_SHARE = 0.6;
export const MIN_CLOSING_SHARE = 0.5;

export interface TrackerBarGrid {
	bars: number[];
	meter: "4/4" | "3/4" | "6/8";
	barSeconds: number;
}

/** The app's trackerBarGrid verbatim (null: the draft keeps the declared grid). `minShare` lets the sweep move Rule 2's threshold. */
export function trackerBarGrid(read: Reading | null, minShare = MIN_STEADY_SHARE): TrackerBarGrid | null {
	if (!read || read.downbeats.length < MIN_BARS + 1) return null;
	const beatsPerBar = modalOf(barCounts(read.beats, read.downbeats));
	const meter = meterOf(beatsPerBar);
	if (!meter || !beatsPerBar) return null;
	const starts = joinHalfBars(read.beats, read.downbeats, beatsPerBar);
	if (starts.length < MIN_BARS + 1) return null;
	if (steadyShare(read.beats, starts, beatsPerBar) < minShare) return null;
	const barSeconds = median(starts.slice(1).map((t, i) => t - starts[i]!));
	const last = starts.at(-1)!;
	const closes = read.duration - last >= MIN_CLOSING_SHARE * barSeconds;
	return { bars: closes ? [...starts, read.duration] : [...starts], meter, barSeconds };
}

/** Everything Study 44 reports about one reading. */
export interface GridProfile {
	downbeats: number;
	usual: number | null;
	meter: "4/4" | "3/4" | "6/8" | null;
	tempo: number | null;
	counts: Record<string, number>;
	/** Pairs of adjacent half bars Rule 1 joins. */
	joins: number;
	/** The app's measure, on the bars as read and after joining (the app applies Rule 2 after Rule 1). */
	shareAsRead: number | null;
	shareJoined: number | null;
	foldShareAsRead: number | null;
	beatCv: number | null;
	/** Bars the chart would draw: as read, and after joining (both with the closing bar when it is due). */
	barsAsRead: number;
	barsJoined: number;
	/** Rule 2 at the app's threshold, after Rule 1: does the reading stand? */
	stands: boolean;
}

export function profile(read: Reading): GridProfile {
	const counts = barCounts(read.beats, read.downbeats);
	const usual = modalOf(counts);
	const tally: Record<string, number> = {};
	for (const n of counts) tally[String(n)] = (tally[String(n)] ?? 0) + 1;
	const joined = usual ? joinHalfBars(read.beats, read.downbeats, usual) : read.downbeats;
	const closing = (starts: number[]) => {
		if (starts.length < 2) return starts.length;
		const barSeconds = median(starts.slice(1).map((t, i) => t - starts[i]!));
		return starts.length - 1 + (read.duration - starts.at(-1)! >= MIN_CLOSING_SHARE * barSeconds ? 1 : 0);
	};
	return {
		downbeats: read.downbeats.length,
		usual,
		meter: meterOf(usual),
		tempo: tempoOf(read.beats),
		counts: tally,
		joins: read.downbeats.length - joined.length,
		shareAsRead: usual && read.downbeats.length > 1 ? steadyShare(read.beats, read.downbeats, usual) : null,
		shareJoined: usual && joined.length > 1 ? steadyShare(read.beats, joined, usual) : null,
		foldShareAsRead: usual && read.downbeats.length > 1 ? foldShare(read.beats, read.downbeats, usual) : null,
		beatCv: beatCv(read.beats),
		barsAsRead: closing(read.downbeats),
		barsJoined: closing(joined),
		stands: trackerBarGrid(read) !== null,
	};
}

/** Declared bar in seconds (Study 36b's convention): 6/8 is two dotted quarters at the declared tempo; 3/4 three quarters; 4/4 four. */
export function declaredBarSec(bpm: number, meter: string): number {
	const beats = meter === "6/8" ? 2 : meter === "3/4" ? 3 : 4;
	return (beats * 60) / bpm;
}
