/**
 * Runs Study 4 cells (docs/BRIEF-STUDY4.md): --pilot (the production
 * model, gemini-3-flash) or --matrix (gemini-3.5-flash and the
 * registered availability probe gpt-4o-audio-preview). Metered items run
 * all four arms; pulseless items skip L-chart. 2 in flight, idempotent.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import fixture from "../corpus/fixture4.json";
import { runCell4s, type Arm4s, type Cell4Record, type FixtureMix } from "../src/study4/runner4.js";

const PILOT = ["google/gemini-3-flash"];
const MATRIX = ["google/gemini-3.5-flash", "openai/gpt-4o-audio-preview"];

const apiKey =
	process.env.AI_GATEWAY_API_KEY ??
	readFileSync(new URL("../.env.local", import.meta.url), "utf8")
		.split("\n")
		.find((l) => l.startsWith("AI_GATEWAY_API_KEY="))
		?.slice("AI_GATEWAY_API_KEY=".length)
		.trim()
		.replace(/^"|"$/g, "");
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");

const mode = process.argv[2];
const models = mode === "--pilot" ? PILOT : mode === "--matrix" ? MATRIX : null;
if (!models) throw new Error("usage: run-study4.ts --pilot | --matrix");

const items = fixture.items as FixtureMix[];

async function pool<T>(jobs: (() => Promise<T>)[], width: number): Promise<T[]> {
	const out: T[] = new Array(jobs.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(width, jobs.length) }, async () => {
			while (next < jobs.length) {
				const i = next++;
				out[i] = await jobs[i]!();
			}
		}),
	);
	return out;
}

for (const model of models) {
	const slug = model.replace(/[/.]/g, "_");
	const file = new URL(`../results/study4-${slug}.json`, import.meta.url).pathname;
	const existing: Cell4Record[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
	const have = new Map(
		existing.filter((r) => r.outcome !== "api-error").map((r) => [`${r.itemId}|${r.arm}`, r]),
	);
	const jobs: (() => Promise<Cell4Record>)[] = [];
	for (const item of items) {
		const arms: Arm4s[] = item.pulseless
			? ["L-blind", "L-correct", "L-wrong"]
			: ["L-blind", "L-correct", "L-wrong", "L-chart"];
		for (const arm of arms) {
			if (have.has(`${item.id}|${arm}`)) continue;
			jobs.push(async () => {
				const r = await runCell4s(item, arm, model, apiKey);
				const g = r.grade;
				const mark =
					r.outcome === "answered" && g
						? `tempo ${g.tempoCorrect ? "ok" : g.octaveError ? "OCTAVE" : "x"} meter ${g.meterCorrect ? "ok" : "x"} key ${g.keyCorrect ? "ok" : "x"}${g.inventedTempo ? " INVENTED" : ""}`
						: (r.error ?? r.outcome);
				console.log(`${model} ${item.id} ${arm}: ${mark}`);
				return r;
			});
		}
	}
	console.log(`${model}: ${jobs.length} cells to run, ${have.size} kept`);
	const fresh = await pool(jobs, 2);
	const all = [...have.values(), ...fresh];
	writeFileSync(file, `${JSON.stringify(all, null, "\t")}\n`);
	const tin = all.reduce((a, r) => a + r.tokensIn, 0);
	const tout = all.reduce((a, r) => a + r.tokensOut, 0);
	console.log(`${model}: ${all.length} cells, ${tin} in / ${tout} out → ${file}`);
}
