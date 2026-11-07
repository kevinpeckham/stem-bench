/**
 * Study 23 grading (docs/BRIEF-STUDY23.md): the chart channel through
 * the production adapter (barmark 0.5.0, the version the app consumes),
 * the chords-string channel beside it, roots over chord-bearing bars,
 * and peaceful-dreams' 62 dialect bars. All mechanical.
 */
import { parseChord } from "../grading/symbols.js";
import { barmarkChartBars } from "../study16/barmarkChartBars.js";

/** Production's per-bar chords string ("D7sus4 % % C5…") expanded; "%" repeats, leading "%" is empty. */
export function expandChords(chords: string): string[] {
	const out: string[] = [];
	let previous = "";
	for (const token of chords.split(/\s+/).filter(Boolean)) {
		const chord = token === "%" ? previous : token;
		out.push(chord);
		previous = chord;
	}
	return out;
}

/** The chart markdown as the app reads it: per-bar first chords, or null when the adapter refuses it. */
export function chartPerBar(
	markdown: string,
	defaults: { tempo: number; meter: string },
): string[] | null {
	const read = barmarkChartBars(markdown, defaults);
	if (!read || read.bars.length === 0) return null;
	return read.bars.map((b) => b.chords[0] ?? "N.C.");
}

export interface RootScore {
	right: number;
	bearing: number;
}

/** Pitch-class roots over chord-bearing bars (truth's first non-empty chord). */
export function rootScore(answers: string[], truth: string[][]): RootScore {
	let right = 0;
	let bearing = 0;
	for (const [b, truthChords] of truth.entries()) {
		const first = truthChords.find((t) => t !== "");
		if (!first) continue;
		bearing++;
		const t = parseChord(first);
		const a = parseChord(answers[b] ?? "");
		if (t.ok && a.ok && t.pc !== null && a.pc === t.pc) right++;
	}
	return { right, bearing };
}

/** The bars Study 21 showed are half-heard: truth quality 5(7) or 7sus4. */
export function isDialectBar(truthChords: string[]): boolean {
	const first = truthChords.find((t) => t !== "");
	if (!first) return false;
	const q = parseChord(first).quality;
	return q === "5(7)" || q === "7sus4";
}
