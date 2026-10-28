/**
 * Runs Study 8 (docs/BRIEF-STUDY8.md): 15 metered items (12 original +
 * 3 contrast) × 3 arms × 2 models. Arms: S-blind (facts only), S-vocab
 * (facts + the registered vocabulary), S-chart (facts + vocabulary +
 * the marked lead-sheet summary). Registered deviations as in Studies
 * 4/7: temperature 0, maxOutputTokens 2000, maxRetries 4.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import mixes from "../corpus/mixes.json";
import {
	grade8,
	markedChart,
	parseSections,
	question8,
	sectionTruth,
	system8,
	type Grade8,
	type SectionsAnswer,
} from "../src/study8/sections.js";
import type { MixSpec } from "../src/study4/synth4.js";

const MODELS = ["google/gemini-3-flash", "google/gemini-3.5-flash"];
const ARMS = ["S-blind", "S-vocab", "S-chart"] as const;
type Arm8 = (typeof ARMS)[number];
/** The registered vocabulary (the band's names; covers every truth name). */
const VOCABULARY = ["Intro", "Verse", "Chorus", "Bridge", "Interlude", "Outro"];

const apiKey =
	process.env.AI_GATEWAY_API_KEY ??
	readFileSync(new URL("../.env.local", import.meta.url), "utf8")
		.split("\n")
		.find((l) => l.startsWith("AI_GATEWAY_API_KEY="))
		?.slice("AI_GATEWAY_API_KEY=".length)
		.trim()
		.replace(/^"|"$/g, "");
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");

const specs = (mixes.mixes as MixSpec[]).filter((m) => !m.pulseless);
const root = new URL("../", import.meta.url).pathname;

interface Cell8 {
	itemId: string;
	arm: Arm8;
	model: string;
	outcome: "answered" | "parse-error" | "api-error";
	error: string | null;
	answer: SectionsAnswer | null;
	grade: Grade8 | null;
	tokensIn: number;
	tokensOut: number;
	latencyMs: number;
}

async function runCell(spec: MixSpec, arm: Arm8, model: string): Promise<Cell8> {
	const gateway = createGateway({ apiKey: apiKey ?? "" });
	const started = performance.now();
	const truth = sectionTruth(spec);
	const chart = arm === "S-chart" ? markedChart(spec) : null;
	const context = {
		tempo: String(spec.sections[0]!.bpm),
		meter: spec.meter,
		vocabulary: arm === "S-blind" ? [] : VOCABULARY,
	};
	const base = { itemId: spec.id, arm, model, answer: null, grade: null, tokensIn: 0, tokensOut: 0 };
	let text = "";
	let tokensIn = 0;
	let tokensOut = 0;
	try {
		const result = await generateText({
			model: gateway(model),
			system: system8(chart !== null),
			messages: [
				{
					role: "user",
					content: [
						{
							type: "file",
							data: readFileSync(`${root}corpus/mixes/${spec.id}.mp3`),
							mediaType: "audio/mpeg",
							filename: "mix.mp3",
						},
						{ type: "text", text: question8(context, chart) },
					],
				},
			],
			temperature: 0,
			maxOutputTokens: 4000,
			maxRetries: 4,
		} as Parameters<typeof generateText>[0]);
		text = result.text;
		tokensIn = result.totalUsage.inputTokens ?? 0;
		tokensOut = result.totalUsage.outputTokens ?? 0;
	} catch (e) {
		return { ...base, outcome: "api-error", error: e instanceof Error ? e.message.slice(0, 300) : String(e), latencyMs: Math.round(performance.now() - started) };
	}
	const latencyMs = Math.round(performance.now() - started);
	const { answer, error } = parseSections(text);
	if (!answer) return { ...base, outcome: "parse-error", error, tokensIn, tokensOut, latencyMs };
	return { ...base, outcome: "answered", error: null, answer, grade: grade8(answer, truth), tokensIn, tokensOut, latencyMs };
}

for (const model of MODELS) {
	const slug = model.replace(/[/.]/g, "_");
	const file = new URL(`../results/study8-${slug}.json`, import.meta.url).pathname;
	const existing: Cell8[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
	const have = new Map(existing.filter((r) => r.outcome === "answered").map((r) => [`${r.itemId}|${r.arm}`, r]));
	const jobs: (() => Promise<Cell8>)[] = [];
	for (const spec of specs) {
		for (const arm of ARMS) {
			if (have.has(`${spec.id}|${arm}`)) continue;
			jobs.push(async () => {
				const r = await runCell(spec, arm, model);
				const g = r.grade;
				console.log(
					`${model} ${spec.id} ${arm}: ${r.outcome === "answered" && g ? `boundaries ${g.boundariesFound}/${g.boundariesTotal}, false ${g.falseBoundaries}, names ${g.namesCorrect}/${g.namesTotal}` : r.error}`,
				);
				return r;
			});
		}
	}
	console.log(`${model}: ${jobs.length} cells to run, ${have.size} kept`);
	let next = 0;
	const out: Cell8[] = [];
	await Promise.all(
		Array.from({ length: Math.min(2, jobs.length) }, async () => {
			while (next < jobs.length) {
				const i = next++;
				out.push(await jobs[i]!());
			}
		}),
	);
	const all = [...have.values(), ...out];
	writeFileSync(file, `${JSON.stringify(all, null, "\t")}\n`);
	console.log(`${model}: ${all.length} cells, ${all.reduce((a, r) => a + r.tokensIn, 0)} in / ${all.reduce((a, r) => a + r.tokensOut, 0)} out`);
}
