/**
 * The REDESIGNED song-check, ported verbatim (stem-shovel origin/dev at
 * v0.192.0, commit 95ed19aa: askAiAboutMix + CHART_NOTE +
 * chartStatedAnswer) — the production response to Study 4, under
 * re-measurement in Study 7. Pinned by tests/study7.test.ts. The model
 * is now a chart reader with the recording playing: tempo and meter are
 * chart transcription ("Do not estimate a tempo by ear"), key comes
 * from signature and chords, placement by ear via bar-following, and
 * the application layer (`chartStatedAnswer`) keeps tempo/meter only
 * where the chart text states them.
 */
import * as v from "valibot";

const Bpm = v.pipe(v.number(), v.minValue(20), v.maxValue(400));
const Key = v.pipe(v.string(), v.trim(), v.maxLength(20));
export const AnswerSchema7 = v.object({
	tempo: v.nullable(Bpm),
	tempoChanges: v.optional(
		v.pipe(v.array(v.object({ at: v.pipe(v.number(), v.minValue(0)), bpm: Bpm })), v.maxLength(12)),
		[],
	),
	meter: v.union([v.pipe(v.string(), v.regex(/^\d{1,2}\/\d{1,2}$/)), v.literal("free")]),
	key: Key,
	keyChanges: v.optional(
		v.pipe(v.array(v.object({ at: v.pipe(v.number(), v.minValue(0)), key: Key })), v.maxLength(24)),
		[],
	),
	notes: v.optional(v.pipe(v.string(), v.maxLength(400)), ""),
});
export type AiAnswer7 = v.InferOutput<typeof AnswerSchema7>;

/** Production's CHART_NOTE for the two chart kinds the bench sends (text summary or band chart; never a file part). */
export function chartNote7(chord: boolean): string {
	return `The song's own chart comes with the recording${
		chord
			? ', as the band wrote it: its sections, the chords of each (one per bar unless it says otherwise, with repeats as "x2"), sometimes the words. It has no key signatures and marks no bars: read each part\'s key from the chords it moves through, and follow its sections in the recording'
			: ", as a measure-by-measure summary (key signatures, time signatures, tempo marks, repeats, rehearsal marks and chord symbols)"
	}. First make sure it is the chart of this recording (the same piece: its harmony, meter and form match what you hear); if it plainly is not, set it aside, answer from the recording alone and say so in "notes".`;
}

export function system7(chord: boolean): string {
	return `You are a musician with perfect time and pitch, reading a song's chart while its recording plays. ${chartNote7(chord)} Report:
- "key": the key at the start, like "D major" or "B minor", from the chart's key signature and the chords it opens with; "atonal" if it has none.
- "keyChanges": where the song moves to another key, as a list of {"at": seconds from the start, "key": the new key}, in order. The chart's key signatures and the chords it moves through say what key each part is in, more surely than the ear does. Use the recording to place each change in seconds: follow the chart's bars at the tempo you hear, counting repeats as played. A passing or borrowed chord is not a key change; a section that settles in a new key is. Empty list when the song stays in one key.
- "meter": the time signature the chart states (like 4/4, 3/4, 6/8); "free" when it marks none.
- "tempo": the beats per minute of the chart's tempo mark at the start; null when the chart has no tempo mark. Do not estimate a tempo by ear.
- "tempoChanges": the chart's later tempo marks, as a list of {"at": seconds from the start, "bpm": the new tempo}, in order, placed in the recording the same way; empty when it has none.
- "notes": one short sentence on anything uncertain. If the recording departs from the chart (a different key, a cut section), say so here and answer for the recording.
Reply with JSON only, no prose, exactly: {"tempo": 128, "tempoChanges": [], "meter": "4/4", "key": "D major", "keyChanges": [{"at": 62, "key": "F major"}], "notes": "..."}`;
}

export function question7(settings: { tempo: string | null; meter: string | null }, chartText: string): string {
	const known = [
		settings.tempo ? `tempo ${settings.tempo} bpm` : null,
		settings.meter ? `time signature ${settings.meter}` : null,
	].filter(Boolean);
	const q = `${known.length ? `The song's settings say: ${known.join(", ")}; use them to follow the bars. ` : ""}In which keys is this recording, and where does each begin? What time signature and tempo marks does the chart state?`;
	return `${q}\n\nThe chart, from the song:\n${chartText}`;
}

/** chartStatedAnswer, verbatim port (utils/chartStatedAnswer.ts at 95ed19aa). */
export function chartStatedAnswer<
	A extends { tempo: number | null; tempoChanges: unknown[]; meter: string | null },
>(answer: A, chartText: string | undefined): A {
	const text = chartText ?? "";
	const saysTempo = /\btempo \d|\b\d{2,3} ?bpm\b|[♩♪] ?= ?\d{2,3}/i.test(text);
	const saysMeter = /(^|\s)\d{1,2}\/\d{1,2}(?=\s|$|:)/m.test(text);
	return {
		...answer,
		tempo: saysTempo ? answer.tempo : null,
		tempoChanges: saysTempo ? answer.tempoChanges : [],
		meter: saysMeter ? answer.meter : null,
	};
}

/** Production's reply parsing (listen() shape, confidence gone). */
export function parseAnswer7(text: string): { answer: AiAnswer7 | null; error: string | null } {
	const json = text.match(/\{[\s\S]*\}/)?.[0];
	if (!json) return { answer: null, error: "The model did not answer in the expected form" };
	let parsed: v.SafeParseResult<typeof AnswerSchema7> | null = null;
	try {
		parsed = v.safeParse(AnswerSchema7, JSON.parse(json));
	} catch {
		parsed = null;
	}
	if (!parsed?.success) return { answer: null, error: "The model's answer did not make sense" };
	return { answer: parsed.output, error: null };
}
