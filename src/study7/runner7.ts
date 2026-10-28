/**
 * Study 7 cell runner (docs/BRIEF-STUDY7.md): the redesigned production
 * call — MP3 file part + the new system/question — graded at two levels:
 * the RAW answer (did the model obey the chart-transcription
 * instructions) and the APPLIED answer (what `chartStatedAnswer` lets
 * through to the song's settings). Registered deviations as in Study 4:
 * temperature 0, maxOutputTokens 2000, maxRetries 4 (production sets
 * none).
 */
import { readFileSync } from "node:fs";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import { keyEqual } from "../grading/listen.js";
import type { FixtureMix } from "../study4/runner4.js";
import {
	chartStatedAnswer,
	parseAnswer7,
	question7,
	system7,
	type AiAnswer7,
} from "./prompt7.js";

export type Arm7 = "R-true" | "R-wrong" | "R-chord" | "R-chord-wrong";
export const ARMS7: Arm7[] = ["R-true", "R-wrong", "R-chord", "R-chord-wrong"];

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

export interface Grade7 {
	/** RAW: chart-transcription obedience. */
	rawTempoCorrect: boolean; // score arms: == truth ±3; chord arms: null
	rawMeterCorrect: boolean; // score arms: == truth; chord arms: "free"
	rawKeyCorrect: boolean;
	rawTempoChangesFound: number;
	rawTempoChangesTotal: number;
	rawKeyChangesFound: number;
	rawKeyChangesTotal: number;
	/** The model invented a tempo the chart does not state (chord arms only). */
	rawInventedTempo: boolean;
	/** The raw answer echoes the WRONG setting (wrong arms only). */
	echoedWrongTempo: boolean;
	echoedWrongMeter: boolean;
	/** APPLIED: what chartStatedAnswer lets through. */
	appliedTempoCorrect: boolean; // score arms: truth; chord arms: null (correct refusal)
	appliedMeterCorrect: boolean;
	appliedWrongTempo: boolean; // a wrong-setting value survived to application
	appliedWrongMeter: boolean;
}

export interface Cell7Record {
	itemId: string;
	arm: Arm7;
	model: string;
	outcome: "answered" | "parse-error" | "api-error";
	error: string | null;
	raw: AiAnswer7 | null;
	applied: { tempo: number | null; meter: string | null } | null;
	grade: Grade7 | null;
	notes: string;
	tokensIn: number;
	tokensOut: number;
	latencyMs: number;
}

export function grade7(
	raw: AiAnswer7,
	applied: { tempo: number | null; tempoChanges: unknown[]; meter: string | null },
	item: FixtureMix,
	arm: Arm7,
): Grade7 {
	const truth = item.truth;
	const chordArm = arm === "R-chord" || arm === "R-chord-wrong";
	const wrongArm = arm === "R-wrong" || arm === "R-chord-wrong";
	const wrongTempo = Number(item.wrong.tempo);
	const rawTempoCorrect = chordArm
		? raw.tempo === null
		: raw.tempo !== null && truth.tempo !== null && near(raw.tempo, truth.tempo, 3);
	const rawMeterCorrect = chordArm ? raw.meter === "free" : raw.meter === truth.meter;
	const rawKeyCorrect = keyEqual(raw.key, truth.key);
	let rawTempoChangesFound = 0;
	for (const c of truth.tempoChanges) {
		if (raw.tempoChanges.some((x) => near(x.at, c.at, 4) && near(x.bpm, c.bpm, 5)))
			rawTempoChangesFound++;
	}
	let rawKeyChangesFound = 0;
	for (const c of truth.keyChanges) {
		if (raw.keyChanges.some((x) => near(x.at, c.at, 4) && keyEqual(x.key, c.key)))
			rawKeyChangesFound++;
	}
	return {
		rawTempoCorrect,
		rawMeterCorrect,
		rawKeyCorrect,
		rawTempoChangesFound,
		rawTempoChangesTotal: chordArm ? 0 : truth.tempoChanges.length,
		rawKeyChangesFound,
		rawKeyChangesTotal: truth.keyChanges.length,
		rawInventedTempo: chordArm && raw.tempo !== null,
		echoedWrongTempo: wrongArm && raw.tempo !== null && near(raw.tempo, wrongTempo, 3),
		echoedWrongMeter: wrongArm && raw.meter === item.wrong.meter,
		appliedTempoCorrect: chordArm
			? applied.tempo === null
			: applied.tempo !== null && truth.tempo !== null && near(applied.tempo, truth.tempo, 3),
		appliedMeterCorrect: chordArm ? applied.meter === null : applied.meter === truth.meter,
		appliedWrongTempo: wrongArm && applied.tempo !== null && near(applied.tempo, wrongTempo, 3),
		appliedWrongMeter: wrongArm && applied.meter === item.wrong.meter,
	};
}

const root = new URL("../../", import.meta.url).pathname;

export async function runCell7(
	item: FixtureMix,
	arm: Arm7,
	chartText: string,
	model: string,
	apiKey: string,
): Promise<Cell7Record> {
	const gateway = createGateway({ apiKey });
	const started = performance.now();
	const chordArm = arm === "R-chord" || arm === "R-chord-wrong";
	const wrongArm = arm === "R-wrong" || arm === "R-chord-wrong";
	const settings = wrongArm
		? { tempo: item.wrong.tempo, meter: item.wrong.meter }
		: { tempo: item.truth.tempo === null ? null : String(item.truth.tempo), meter: item.truth.meter === "free" ? null : item.truth.meter };
	const base = { itemId: item.id, arm, model, raw: null, applied: null, grade: null, notes: "", tokensIn: 0, tokensOut: 0 };
	let text = "";
	let tokensIn = 0;
	let tokensOut = 0;
	try {
		const result = await generateText({
			model: gateway(model),
			system: system7(chordArm),
			messages: [
				{
					role: "user",
					content: [
						{ type: "file", data: readFileSync(root + item.mp3), mediaType: "audio/mpeg", filename: "mix.mp3" },
						{ type: "text", text: question7(settings, chartText) },
					],
				},
			],
			temperature: 0,
			maxOutputTokens: 2000,
			maxRetries: 4,
		} as Parameters<typeof generateText>[0]);
		text = result.text;
		tokensIn = result.totalUsage.inputTokens ?? 0;
		tokensOut = result.totalUsage.outputTokens ?? 0;
	} catch (e) {
		return { ...base, outcome: "api-error", error: e instanceof Error ? e.message.slice(0, 400) : String(e), latencyMs: Math.round(performance.now() - started) };
	}
	const latencyMs = Math.round(performance.now() - started);
	const { answer, error } = parseAnswer7(text);
	if (!answer) return { ...base, outcome: "parse-error", error, tokensIn, tokensOut, latencyMs };
	const appliedFull = chartStatedAnswer(answer, chartText);
	return {
		...base,
		outcome: "answered",
		error: null,
		raw: answer,
		applied: { tempo: appliedFull.tempo, meter: appliedFull.meter },
		grade: grade7(answer, appliedFull, item, arm),
		notes: answer.notes,
		tokensIn,
		tokensOut,
		latencyMs,
	};
}
