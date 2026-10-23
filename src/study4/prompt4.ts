/**
 * Production's song-check call, ported verbatim (stem-shovel
 * src/lib/server/aiDetect.ts `askAiAboutMix` at v0.143.0, pinned by
 * tests/study4.test.ts): the listening system prompt, the chart note and
 * its keys-from-chart sentence, the candidates/no-candidates question
 * branches, and the AnswerSchema the reply must parse against.
 */
import * as v from "valibot";

const Bpm = v.pipe(v.number(), v.minValue(20), v.maxValue(400));
const Key = v.pipe(v.string(), v.trim(), v.maxLength(20));
export const AnswerSchema = v.object({
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
	confidence: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	notes: v.optional(v.pipe(v.string(), v.maxLength(400)), ""),
});
export type AiAnswer = v.InferOutput<typeof AnswerSchema>;

/** Production's CHART_NOTE, with chart.text present and no file (the bench sends the summary text only). */
const CHART_NOTE =
	"The song's own chart comes with the recording, as a measure-by-measure summary (key signatures, time signatures, tempo marks, repeats, rehearsal marks and chord symbols). First make sure it is the chart of this recording (the same piece: its harmony, meter and form match what you hear); if it plainly is not, set it aside, answer from the recording alone and say so in \"notes\".";

export function system4(withChart: boolean): string {
	return `You are a musician with perfect time and pitch. Listen to the whole recording and report:
- "tempo": the beats per minute at the start, precise to the beat (not rounded to a multiple of 5 unless it truly is). If the piece has no fixed pulse (rubato, free time, ambient), answer null — that is a valid and common answer; do not invent a number.
- "tempoChanges": any discrete tempo shifts after the start, as a list of {"at": seconds from the start, "bpm": the new tempo}, in order. Gradual drift or a rallentando at the very end is not a shift; a new section at a clearly different tempo is. Empty list when the tempo holds.
- "meter": the time signature (like 4/4, 3/4, 6/8, 7/8, or "free" if there is no meter).
- "key": the key at the start, like "D major" or "B minor"; "atonal" if there is none.
- "keyChanges": where the song moves to another key after the start, as a list of {"at": seconds from the start, "key": the new key}, in order. A passing chord or a borrowed chord is not a key change; a section that settles in a new key is, and so is a modulation up a step for the last chorus. Empty list when the song stays in one key.
- "confidence": 0 to 1 for the whole answer.
- "notes": one short sentence on anything uncertain, such as a half/double-time ambiguity or a modulation.
Reply with JSON only, no prose, exactly: {"tempo": 128, "tempoChanges": [{"at": 95.5, "bpm": 140}], "meter": "4/4", "key": "D major", "keyChanges": [{"at": 62, "key": "F major"}], "confidence": 0.8, "notes": "..."}${
		withChart
			? `
${CHART_NOTE} Take the keys from the chart: its key signatures and the chords it moves through say what key each part is in, more surely than the ear does. Use the recording to place each key change in seconds: follow the chart's bars at the tempo you hear, counting repeats as played. If the recording and the chart disagree (a different key, a cut section), say so in "notes" and answer for the recording.`
			: ""
	}`;
}

export interface Candidates4 {
	tempo: string | null;
	key: string | null;
	meter: string | null;
}

export function question4(candidates: Candidates4 | null, chart: { filename: string; text: string } | null): string {
	const known = candidates
		? [
				candidates.tempo ? `tempo ${candidates.tempo} bpm` : null,
				candidates.key ? `key ${candidates.key}` : null,
				candidates.meter ? `time signature ${candidates.meter}` : null,
			].filter(Boolean)
		: [];
	const question = known.length
		? `A detector estimated: ${known.join(", ")}. Confirm or correct each from what you hear; it cannot tell a free tempo or a tempo shift from a steady one, so check those yourself.`
		: "What are the tempo (or none), any tempo shifts, the time signature, the key and any key changes?";
	return chart ? `${question}\n\nThe chart, from ${chart.filename}:\n${chart.text}` : question;
}

/** Production's reply parsing (listen() in aiDetect.ts): first JSON object, the schema, the exact error strings. */
export function parseAnswer(text: string): { answer: AiAnswer | null; error: string | null } {
	const json = text.match(/\{[\s\S]*\}/)?.[0];
	if (!json) return { answer: null, error: "The model did not answer in the expected form" };
	let parsed: v.SafeParseResult<typeof AnswerSchema> | null = null;
	try {
		parsed = v.safeParse(AnswerSchema, JSON.parse(json));
	} catch {
		parsed = null;
	}
	if (!parsed?.success) return { answer: null, error: "The model's answer did not make sense" };
	return { answer: parsed.output, error: null };
}
