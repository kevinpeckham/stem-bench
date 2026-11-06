/**
 * Study 18 instrument: stem-shovel's v0.231.0 chord matcher
 * (src/lib/audio/chords.ts at tag v0.231.0, commit 748a3369), ported
 * verbatim except that the three scoring constants are parameters, so
 * the registered configurations and the disclosed sweep run through ONE
 * code path. The shipped defaults are v0.231.0's constants; the
 * v0.142 configuration { presentShare: 0.05, missingPenalty: 0.08,
 * bassMinShare: 0 } must reproduce the bench's pinned v0.142 port
 * bar-for-bar (tests/study18.test.ts proves it over all 440 fixture
 * bars — with bassMinShare 0 the overlap condition is always true,
 * which is exactly the old "lowest note whatever its length" rule).
 */
import type { ChordSegment, Note } from "../fixture/chords.js";

export interface MatcherConfig {
	/** A template tone under this share of the bar's profile counts as missing. */
	presentShare: number;
	/** What each missing template tone costs. */
	missingPenalty: number;
	/** The bass note must sound for this share of the bar to earn the root bonus. */
	bassMinShare: number;
}

/** v0.231.0's shipped constants. */
export const SHIPPED: MatcherConfig = { presentShare: 0.12, missingPenalty: 0.12, bassMinShare: 0.15 };
/** The v0.142 rules (the bench's pinned port; no bass-duration rule). */
export const V142: MatcherConfig = { presentShare: 0.05, missingPenalty: 0.08, bassMinShare: 0 };

const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

const TEMPLATES: { suffix: string; intervals: number[] }[] = [
	{ suffix: "", intervals: [0, 4, 7] },
	{ suffix: "m", intervals: [0, 3, 7] },
	{ suffix: "7", intervals: [0, 4, 7, 10] },
	{ suffix: "maj7", intervals: [0, 4, 7, 11] },
	{ suffix: "m7", intervals: [0, 3, 7, 10] },
	{ suffix: "sus4", intervals: [0, 5, 7] },
	{ suffix: "7sus4", intervals: [0, 5, 7, 10] },
	{ suffix: "sus2", intervals: [0, 2, 7] },
	{ suffix: "dim", intervals: [0, 3, 6] },
	{ suffix: "aug", intervals: [0, 4, 8] },
	{ suffix: "5", intervals: [0, 7] },
];

export function chordOf231(
	profile: ArrayLike<number>,
	bass: number | null,
	previous: string | undefined,
	cfg: MatcherConfig,
): { chord: string; confidence: number } {
	const total = Array.from(profile).reduce((a, b) => a + b, 0);
	if (total <= 0) return { chord: "N.C.", confidence: 0 };
	const scored: { chord: string; root: number; score: number }[] = [];
	for (let root = 0; root < 12; root++) {
		for (const t of TEMPLATES) {
			const inChord = new Set(t.intervals.map((i) => (root + i) % 12));
			let inside = 0;
			let missing = 0;
			for (let pc = 0; pc < 12; pc++) {
				if (!inChord.has(pc)) continue;
				inside += profile[pc] as number;
				if ((profile[pc] as number) < total * cfg.presentShare) missing += 1;
			}
			const score =
				inside / total - 0.03 * Math.max(0, t.intervals.length - 3) - cfg.missingPenalty * missing;
			scored.push({
				chord: `${NAMES[root]}${t.suffix}`,
				root,
				score: bass !== null && bass === root ? score + 0.18 : score,
			});
		}
	}
	scored.sort((a, b) => b.score - a.score);
	let best = scored[0]!;
	if (previous) {
		const kept = scored.find((c) => c.chord === previous);
		if (kept && kept.score >= best.score - 0.06) best = kept;
	}
	let chord = best.chord;
	if (bass !== null && bass !== best.root && best.score > 0.55) chord = `${chord}/${NAMES[bass]}`;
	const runnerUp = scored.find((c) => c.root !== best.root)?.score ?? 0;
	const confidence = Math.max(0, Math.min(1, best.score - Math.max(0, runnerUp) + 0.5));
	return { chord, confidence };
}

export function chordsPerBar231(
	notes: Note[],
	barStarts: number[],
	cfg: MatcherConfig = SHIPPED,
): ChordSegment[] {
	const bars: ChordSegment[] = [];
	for (let b = 0; b + 1 < barStarts.length; b++) {
		const from = barStarts[b]!;
		const to = barStarts[b + 1]!;
		const profile = new Float64Array(12);
		let lowest: { pitch: number; weight: number } | null = null;
		for (const n of notes) {
			const overlap = Math.min(n.end, to) - Math.max(n.start, from);
			if (overlap <= 0) continue;
			const weight = overlap * (0.3 + n.amplitude);
			profile[((n.pitch % 12) + 12) % 12]! += weight;
			if (
				n.pitch < 60 &&
				overlap >= (to - from) * cfg.bassMinShare &&
				(!lowest || n.pitch < lowest.pitch || (n.pitch === lowest.pitch && weight > lowest.weight))
			) {
				lowest = { pitch: n.pitch, weight };
			}
		}
		const bass = lowest ? ((lowest.pitch % 12) + 12) % 12 : null;
		if (bass !== null) profile[bass]! += lowest!.weight * 0.5;
		const previous = bars[bars.length - 1];
		const { chord, confidence } = chordOf231(profile, bass, previous?.chord, cfg);
		if (previous && previous.chord === chord) previous.bars += 1;
		else bars.push({ bar: b + 1, bars: 1, start: from, chord, confidence });
	}
	return bars;
}
