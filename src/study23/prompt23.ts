/**
 * Study 23 prompt (docs/BRIEF-STUDY23.md): the Study 1 production
 * templates with the hint source swapped to the shipped chord reader
 * and one registered adaptation — the declared meter interpolates where
 * the fixture-era question hard-coded "4/4". Pinned by test to be
 * byte-identical to the Study 1 builder whenever the meter is 4/4.
 */
import { system } from "../harness/prompt.js";

/** Production's system prompt with the hint sentence (Study 1 arm A-matcher), verbatim. */
export const system23 = () => system("A-matcher");

export interface RealSong {
	title: string;
	bpm: number;
	key: string;
	meter: string;
	barNotes: { bar: number; notes: string }[];
	/** The shipped reader's per-bar labels (results/study21.json perBar). */
	hintPerBar: string[];
}

/** Equal neighbors join; the segment shows its chord once, then "%" — production's hint shape. */
export function hintMarks(perBar: string[]): Map<number, string> {
	const marks = new Map<number, string>();
	let previous: string | null = null;
	for (const [i, chord] of perBar.entries()) {
		marks.set(i + 1, chord === previous ? "%" : chord);
		previous = chord;
	}
	return marks;
}

export function question23(song: RealSong): string {
	const hint = hintMarks(song.hintPerBar);
	const barLines = song.barNotes
		.map((b) => `bar ${b.bar}${hint.has(b.bar) ? ` [matcher: ${hint.get(b.bar)}]` : ""}: ${b.notes}`)
		.join("\n");
	return `SONG: "${song.title}", ${song.bpm} bpm, ${song.key}, ${song.meter}
NOTES PER BAR:
${barLines}

No example charts yet; use clear markdown with a heading per section.`;
}
