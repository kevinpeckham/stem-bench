/**
 * Study 20 instruments (docs/BRIEF-STUDY20.md): the color candidate the
 * stem-shovel brief specifies — a pure function that dresses ChordMini's
 * per-bar root in the colors the note channel supports without ever
 * changing the root — plus the bar evidence it reads (the v0.231
 * matcher's own weight and bass arithmetic, without the matcher's bass
 * boost, which exists to steer a root choice this function never makes)
 * and the forced-root matcher for the negative control (chordOf231's
 * scoring verbatim with an optional root filter; tests pin both to the
 * Study 18 port over all 440 fixture bars).
 */
import type { Note } from "../fixture/chords.js";
import type { MatcherConfig } from "../study18/chords231.js";

export const PC_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const NOTE_PC: Record<string, number> = {
	C: 0, "B#": 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, Fb: 4,
	F: 5, "E#": 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10,
	Bb: 10, B: 11, Cb: 11,
};

export type Reduced =
	| "maj" | "min" | "7" | "maj7" | "min7" | "dim" | "aug" | "sus4" | "sus2" | "N";

/**
 * A raw ChordMini vocabulary label ("F#:min7", "C", "N", "X") reduced to
 * the brief's families. Registered deviations from the brief's list,
 * disclosed there: maj6 → maj and min6 → min (the chart vocabulary the
 * app displays folds them the same way), minmaj7 → min, and dim7 and
 * hdim7 → dim (the chart vocabulary has no half-diminished symbol; the
 * app's own map shows Cdim for all three, and rule 5 leaves dim alone).
 */
export function reduceLabel(raw: string): { rootPc: number | null; quality: Reduced } {
	if (raw === "N" || raw === "X") return { rootPc: null, quality: "N" };
	const [note, suffix = ""] = raw.split(":");
	const rootPc = NOTE_PC[note!] ?? null;
	if (rootPc === null) return { rootPc: null, quality: "N" };
	const q: Record<string, Reduced> = {
		"": "maj", maj6: "maj", min: "min", min6: "min", minmaj7: "min",
		"7": "7", maj7: "maj7", min7: "min7", dim: "dim", dim7: "dim",
		hdim7: "dim", aug: "aug", sus4: "sus4", sus2: "sus2",
	};
	return { rootPc, quality: q[suffix] ?? "maj" };
}

export interface BarEvidence {
	/** 12-bin pitch-class profile: overlap seconds x (0.3 + amplitude), the matcher's weight. */
	profile: Float64Array;
	total: number;
	/** The bass pitch class under the v0.231 rule, or null. */
	bass: number | null;
	/** The bass note's own weight (for the matcher pin, which adds the 0.5x boost). */
	bassWeight: number;
}

/** The bar's note evidence, the v0.231 matcher's arithmetic without the bass boost. */
export function barEvidence(
	notes: Note[],
	from: number,
	to: number,
	bassMinShare = 0.15,
): BarEvidence {
	const profile = new Float64Array(12);
	let lowest: { pitch: number; weight: number } | null = null;
	for (const n of notes) {
		const overlap = Math.min(n.end, to) - Math.max(n.start, from);
		if (overlap <= 0) continue;
		const weight = overlap * (0.3 + n.amplitude);
		profile[((n.pitch % 12) + 12) % 12]! += weight;
		if (
			n.pitch < 60 &&
			overlap >= (to - from) * bassMinShare &&
			(!lowest || n.pitch < lowest.pitch || (n.pitch === lowest.pitch && weight > lowest.weight))
		) {
			lowest = { pitch: n.pitch, weight };
		}
	}
	let total = 0;
	for (let pc = 0; pc < 12; pc++) total += profile[pc]!;
	return {
		profile,
		total,
		bass: lowest ? ((lowest.pitch % 12) + 12) % 12 : null,
		bassWeight: lowest?.weight ?? 0,
	};
}

export interface ColorConfig {
	/** A pitch class at or over this share of the profile is present (the matcher's 0.12). */
	presentShare: number;
	/** The bass pitch class must carry this share of the profile for a slash (swept 0.15-0.30). */
	slashMinShare: number;
}

export const SHIPPED20: ColorConfig = { presentShare: 0.12, slashMinShare: 0.2 };

const SUFFIX: Record<string, string> = {
	maj: "", min: "m", "7": "7", maj7: "maj7", min7: "m7", dim: "dim",
	aug: "aug", sus4: "sus4", sus2: "sus2", "5": "5", "7sus4": "7sus4",
};
const TONES: Record<string, number[]> = {
	maj: [0, 4, 7], min: [0, 3, 7], "7": [0, 4, 7, 10], maj7: [0, 4, 7, 11],
	min7: [0, 3, 7, 10], dim: [0, 3, 6], aug: [0, 4, 8], sus4: [0, 5, 7],
	sus2: [0, 2, 7], "5": [0, 7], "7sus4": [0, 5, 7, 10],
};

export interface Colored {
	chord: string;
	/** Which rule chose the color: model | power | sus4 | sus2 | 7sus4 | flip. */
	rule: string;
	flipped: boolean;
	slashed: boolean;
}

/**
 * The brief's candidate: never changes the root. Registered
 * interpretation, disclosed in the brief: with the third absent, sus4 is
 * tested before the power chord (the brief's literal order tests the
 * fifth first, and every sus chord contains a fifth, so sus4 would be
 * unreachable); the fourth, then the second, then the bare fifth.
 */
export function colorChord(
	rootPc: number,
	quality: Reduced,
	ev: BarEvidence,
	cfg: ColorConfig = SHIPPED20,
): Colored {
	const out = (q: string, rule: string, flipped = false): Colored => {
		let chord = `${PC_NAMES[rootPc]}${SUFFIX[q] ?? ""}`;
		let slashed = false;
		if (
			ev.bass !== null &&
			ev.bass !== rootPc &&
			ev.total > 0 &&
			ev.profile[ev.bass]! >= cfg.slashMinShare * ev.total &&
			(TONES[q] ?? []).some((i) => (rootPc + i) % 12 === ev.bass)
		) {
			chord = `${chord}/${PC_NAMES[ev.bass]}`;
			slashed = true;
		}
		return { chord, rule, flipped, slashed };
	};
	if (quality === "N") return { chord: "N.C.", rule: "model", flipped: false, slashed: false };
	if (ev.total <= 0) return out(quality, "model");
	const present = (pc: number) => ev.profile[pc]! >= cfg.presentShare * ev.total;
	const at = (interval: number) => (rootPc + interval) % 12;

	if (quality === "maj" || quality === "min") {
		const majThird = present(at(4));
		const minThird = present(at(3));
		if (!majThird && !minThird) {
			if (present(at(5))) return out("sus4", "sus4");
			if (present(at(2))) return out("sus2", "sus2");
			if (present(at(7))) return out("5", "power");
			return out(quality, "model");
		}
		const otherThird = quality === "maj" ? at(3) : at(4);
		const modelHas = quality === "maj" ? majThird : minThird;
		const otherHas = quality === "maj" ? minThird : majThird;
		if (!modelHas && otherHas && ev.profile[otherThird]! >= 2 * cfg.presentShare * ev.total) {
			return out(quality === "maj" ? "min" : "maj", "flip", true);
		}
		return out(quality, "model");
	}
	if (quality === "7") {
		if (!present(at(4)) && !present(at(3)) && present(at(5))) return out("7sus4", "7sus4");
		return out(quality, "model");
	}
	// maj7, min7, dim, aug, sus4, sus2: the model stands (rules 3 and 5).
	return out(quality, "model");
}

/**
 * chordOf231's scoring verbatim (src/study18/chords231.ts) with an
 * optional root filter and no hysteresis: the A3 negative control is the
 * matcher's own template choice with the root forced to the model's and
 * the seventh allowed. With no filter it must equal chordOf231 exactly
 * (tests/study20.test.ts pins it over all 440 fixture bars).
 */
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

export function forcedRootChord(
	profile: ArrayLike<number>,
	bass: number | null,
	cfg: MatcherConfig,
	rootFilter?: number,
): { chord: string; confidence: number } {
	const total = Array.from(profile).reduce((a, b) => a + b, 0);
	if (total <= 0) return { chord: "N.C.", confidence: 0 };
	const scored: { chord: string; root: number; score: number }[] = [];
	for (let root = 0; root < 12; root++) {
		if (rootFilter !== undefined && root !== rootFilter) continue;
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
				chord: `${PC_NAMES[root]}${t.suffix}`,
				root,
				score: bass !== null && bass === root ? score + 0.18 : score,
			});
		}
	}
	scored.sort((a, b) => b.score - a.score);
	const best = scored[0]!;
	let chord = best.chord;
	if (bass !== null && bass !== best.root && best.score > 0.55) chord = `${chord}/${PC_NAMES[bass]}`;
	const runnerUp = scored.find((c) => c.root !== best.root)?.score ?? 0;
	const confidence = Math.max(0, Math.min(1, best.score - Math.max(0, runnerUp) + 0.5));
	return { chord, confidence };
}
