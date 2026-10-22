/**
 * Runs Study 3 cells (docs/BRIEF-STUDY3.md): --pilot (gemini-3.5-flash)
 * or --matrix (fable-5-1, haiku-4.5, opus-4.8), every item in the D-pdf
 * arm and single-page items (plus the probe) in D-image, 2 in flight, to
 * results/study3-<slug>.json. Idempotent: answered cells kept, api-error
 * retried.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import fixture from "../corpus/fixture3.json";
import { runCell3, type Arm3, type Cell3Record, type FixtureItem } from "../src/study3/runner.js";

const PILOT = ["google/gemini-3.5-flash"];
const MATRIX = ["anthropic/claude-fable-5-1", "anthropic/claude-haiku-4.5", "anthropic/claude-opus-4.8"];

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
if (!models) throw new Error("usage: run-study3.ts --pilot | --matrix");

const items = fixture.items as FixtureItem[];

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
	const file = new URL(`../results/study3-${slug}.json`, import.meta.url).pathname;
	const existing: Cell3Record[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
	const have = new Map(
		existing.filter((r) => r.outcome === "answered").map((r) => [`${r.itemId}|${r.arm}`, r]),
	);
	const jobs: (() => Promise<Cell3Record>)[] = [];
	for (const item of items) {
		const arms: Arm3[] = item.pages === 1 ? ["D-image", "D-pdf"] : ["D-pdf"];
		for (const arm of arms) {
			if (have.has(`${item.id}|${arm}`)) continue;
			jobs.push(async () => {
				const r = await runCell3(item, arm, model, apiKey);
				const mark =
					r.outcome === "answered"
						? `chords ${r.chords?.exact}/${r.chords?.total}, keys ${r.classes?.keys.exact}/${r.classes?.keys.total}, ${r.measureLines} m-lines`
						: r.error;
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
