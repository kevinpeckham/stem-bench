/**
 * Study 51 (docs/BRIEF-STUDY51.md): which bars of a transcribed bass line
 * to trust, decided without truth. A bar is trusted when independent
 * readings of the same stem write it identically; the readings are other
 * Basic Pitch configurations (Study 49's cache) and pYIN (Study 48's).
 * Grading is Study 48's bar grade, unchanged.
 */
import { type BarLine, gradeBar } from "../study48/bassLine.js";

/** Two bars are the same line when they are on the same subdivision with the same pitches in the same slots. Note ends are not compared, as the bar grade does not grade them. */
export function sameLine(a: BarLine, b: BarLine): boolean {
	if (a.onsets.size !== b.onsets.size) return false;
	if (a.mode !== b.mode) return a.onsets.size === 0;
	for (const [slot, n] of a.onsets) {
		const m = b.onsets.get(slot);
		if (!m || m.pitch !== n.pitch) return false;
	}
	return true;
}

export const RULES = ["everyBar", "configs", "loosened", "pyin", "all"] as const;
export type RuleName = (typeof RULES)[number];

export interface Readings {
	/** The line the app would show: Study 49's selected configuration. */
	shown: BarLine;
	/** The app's own configuration (inferred onsets and the melodia pass on). */
	app: BarLine;
	/** The selected configuration with the frame threshold lowered to 0.2. */
	frame: BarLine;
	/** The selected configuration with the minimum note shortened to 6 frames. */
	short: BarLine;
	/** pYIN. */
	pyin: BarLine;
}

/** Which rules trust this bar. `everyBar` is the baseline; `all` needs every reading to agree. */
export function trusts(r: Readings): Record<RuleName, boolean> {
	const configs = sameLine(r.shown, r.app);
	const loosened = sameLine(r.shown, r.frame) && sameLine(r.shown, r.short);
	const pyin = sameLine(r.shown, r.pyin);
	return { everyBar: true, configs, loosened, pyin, all: configs && loosened && pyin };
}

export interface TrustScore {
	/** Graded bars whose shown line has a note. */
	bars: number;
	/** Of those, the bars the rule trusts: what the app would show. */
	shown: number;
	right: number;
	oneError: number;
	wrong: number;
	/** Graded bars whose shown line is empty and that the rule trusts, and how many of them the truth also leaves empty. */
	rests: number;
	restsRight: number;
	/** Truth onsets in the graded span, and those written in a shown bar in the right slot at the right pitch. */
	truthOnsets: number;
	notesShownRight: number;
}

export function emptyScore(): TrustScore {
	return { bars: 0, shown: 0, right: 0, oneError: 0, wrong: 0, rests: 0, restsRight: 0, truthOnsets: 0, notesShownRight: 0 };
}

/** Add one bar to a rule's score. */
export function addBar(score: TrustScore, truth: BarLine, shownLine: BarLine, trusted: boolean): void {
	score.truthOnsets += truth.onsets.size;
	const g = gradeBar(truth, shownLine);
	if (shownLine.onsets.size === 0) {
		if (trusted) {
			score.rests++;
			if (g.cls === "right") score.restsRight++;
		}
		return;
	}
	score.bars++;
	if (!trusted) return;
	score.shown++;
	if (g.cls === "right") score.right++;
	else if (g.cls === "one-error") score.oneError++;
	else score.wrong++;
	score.notesShownRight += g.pitchRight;
}

export const precision = (s: TrustScore) => (s.shown ? s.right / s.shown : 0);
export const wrongShare = (s: TrustScore) => (s.shown ? s.wrong / s.shown : 0);
export const coverage = (s: TrustScore) => (s.bars ? s.shown / s.bars : 0);
