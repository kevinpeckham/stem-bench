/**
 * Study 13 arm 2 (docs/BRIEF-STUDY13.md): the reconciler — one text-only
 * LLM pass over the detected chords, the key and the transcribed notes
 * per bar, graded mechanically against the chart transcription. Runs
 * only when arm 1's registered trigger fired (gated accuracy < 90 %).
 * Registered deviations as ever: temperature 0, maxOutputTokens 4000,
 * maxRetries 4. Models: the production chart-draft model and the cheap
 * contrast. ~$0.30 for the pilot; fence $3.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import mmkkCharts from "../corpus/mmkk-charts.json";
import {
	fixesAndBreaks,
	gradeBars,
	parseReconciled,
	RECONCILE_SYSTEM,
	reconcileQuestion,
} from "../src/study13/grading13.js";

const MODELS = ["anthropic/claude-fable-5-1", "google/gemini-3.5-flash"];
const root = new URL("../", import.meta.url).pathname;
const arm1 = JSON.parse(readFileSync(`${root}results/study13-arm1.json`, "utf8"));
const gated = (arm1.songs as { gated: boolean; grade: { right: number; bars: number } }[]).find((s) => s.gated)!;
if ((100 * gated.grade.right) / gated.grade.bars >= 90) {
	throw new Error("the registered trigger did not fire; arm 2 does not run");
}
const apiKey = readFileSync(`${root}.env.local`, "utf8").match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/)?.[1];
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY missing");
const gateway = createGateway({ apiKey });

const cells: unknown[] = [];
for (const song of arm1.songs as {
	slug: string;
	gated: boolean;
	declaredKey: string | null;
	perBar: string[];
	barNotes: { bar: number; notes: string }[];
	truth: string[][];
	grade: { right: number; bars: number };
}[]) {
	const chart = (mmkkCharts.songs as { slug: string; bpm: number; meter: string }[]).find(
		(c) => c.slug === song.slug,
	)!;
	const question = reconcileQuestion(
		song.declaredKey ?? "unknown",
		chart.meter,
		chart.bpm,
		song.perBar,
		song.barNotes,
	);
	for (const model of MODELS) {
		const started = performance.now();
		let text = "";
		let tokensIn = 0;
		let tokensOut = 0;
		let apiError: string | null = null;
		try {
			const result = await generateText({
				model: gateway(model),
				system: RECONCILE_SYSTEM,
				prompt: question,
				temperature: 0,
				maxOutputTokens: 4000,
				maxRetries: 4,
			} as Parameters<typeof generateText>[0]);
			text = result.text;
			tokensIn = result.totalUsage.inputTokens ?? 0;
			tokensOut = result.totalUsage.outputTokens ?? 0;
		} catch (e) {
			apiError = e instanceof Error ? e.message.slice(0, 300) : String(e);
		}
		const latencyMs = Math.round(performance.now() - started);
		const { chords, error } = apiError ? { chords: null, error: apiError } : parseReconciled(text, song.truth.length);
		const grade = chords ? gradeBars(chords, song.truth) : null;
		const delta = chords ? fixesAndBreaks(song.perBar, chords, song.truth) : null;
		cells.push({
			slug: song.slug,
			gated: song.gated,
			model,
			outcome: apiError ? "api-error" : chords ? "answered" : "parse-error",
			error,
			chords,
			grade,
			delta,
			tokensIn,
			tokensOut,
			latencyMs,
		});
		console.log(
			`${song.slug} ${model}: ${chords ? `${grade!.right}/${grade!.bars} (baseline ${song.grade.right}) — fixes ${delta!.fixes}, breaks ${delta!.breaks}, changed ${delta!.changed}` : `FAILED: ${error}`} [${tokensIn}in/${tokensOut}out]`,
		);
	}
}
writeFileSync(`${root}results/study13-arm2.json`, `${JSON.stringify({ version: 1, models: MODELS, cells }, null, "\t")}\n`);
console.log(`\nstudy13-arm2.json: ${cells.length} cells`);
