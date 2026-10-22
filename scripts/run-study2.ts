/**
 * Runs Study 2 cells (docs/BRIEF-STUDY2.md): every (task × arm) for the
 * pilot model (--pilot: the production model, kimi-k2.6) or the matrix
 * (--matrix), 3 in flight, to results/study2-<slug>.json. Idempotent per
 * model: valid and invalid cells are kept (an invalid reply is a result),
 * api-error cells are retried.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import beats from "../corpus/beats.json";
import type { BeatTask } from "../src/study2/prompt.js";
import { ARMS2, runBeatCell, type BeatCellRecord } from "../src/study2/runner.js";

const PILOT = ["moonshotai/kimi-k2.6"];
const MATRIX = [
	"anthropic/claude-fable-5-1",
	"anthropic/claude-haiku-4.5",
	"google/gemini-3.5-flash",
	"openai/gpt-oss-120b",
];

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
if (!models) throw new Error("usage: run-study2.ts --pilot | --matrix");

const tasks = beats.tasks as BeatTask[];

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
	const file = new URL(`../results/study2-${slug}.json`, import.meta.url).pathname;
	const existing: BeatCellRecord[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
	const have = new Map(
		existing.filter((r) => r.outcome !== "api-error").map((r) => [`${r.taskId}|${r.arm}`, r]),
	);
	const jobs: (() => Promise<BeatCellRecord>)[] = [];
	for (const task of tasks) {
		for (const arm of ARMS2) {
			if (have.has(`${task.id}|${arm}`)) continue;
			jobs.push(async () => {
				const r = await runBeatCell(task, arm, model, apiKey);
				console.log(
					`${model} ${task.id} ${arm}: ${r.outcome} checks ${r.checks.passed}/${r.checks.total} (${r.tokensOut} out, ${r.latencyMs} ms${r.retryRescued ? ", retry rescued" : ""})`,
				);
				return r;
			});
		}
	}
	console.log(`${model}: ${jobs.length} cells to run, ${have.size} kept`);
	const fresh = await pool(jobs, 3);
	const all = [...have.values(), ...fresh];
	writeFileSync(file, `${JSON.stringify(all, null, "\t")}\n`);
	const tin = all.reduce((a, r) => a + r.tokensIn, 0);
	const tout = all.reduce((a, r) => a + r.tokensOut, 0);
	console.log(`${model}: ${all.length} cells, ${tin} in / ${tout} out → ${file}`);
}
