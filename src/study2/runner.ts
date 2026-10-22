/**
 * Study 2 cell runner (docs/BRIEF-STUDY2.md, "Protocol"): one Text-to-Beat
 * request per (task, arm, model) over the gateway's OpenAI-style REST
 * endpoint — the endpoint production uses for this feature — with
 * production's retry-with-reason (one more go on a rejected reply).
 *
 * Arms differ ONLY in the reasoning field and the output budget:
 * - R-off: production verbatim — `reasoning: { effort: "none" }`,
 *   max_tokens 1500 (textToBeat.ts `complete`).
 * - R-default: the reasoning field omitted (the provider's default
 *   behavior), max_tokens 8000 — the registered deviation that gives a
 *   thinking model room to finish, so the arm measures reasoning, not
 *   budget exhaustion (Study 1 Amendment 1's lesson).
 * Neither arm sends temperature: production does not.
 */
import { runChecks, type BeatCheck } from "../grading/beatChecks.js";
import { retryMessage, systemPrompt, type BeatTask } from "./prompt.js";
import { validateBeatReply, type ValidBeat } from "./validate.js";

export type Arm2 = "R-off" | "R-default";
export const ARMS2: Arm2[] = ["R-off", "R-default"];
const GATEWAY = "https://ai-gateway.vercel.sh/v1/chat/completions";

interface Message {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface Attempt {
	latencyMs: number;
	tokensIn: number;
	tokensOut: number;
	error: string | null;
}

export interface BeatCellRecord {
	taskId: string;
	arm: Arm2;
	model: string;
	outcome: "valid" | "invalid" | "api-error";
	attempts: Attempt[];
	firstTryValid: boolean;
	retryRescued: boolean;
	beat: ValidBeat | null;
	checks: { passed: number; total: number; failures: string[] };
	tokensIn: number;
	tokensOut: number;
	latencyMs: number;
}

async function complete(
	key: string,
	model: string,
	messages: Message[],
	arm: Arm2,
): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
	const res = await fetch(GATEWAY, {
		method: "POST",
		headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
		body: JSON.stringify({
			model,
			messages,
			...(arm === "R-off" ? { reasoning: { effort: "none" } } : {}),
			max_tokens: arm === "R-off" ? 1500 : 8000,
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

export async function runBeatCell(
	task: BeatTask,
	arm: Arm2,
	model: string,
	apiKey: string,
): Promise<BeatCellRecord> {
	const messages: Message[] = [
		{ role: "system", content: systemPrompt(task) },
		{ role: "user", content: task.prompt },
	];
	const attempts: Attempt[] = [];
	let beat: ValidBeat | null = null;
	let firstTryValid = false;
	for (let attempt = 0; attempt < 2 && !beat; attempt++) {
		const started = performance.now();
		let text = "";
		let tokensIn = 0;
		let tokensOut = 0;
		try {
			({ text, tokensIn, tokensOut } = await complete(apiKey, model, messages, arm));
		} catch (e) {
			attempts.push({
				latencyMs: Math.round(performance.now() - started),
				tokensIn: 0,
				tokensOut: 0,
				error: `api: ${e instanceof Error ? e.message.slice(0, 300) : String(e)}`,
			});
			break;
		}
		const latencyMs = Math.round(performance.now() - started);
		try {
			beat = validateBeatReply(text, task.steps);
			attempts.push({ latencyMs, tokensIn, tokensOut, error: null });
			if (attempt === 0) firstTryValid = true;
		} catch (e) {
			const reason = e instanceof Error ? e.message : String(e);
			attempts.push({ latencyMs, tokensIn, tokensOut, error: reason });
			messages.push(
				{ role: "assistant", content: text },
				{ role: "user", content: retryMessage(reason, task.steps) },
			);
		}
	}
	const lastError = attempts[attempts.length - 1]?.error ?? null;
	return {
		taskId: task.id,
		arm,
		model,
		outcome: beat ? "valid" : lastError?.startsWith("api:") ? "api-error" : "invalid",
		attempts,
		firstTryValid,
		retryRescued: !!beat && !firstTryValid,
		beat,
		checks: runChecks(beat, task.checks as BeatCheck[]),
		tokensIn: attempts.reduce((a, x) => a + x.tokensIn, 0),
		tokensOut: attempts.reduce((a, x) => a + x.tokensOut, 0),
		latencyMs: attempts.reduce((a, x) => a + x.latencyMs, 0),
	};
}
