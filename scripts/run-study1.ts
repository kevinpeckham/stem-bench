/**
 * Runs Study 1 cells (docs/BRIEF-STUDY1.md): every (song × arm) for the
 * pilot model (--pilot) or the matrix models (--matrix), 3 cells in
 * flight, each model's records to results/study1-<slug>.json. Idempotent
 * per model: an existing answered cell is kept, errors are retried.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import fixture from "../corpus/fixture.json";
import { ARMS, type Arm, type FixtureSong } from "../src/harness/prompt.js";
import { runCell, type CellRecord } from "../src/harness/runner.js";

const PILOT = ["google/gemini-3.5-flash"];
const MATRIX = [
	"anthropic/claude-fable-5-1",
	"anthropic/claude-haiku-4.5",
	"moonshotai/kimi-k2.6",
	"openai/gpt-oss-120b",
];

const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");

function readEnvLocal(): string {
	const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
		.split("\n")
		.find((l) => l.startsWith("AI_GATEWAY_API_KEY="));
	return line?.slice("AI_GATEWAY_API_KEY=".length).trim().replace(/^"|"$/g, "") ?? "";
}

const mode = process.argv[2];
const models = mode === "--pilot" ? PILOT : mode === "--matrix" ? MATRIX : null;
if (!models) throw new Error("usage: run-study1.ts --pilot | --matrix");

const songs = fixture.songs as FixtureSong[];

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
	const file = new URL(`../results/study1-${slug}.json`, import.meta.url).pathname;
	const existing: CellRecord[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
	const have = new Map(existing.filter((r) => r.outcome === "answered").map((r) => [`${r.songId}|${r.arm}`, r]));
	const jobs: (() => Promise<CellRecord>)[] = [];
	for (const song of songs) {
		for (const arm of ARMS) {
			const key = `${song.id}|${arm}`;
			if (have.has(key)) continue;
			jobs.push(async () => {
				const record = await runCell(song, arm as Arm, model, apiKey);
				const mark = record.outcome === "answered" ? (record.grade ? `${record.grade.correct}/${record.grade.total}` : "?") : record.outcome;
				console.log(`${model} ${song.id} ${arm}: ${mark} (${record.tokensIn}in/${record.tokensOut}out ${record.latencyMs}ms)`);
				return record;
			});
		}
	}
	console.log(`${model}: ${jobs.length} cells to run, ${have.size} kept`);
	const fresh = await pool(jobs, 3);
	const all = [...have.values(), ...fresh];
	writeFileSync(file, `${JSON.stringify(all, null, "\t")}\n`);
	const tokensIn = all.reduce((a, r) => a + r.tokensIn, 0);
	const tokensOut = all.reduce((a, r) => a + r.tokensOut, 0);
	console.log(`${model}: ${all.length} cells, ${tokensIn} in / ${tokensOut} out → ${file}`);
}
