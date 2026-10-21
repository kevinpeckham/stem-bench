/**
 * The Study 1 prompt (docs/BRIEF-STUDY1.md, "Protocol"): stem-shovel's
 * `draftChartWithAi` system and question verbatim (src/lib/server/aiDetect.ts),
 * with the no-examples branch, no existing sections, and the hint per arm.
 * The only text that varies between arms is the hint brackets and, in
 * A-none, the one system sentence that introduces them. Pinned by test.
 */
import type { ChordSegment } from "../fixture/chords.js";
import { wrongHint } from "../grading/symbols.js";

/** A-matcher2 (Amendment 2): the v0.142.0 matcher's hints, run after production adopted Study 1's finding. */
export type Arm = "A-none" | "A-matcher" | "A-correct" | "A-wrong" | "A-matcher2";
/** Study 1's four registered arms; A-matcher2 runs separately (scripts/run-study1a.ts). */
export const ARMS: Arm[] = ["A-none", "A-matcher", "A-correct", "A-wrong"];

export interface FixtureSong {
	id: string;
	title: string;
	key: string;
	bpm: number;
	truth: string[];
	barNotes: { bar: number; notes: string }[];
	matcherSegments: { bar: number; bars: number; chord: string }[];
	matcherPerBar: string[];
	/** The v0.142.0 matcher over the same stored notes (scripts/rescore-fixture.ts). */
	matcher2Segments?: { bar: number; bars: number; chord: string }[];
	matcher2PerBar?: string[];
}

/** Production's hint sentence, present in every arm but A-none. */
const MATCHER_SENTENCE =
	" A simple template matcher's guess follows each bar in brackets — a hint, not an answer.";

/** The production system prompt (aiDetect.ts draftChartWithAi), the hint sentence per arm. */
export const system = (arm: Arm) =>
	`You are a music director preparing a chord chart for a band from a transcription of their recording.
For each bar you get the notes an automatic transcriber (Spotify Basic Pitch) heard, lowest to highest, as pitch+octave×seconds sounding@loudness 0..1. The transcription is noisy: weak, short notes are often wrong; long, loud, low notes are reliable.${arm === "A-none" ? "" : MATCHER_SENTENCE} You also get the tempo, key and time signature, and the way this band writes its charts (examples). Do four things:
0. Name the chord in every bar, in this band's chart notation (D, Bm, A7, G5, D7sus4, Dsus4, G/B); think like a rock musician reading a chart — simple, plausible progressions in the key over exotic spellings; power chords (5) and sus chords are common here. Give them as ONE space-separated string in bar order, "%" for a bar that repeats the previous chord and "N.C." for silence — e.g. "D7sus4 % % C5 G5 D7sus4 % %".
1. Split the song into sections (Intro, Verse, Chorus, Bridge, Solo, Outro… reuse names the band uses). Each section gets a roman-numeral index in order (I, II, III…), a name, and the bar it starts on. If the song already has sections, keep their names and starts unless the chords plainly say otherwise.
2. Write each section's chord progression as a compact line, one chord per bar, "|"-separated, with "x2"/"x4" for repeats, in the band's own notation (see the examples: e.g. "D(7)sus4 · D5 x2" or "| D | A | Bm | G |").
3. Draft the chart in markdown in the same style as the examples: a heading per section, the progression under it, a short structure line at the top. Do not invent lyrics.
Reply with JSON only, no prose before or after, keep the chart under 3000 characters: {"chords":"D7sus4 % % C5 G5 …","sections":[{"index":"I","name":"Intro","bar":1},…],"progressions":[{"section":"Intro","chords":"…"}],"chart":"markdown…","notes":"one sentence on anything uncertain"}`;

/** Merges per-bar chords into matcher-shaped segments (equal neighbors join). */
export function toSegments(perBar: string[]): ChordSegment[] {
	const out: ChordSegment[] = [];
	for (const [i, chord] of perBar.entries()) {
		const previous = out[out.length - 1];
		if (previous && previous.chord === chord) previous.bars += 1;
		else out.push({ bar: i + 1, bars: 1, start: 0, chord, confidence: 1 });
	}
	return out;
}

/** The hint segments an arm shows: none, the real matcher's, the truth's, or the truth transformed. */
export function hintSegments(song: FixtureSong, arm: Arm): { bar: number; bars: number; chord: string }[] {
	if (arm === "A-none") return [];
	if (arm === "A-matcher") return song.matcherSegments;
	if (arm === "A-matcher2") {
		if (!song.matcher2Segments) throw new Error("fixture has no v0.142 matcher fields — run rescore-fixture.ts");
		return song.matcher2Segments;
	}
	if (arm === "A-correct") return toSegments(song.truth);
	return toSegments(song.truth.map(wrongHint));
}

/** The production question: song facts, the per-bar notes with hints, the no-examples branch. */
export function question(song: FixtureSong, arm: Arm): string {
	const hint = new Map<number, string>();
	for (const c of hintSegments(song, arm)) {
		for (let i = 0; i < c.bars; i++) hint.set(c.bar + i, i === 0 ? c.chord : "%");
	}
	const barLines = song.barNotes
		.map((b) => `bar ${b.bar}${hint.has(b.bar) ? ` [matcher: ${hint.get(b.bar)}]` : ""}: ${b.notes}`)
		.join("\n");
	return `SONG: "${song.title}", ${song.bpm} bpm, ${song.key}, 4/4
NOTES PER BAR:
${barLines}

No example charts yet; use clear markdown with a heading per section.`;
}
