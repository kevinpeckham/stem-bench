/**
 * Study 14 arm E (docs/BRIEF-STUDY14.md): the reconciler under the
 * PRODUCTION configuration — claude-fable-5-1 with adaptive thinking at
 * low effort (stem-shovel's shipped providerOptions at 5b2288f8),
 * through THEIR ported message builder and parser, on the Study 13
 * arm-1 data. Two calls; fence $2.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { RECONCILE_SYSTEM, fixesAndBreaks, gradeBars } from "../src/study13/grading13.js";
import { parseReconciledChords } from "../src/study14/parseReconciledChords.js";
import { reconcileChordsMessage } from "../src/study14/reconcileChordsMessage.js";

const root = new URL("../", import.meta.url).pathname;
const arm1 = JSON.parse(readFileSync(`${root}results/study13-arm1.json`, "utf8"));
const apiKey = readFileSync(`${root}.env.local`, "utf8").match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/)?.[1];
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY missing");
const gateway = createGateway({ apiKey });
const MODEL = "anthropic/claude-fable-5-1";

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
	const chart = (mmkkCharts.songs as { slug: string; bpm: number; meter: string }[]).find((c) => c.slug === song.slug)!;
	const notesOf = new Map(song.barNotes.map((b) => [b.bar, b.notes]));
	const prompt = reconcileChordsMessage({
		key: song.declaredKey,
		meter: chart.meter,
		tempo: String(chart.bpm),
		chords: song.perBar,
		bars: song.perBar.map((_, i) => ({ notes: notesOf.get(i + 1) ?? "" })),
	});
	const started = performance.now();
	let text = "";
	let tokensOut = 0;
	let apiError: string | null = null;
	try {
		const result = await generateText({
			model: gateway(MODEL),
			system: RECONCILE_SYSTEM,
			prompt,
			maxOutputTokens: 16000,
			maxRetries: 4,
			providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } },
		} as Parameters<typeof generateText>[0]);
		text = result.text;
		tokensOut = result.totalUsage.outputTokens ?? 0;
	} catch (e) {
		apiError = e instanceof Error ? e.message.slice(0, 300) : String(e);
	}
	const latencyMs = Math.round(performance.now() - started);
	const parsed = apiError ? { chords: null, error: apiError } : parseReconciledChords(text, song.perBar.length);
	const grade = parsed.chords ? gradeBars(parsed.chords, song.truth) : null;
	const delta = parsed.chords ? fixesAndBreaks(song.perBar, parsed.chords, song.truth) : null;
	cells.push({ slug: song.slug, gated: song.gated, model: MODEL, config: "thinking-adaptive-low (production)", outcome: parsed.chords ? "answered" : "failed", error: parsed.error ?? null, grade, delta, tokensOut, latencyMs });
	console.log(
		`${song.slug}: ${parsed.chords ? `${grade!.right}/${grade!.bars} (baseline ${song.grade.right}) — fixes ${delta!.fixes}, breaks ${delta!.breaks}` : `FAILED: ${parsed.error}`} [${tokensOut}out ${latencyMs}ms]`,
	);
}
writeFileSync(`${root}results/study14-arm-e.json`, `${JSON.stringify({ version: 1, cells }, null, "\t")}\n`);
console.log("\nstudy14-arm-e.json written");
