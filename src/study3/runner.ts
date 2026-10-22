/**
 * Study 3 cell runner (docs/BRIEF-STUDY3.md, "Protocol"): production's
 * `readChartWithAi` call (stem-shovel src/lib/server/aiDetect.ts at
 * v0.143.0) — the system prompt verbatim, the file or image plus
 * "Summarize this chart as instructed.", no retry (production has none
 * for this path; its empty-completion retry postdates the port and is a
 * draft-path change). Registered deviations: temperature 0 and
 * maxOutputTokens 8000 (production sets neither). Anthropic models carry
 * production's adaptive/low thinking.
 */
import { readFileSync } from "node:fs";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import {
	chordScore,
	classRecall,
	honesty,
	parseSummary,
	type ClassScore,
	type ElementClass,
} from "../grading/summary.js";

/** Production's chart-read system prompt, verbatim (aiDetect.ts readChartWithAi). */
export const SYSTEM_3 = `You read music notation. The attached file is a song's chart or score. Write it out as a plain-text summary, one line per measure that carries anything of note, in exactly this form and nothing else:

Title: <title>
Part: <the part you read, e.g. "Electric Guitar 1 (3 parts)">
m<number> key <key> <time signature> tempo <bpm> [<rehearsal mark>] "<words>" |: :| ending <n>: <chord symbols in order, separated by spaces>

Rules:
- Number the measures from 1 in order through the whole score (count every measure in every system, on every page; the small numbers at the start of a system are measure numbers, use them to keep count).
- "key": from the key signature, as "C major", "A♭ major", "F minor" (write ♭ and ♯). State it at measure 1 and again at every measure where the key signature changes (naturals canceling flats or sharps is a change). Prefer the major key for a signature unless the chords plainly sit in the relative minor. A text such as "Key: F Major" in the score confirms it.
- Write the time signature at measure 1 and where it changes; "tempo <bpm>" where a metronome mark appears.
- Rehearsal marks in square brackets ("[A Verse]"), other words in quotes ("Chorus", "rit."); lyrics are not words, leave them out.
- "|:" at a measure that opens a repeat, ":|" at one that closes it, "ending 1" where a first ending starts, and so on; "D.S.", "coda", "fine" as words.
- Chord symbols after a colon, in the order they occur in the measure, as written (Fmaj9, B♭maj7/F, Cm7, N.C.). A measure with no chord symbol and no mark is left out.
- Do not invent anything the score does not show; if a page is unreadable, say so on a final line beginning "Note:".`;

export type Arm3 = "D-image" | "D-pdf";

export interface FixtureItem {
	id: string;
	title: string;
	unreadable: boolean;
	measures: number;
	pages: number;
	summary: string;
	png: string[];
	pdf: string;
}

export interface Cell3Record {
	itemId: string;
	arm: Arm3;
	model: string;
	outcome: "answered" | "api-error";
	error: string | null;
	text: string;
	classes: Record<ElementClass, ClassScore> | null;
	chords: ReturnType<typeof chordScore> | null;
	honesty: ReturnType<typeof honesty> | null;
	measureLines: number;
	tokensIn: number;
	tokensOut: number;
	latencyMs: number;
}

const root = new URL("../../", import.meta.url).pathname;

export async function runCell3(
	item: FixtureItem,
	arm: Arm3,
	model: string,
	apiKey: string,
): Promise<Cell3Record> {
	const gateway = createGateway({ apiKey });
	const started = performance.now();
	const content: unknown[] =
		arm === "D-image"
			? [
					...item.png.map((p) => ({
						type: "image" as const,
						image: readFileSync(root + p),
						mediaType: "image/png",
					})),
					{ type: "text", text: "Summarize this chart as instructed." },
				]
			: [
					{
						type: "file" as const,
						data: readFileSync(root + item.pdf),
						mediaType: "application/pdf",
						filename: `${item.id}.pdf`,
					},
					{ type: "text", text: "Summarize this chart as instructed." },
				];
	let text = "";
	let tokensIn = 0;
	let tokensOut = 0;
	try {
		const result = await generateText({
			model: gateway(model),
			system: SYSTEM_3,
			messages: [{ role: "user", content }],
			temperature: 0,
			maxOutputTokens: 8000,
			maxRetries: 4,
			// Production's DRAFT_MODEL thinking settings; haiku rejects
			// "adaptive" (Study 1 Amendment 1), so only fable carries them —
			// registered up front this time.
			...(model.includes("fable")
				? { providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } } }
				: {}),
		} as Parameters<typeof generateText>[0]);
		text = result.text;
		tokensIn = result.totalUsage.inputTokens ?? 0;
		tokensOut = result.totalUsage.outputTokens ?? 0;
	} catch (e) {
		return {
			itemId: item.id,
			arm,
			model,
			outcome: "api-error",
			error: e instanceof Error ? e.message.slice(0, 400) : String(e).slice(0, 400),
			text: "",
			classes: null,
			chords: null,
			honesty: null,
			measureLines: 0,
			tokensIn: 0,
			tokensOut: 0,
			latencyMs: Math.round(performance.now() - started),
		};
	}
	const latencyMs = Math.round(performance.now() - started);
	const gt = parseSummary(item.summary);
	const parsed = parseSummary(text);
	const classes = Object.fromEntries(
		(
			["keys", "times", "tempos", "rehearsals", "words", "repeats", "endings", "specials"] as const
		).map((cls) => [cls, classRecall(gt, parsed, cls)]),
	) as Record<ElementClass, ClassScore>;
	return {
		itemId: item.id,
		arm,
		model,
		outcome: "answered",
		error: null,
		text: text.slice(0, 12_000),
		classes,
		chords: chordScore(gt, parsed),
		honesty: honesty(parsed),
		measureLines: parsed.measureLines,
		tokensIn,
		tokensOut,
		latencyMs,
	};
}
