/**
 * The Study 1 cell runner (docs/BRIEF-STUDY1.md, "Protocol"): one call per
 * (song, arm, model) through the Vercel AI Gateway with production's
 * generateText shape — temperature 0 for reproducibility (the one
 * registered deviation from production, which leaves it default), max 8000
 * output tokens, and production's adaptive/low thinking for Anthropic
 * models. No retry on a malformed answer (production's chart draft has
 * none): a cell that does not parse scores zero bars, counted separately.
 */
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import { gradeChords, type CellGrade } from "../grading/chart.js";
import { question, system, type Arm, type FixtureSong } from "./prompt.js";

/** Production's ChartDraftAnswerSchema (stem-shovel src/lib/val/ChartDraftSchema.ts). */
export const ChartDraftAnswerSchema = v.object({
	chords: v.pipe(v.string(), v.trim(), v.maxLength(12_000)),
	sections: v.pipe(
		v.array(
			v.object({
				index: v.pipe(v.string(), v.trim(), v.maxLength(8)),
				name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40)),
				bar: v.pipe(v.number(), v.integer(), v.minValue(1)),
			}),
		),
		v.maxLength(64),
	),
	progressions: v.array(
		v.object({
			section: v.pipe(v.string(), v.trim(), v.maxLength(40)),
			chords: v.pipe(v.string(), v.trim(), v.maxLength(400)),
		}),
	),
	chart: v.pipe(v.string(), v.maxLength(20_000)),
	notes: v.optional(v.pipe(v.string(), v.maxLength(400)), ""),
});

export interface CellRecord {
	songId: string;
	arm: Arm;
	model: string;
	outcome: "answered" | "parse-error" | "api-error";
	error: string | null;
	chords: string;
	modelNotes: string;
	grade: CellGrade | null;
	tokensIn: number;
	tokensOut: number;
	latencyMs: number;
}

/** One chat completion over the gateway's OpenAI-style REST endpoint, reasoning off — production's kimi call shape (stem-shovel textToBeat.ts `complete`). */
async function restComplete(
	model: string,
	systemText: string,
	userText: string,
	apiKey: string,
): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
	const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
		method: "POST",
		headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
		body: JSON.stringify({
			model,
			messages: [
				{ role: "system", content: systemText },
				{ role: "user", content: userText },
			],
			reasoning: { effort: "none" },
			temperature: 0,
			max_tokens: 8000,
			stream: false,
		}),
	});
	const body = (await res.json().catch(() => null)) as {
		error?: { message?: string } | string;
		choices?: { message?: { content?: string | null } }[];
		usage?: { prompt_tokens?: number; completion_tokens?: number };
	} | null;
	if (!res.ok || !body) {
		const detail =
			typeof body?.error === "string" ? body.error : (body?.error?.message ?? res.statusText);
		throw new Error(`The gateway answered ${res.status}: ${detail}`);
	}
	return {
		text: body.choices?.[0]?.message?.content ?? "",
		tokensIn: body.usage?.prompt_tokens ?? 0,
		tokensOut: body.usage?.completion_tokens ?? 0,
	};
}

export async function runCell(
	song: FixtureSong,
	arm: Arm,
	model: string,
	apiKey: string,
): Promise<CellRecord> {
	const gateway = createGateway({ apiKey });
	const started = performance.now();
	const base = {
		songId: song.id,
		arm,
		model,
		chords: "",
		modelNotes: "",
		grade: null,
		tokensIn: 0,
		tokensOut: 0,
	};
	let text = "";
	let tokensIn = 0;
	let tokensOut = 0;
	try {
		if (model.startsWith("moonshotai/")) {
			// Amendment 1 (docs/BRIEF-STUDY1.md): kimi runs with production's own
			// kimi call shape — the gateway's REST endpoint, reasoning off
			// (stem-shovel textToBeat.ts) — after 62/64 cells spent the whole
			// output budget reasoning and produced no JSON.
			const rest = await restComplete(model, system(arm), question(song, arm), apiKey);
			text = rest.text;
			tokensIn = rest.tokensIn;
			tokensOut = rest.tokensOut;
		} else {
			const result = await generateText({
				model: gateway(model),
				system: system(arm),
				prompt: question(song, arm),
				temperature: 0,
				maxOutputTokens: 8000,
				maxRetries: 4,
				// Production's DRAFT_MODEL thinking settings; haiku rejects
				// "adaptive" outright (Amendment 1), so only fable carries them.
				...(model.includes("fable")
					? { providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } } }
					: {}),
			} as Parameters<typeof generateText>[0]);
			text = result.text;
			tokensIn = result.totalUsage.inputTokens ?? 0;
			tokensOut = result.totalUsage.outputTokens ?? 0;
		}
	} catch (e) {
		return {
			...base,
			outcome: "api-error",
			error: e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500),
			latencyMs: Math.round(performance.now() - started),
		};
	}
	const latencyMs = Math.round(performance.now() - started);
	const json = text.match(/\{[\s\S]*\}/)?.[0];
	let parsed: v.SafeParseResult<typeof ChartDraftAnswerSchema> | null = null;
	try {
		parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
	} catch {
		parsed = null;
	}
	if (!parsed?.success) {
		return {
			...base,
			outcome: "parse-error",
			error: json ? "answer did not match the schema" : "no JSON in the answer",
			chords: text.slice(0, 300),
			grade: gradeChords("", song.truth),
			tokensIn,
			tokensOut,
			latencyMs,
		};
	}
	return {
		...base,
		outcome: "answered",
		error: null,
		chords: parsed.output.chords,
		modelNotes: parsed.output.notes,
		grade: gradeChords(parsed.output.chords, song.truth),
		tokensIn,
		tokensOut,
		latencyMs,
	};
}
