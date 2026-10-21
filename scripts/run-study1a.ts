/**
 * Amendment 2 run (docs/BRIEF-STUDY1.md): the A-matcher2 arm — the
 * v0.142.0 matcher's hints, same songs, same protocol, all five Study 1
 * models — to results/study1a-<slug>.json. Idempotent like run-study1.ts.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import fixture from "../corpus/fixture.json";
import type { FixtureSong } from "../src/harness/prompt.js";
import { runCell, type CellRecord } from "../src/harness/runner.js";

const MODELS = [
	"anthropic/claude-fable-5-1",
	"anthropic/claude-haiku-4.5",
	"google/gemini-3.5-flash",
	"moonshotai/kimi-k2.6",
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

for (const model of MODELS) {
	const slug = model.replace(/[/.]/g, "_");
	const file = new URL(`../results/study1a-${slug}.json`, import.meta.url).pathname;
	const existing: CellRecord[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
	const have = new Map(
		existing.filter((r) => r.outcome === "answered").map((r) => [r.songId, r]),
	);
	const jobs = songs
		.filter((s) => !have.has(s.id))
		.map((song) => async () => {
			const record = await runCell(song, "A-matcher2", model, apiKey);
			const mark =
				record.outcome === "answered" && record.grade
					? `${record.grade.correct}/${record.grade.total}`
					: record.outcome;
			console.log(`${model} ${song.id}: ${mark}`);
			return record;
		});
	console.log(`${model}: ${jobs.length} cells to run, ${have.size} kept`);
	const fresh = await pool(jobs, 3);
	const all = [...have.values(), ...fresh];
	writeFileSync(file, `${JSON.stringify(all, null, "\t")}\n`);
}
