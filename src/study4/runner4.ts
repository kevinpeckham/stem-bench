/**
 * Study 4 cell runner (docs/BRIEF-STUDY4.md, "Protocol"): production's
 * listen() call — the MP3 as a file part plus the question text, the
 * per-arm system prompt — with the registered deviations (temperature 0,
 * maxOutputTokens 2000, maxRetries 4 on transport; production sets
 * none). No answer retry: production's listen() has none.
 */
import { readFileSync } from "node:fs";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import { deference, gradeListen, type ListenGrade } from "../grading/listen.js";
import { parseAnswer, question4, system4, type AiAnswer, type Candidates4 } from "./prompt4.js";
import type { MixTruth } from "./synth4.js";

export type Arm4s = "L-blind" | "L-correct" | "L-wrong" | "L-chart";

export interface FixtureMix {
	id: string;
	title: string;
	pulseless: boolean;
	truth: MixTruth;
	mp3: string;
	chart: string | null;
	wrong: { tempo: string; key: string; meter: string };
}

export interface Cell4Record {
	itemId: string;
	arm: Arm4s;
	model: string;
	outcome: "answered" | "parse-error" | "api-error";
	error: string | null;
	answer: AiAnswer | null;
	grade: ListenGrade | null;
	defer: { tempo: boolean; key: boolean; meter: boolean } | null;
	notes: string;
	confidence: number | null;
	tokensIn: number;
	tokensOut: number;
	latencyMs: number;
}

const root = new URL("../../", import.meta.url).pathname;

function candidatesFor(item: FixtureMix, arm: Arm4s): Candidates4 | null {
	if (arm === "L-blind") return null;
	if (arm === "L-wrong") return item.wrong;
	// L-correct and L-chart carry the truth as the detector's estimate; a
	// pulseless item's detector has no tempo or meter to offer.
	return {
		tempo: item.truth.tempo === null ? null : String(item.truth.tempo),
		key: item.truth.key,
		meter: item.truth.meter === "free" ? null : item.truth.meter,
	};
}

export async function runCell4s(
	item: FixtureMix,
	arm: Arm4s,
	model: string,
	apiKey: string,
): Promise<Cell4Record> {
	const gateway = createGateway({ apiKey });
	const started = performance.now();
	const chart =
		arm === "L-chart" && item.chart
			? { filename: `${item.id}-lead-sheet.musicxml`, text: item.chart }
			: null;
	const base = {
		itemId: item.id,
		arm,
		model,
		answer: null,
		grade: null,
		defer: null,
		notes: "",
		confidence: null,
		tokensIn: 0,
		tokensOut: 0,
	};
	let text = "";
	let tokensIn = 0;
	let tokensOut = 0;
	try {
		const result = await generateText({
			model: gateway(model),
			system: system4(chart !== null),
			messages: [
				{
					role: "user",
					content: [
						{
							type: "file",
							data: readFileSync(root + item.mp3),
							mediaType: "audio/mpeg",
							filename: "mix.mp3",
						},
						{ type: "text", text: question4(candidatesFor(item, arm), chart) },
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
		return {
			...base,
			outcome: "api-error",
			error: e instanceof Error ? e.message.slice(0, 400) : String(e).slice(0, 400),
			latencyMs: Math.round(performance.now() - started),
		};
	}
	const latencyMs = Math.round(performance.now() - started);
	const { answer, error } = parseAnswer(text);
	if (!answer) {
		return { ...base, outcome: "parse-error", error, tokensIn, tokensOut, latencyMs };
	}
	return {
		...base,
		outcome: "answered",
		error: null,
		answer,
		grade: gradeListen(answer, item.truth),
		defer: arm === "L-wrong" ? deference(answer, item.wrong) : null,
		notes: answer.notes,
		confidence: answer.confidence,
		tokensIn,
		tokensOut,
		latencyMs,
	};
}
