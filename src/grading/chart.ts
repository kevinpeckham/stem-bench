/**
 * Mechanical grading for Study 1 (docs/BRIEF-STUDY1.md, "Grading"),
 * committed before any scored run. The model answers one chord per bar as
 * a single space-separated string ("D % % G …", production's
 * ChartDraftAnswerSchema shape); this expands the "%" repeats, pads or
 * truncates to the song's bar count (a missing or extra bar is a miss),
 * and scores each bar by the registered equivalence in symbols.ts: same
 * root pitch class, same canonical quality, enharmonics equal, slash bass
 * ignored. N.C. matches only N.C.
 */
import { parseChord, sameChord } from "./symbols.js";

/** Expands "D % % G" to per-bar chords; "%" before any chord stays "%" (a miss). */
export function expandChords(answer: string, bars: number): string[] {
	const tokens = answer.trim().split(/\s+/).filter(Boolean);
	const out: string[] = [];
	let previous = "";
	for (const t of tokens) {
		const chord = t === "%" ? previous : t;
		out.push(chord || "%");
		previous = chord || previous;
	}
	if (out.length > bars) out.length = bars;
	while (out.length < bars) out.push("");
	return out;
}

export interface BarGrade {
	bar: number;
	truth: string;
	answer: string;
	correct: boolean;
}

export interface CellGrade {
	bars: BarGrade[];
	correct: number;
	total: number;
	/** Tokens the answer had beyond or short of the bar count. */
	lengthDelta: number;
	/** True when every token parsed as a chord, "%" or N.C. */
	parsedClean: boolean;
}

export function gradeChords(answer: string, truth: string[]): CellGrade {
	const tokens = answer.trim().split(/\s+/).filter(Boolean);
	const expanded = expandChords(answer, truth.length);
	const bars: BarGrade[] = truth.map((t, i) => {
		const a = expanded[i] ?? "";
		const correct =
			a !== "" && (parseChord(t).pc === null ? parseChord(a).pc === null && parseChord(a).ok : sameChord(t, a));
		return { bar: i + 1, truth: t, answer: a, correct };
	});
	return {
		bars,
		correct: bars.filter((b) => b.correct).length,
		total: bars.length,
		lengthDelta: tokens.length - truth.length,
		parsedClean: tokens.every((t) => t === "%" || parseChord(t).ok),
	};
}
