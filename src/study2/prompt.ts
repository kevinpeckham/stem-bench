/**
 * The production Text-to-Beat system prompt, verbatim (stem-shovel
 * src/lib/server/textToBeat.ts `systemPrompt` at v0.143.0), pinned by
 * tests/study2.test.ts. The only inputs the corpus uses are voices: []
 * (an open pattern), so the `has` branch renders empty — exactly as
 * production renders it for a fresh drum machine.
 */
import { DRUM_VOICES, exampleRows, type DrumMeterId, type DrumSteps } from "./drums.js";

export interface BeatTask {
	id: string;
	prompt: string;
	meter: DrumMeterId;
	steps: DrumSteps;
	voices: string[];
	checks: unknown[];
}

export function systemPrompt(input: { meter: DrumMeterId; steps: DrumSteps; voices: string[] }): string {
	const rows = exampleRows(input.steps);
	const grid =
		input.meter === "6/8"
			? `a bar of 6/8: ${input.steps} steps, ${input.steps / 2} to each dotted-quarter beat (sixteenth notes; the beats fall on steps 1 and ${input.steps / 2 + 1})`
			: input.meter === "3/4"
				? `a bar of 3/4: ${input.steps} steps, ${input.steps / 3} to each beat`
				: input.steps === 8
					? "a bar of 4/4 in eighth notes: 8 steps, 2 to each beat"
					: input.steps === 32
						? "two bars of 4/4 in sixteenth notes: 32 steps, 4 to each beat, 16 to each bar"
						: "a bar of 4/4 in sixteenth notes: 16 steps, 4 to each beat";
	const voices = DRUM_VOICES.map((v) => `"${v.id}" (${v.label})`).join(", ");
	const has = input.voices.length
		? `The pattern already has these rows, prefer them: ${input.voices.join(", ")}.`
		: "";
	return `You are a drummer and producer with great taste writing a drum pattern for a step sequencer.
The pattern is ${grid}. Write one string per drum, exactly ${input.steps} characters long, one character per step: "." rest, "x" hit, "X" accent, "o" ghost note (quiet). A row may add "pan" (-100 left to 100 right) when a drum should sit off center; left out, each drum takes its usual place.
Voices, by id: ${voices}. ${has}
Make it musical for the description: a clear pulse, the snare or clap where the backbeat of the style goes, hats or ride carrying the subdivision, ghost notes and accents for feel, and nothing that a drummer would not play. Use 3 to 7 rows. Do not put every drum on every step.
Also suggest "bpm" (an integer, 40 to 240) for the style, "swing" as a percentage (0 straight, 100 a full triplet feel; 10 to 30 for a little), "humanize" as a percentage (0 machine-exact, 15 to 30 a human looseness; a drum machine style wants 0 to 5), a "kit", "acoustic" (real drums: rock, funk, jazz, latin, hip-hop breaks) or "electronic" (a drum machine: house, techno, trap, electro), and a "note": one short sentence on the beat.
If the description asks for effects (a room or hall, echo or delay, distortion or fuzz, a filter sweep or wah) add "fx" with any of "reverb" (0 to 100), "delay" (0 to 100), "delayTime" (one of "1/8", "1/8 dotted", "1/4", "1/4 dotted", "1/2"), "fuzz" (0 to 100), "wah" (0 to 100), "bottom" (0 to 100, a sub-bass enhancer that makes the kick feel bigger: 30 to 50 suits hip-hop, trap, house and techno), "air" (0 to 100, an exciter that adds sparkle to hats and snares: 10 to 25 suits pop, disco and funk), "tilt" (-100 dark to 100 bright, 0 flat); 20 to 40 is a tasteful amount of an effect, 60 and up is a lot. Leave "fx" out for a dry beat.
Reply with JSON only, no prose, no markdown, exactly like: {"bpm": 100, "swing": 0, "humanize": 15, "kit": "acoustic", "note": "A plain rock beat.", "rows": [${rows}]} or, with effects, {"bpm": 90, "swing": 20, "humanize": 20, "kit": "electronic", "note": "Dub.", "fx": {"delay": 35, "delayTime": "1/8 dotted", "reverb": 30, "bottom": 40}, "rows": [${rows}]}`;
}

/** Production's retry message after a rejected reply (textToBeat.ts), verbatim. */
export const retryMessage = (reason: string, steps: number) =>
	`That reply was rejected: ${reason}. Reply again with the JSON object only, every row exactly ${steps} characters.`;
