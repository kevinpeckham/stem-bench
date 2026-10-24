/**
 * Runs Study 5 (docs/BRIEF-STUDY5.md), single phase: first the READER
 * cells — production's chart-read (fable-5-1) over each lead sheet as
 * PNG and as PDF, Study 3's runner verbatim — then the LISTENER cells —
 * production's song-check (gemini-3-flash) in the chart arm with the
 * READER'S OUTPUT as the chart text, Study 4's runner with the item's
 * chart swapped. The truth-summary ceiling is Study 4's frozen L-chart
 * cells; they are not re-run. Idempotent per file.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import fixture from "../corpus/fixture5.json";
import { runCell3, type Cell3Record } from "../src/study3/runner.js";
import { runCell4s, type Cell4Record, type FixtureMix } from "../src/study4/runner4.js";

const READER_MODEL = "anthropic/claude-fable-5-1";
const LISTENER_MODEL = "google/gemini-3-flash";

const apiKey =
	process.env.AI_GATEWAY_API_KEY ??
	readFileSync(new URL("../.env.local", import.meta.url), "utf8")
		.split("\n")
		.find((l) => l.startsWith("AI_GATEWAY_API_KEY="))
		?.slice("AI_GATEWAY_API_KEY=".length)
		.trim()
		.replace(/^"|"$/g, "");
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");

interface Item5 {
	id: string;
	title: string;
	truth: FixtureMix["truth"];
	measures: number;
	truthSummary: string;
	png: string[];
	pdf: string;
	pages: number;
}
const items = fixture.items as Item5[];
const mixes = JSON.parse(
	readFileSync(new URL("../corpus/fixture4.json", import.meta.url), "utf8"),
).items as FixtureMix[];

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

// Phase A: the reader.
const readerFile = new URL("../results/study5-reader.json", import.meta.url).pathname;
let readerRecords: Cell3Record[] = existsSync(readerFile)
	? JSON.parse(readFileSync(readerFile, "utf8"))
	: [];
{
	const have = new Map(
		readerRecords.filter((r) => r.outcome === "answered").map((r) => [`${r.itemId}|${r.arm}`, r]),
	);
	const jobs: (() => Promise<Cell3Record>)[] = [];
	for (const item of items) {
		for (const arm of ["D-image", "D-pdf"] as const) {
			if (have.has(`${item.id}|${arm}`)) continue;
			jobs.push(async () => {
				const r = await runCell3(
					{
						id: item.id,
						title: item.title,
						unreadable: false,
						measures: item.measures,
						pages: item.pages,
						summary: item.truthSummary,
						png: item.png,
						pdf: item.pdf,
					},
					arm,
					READER_MODEL,
					apiKey,
				);
				console.log(
					`reader ${item.id} ${arm}: ${r.outcome === "answered" ? `chords ${r.chords?.exact}/${r.chords?.total}, keys ${r.classes?.keys.exact}/${r.classes?.keys.total}` : r.error}`,
				);
				return r;
			});
		}
	}
	console.log(`reader: ${jobs.length} cells to run, ${have.size} kept`);
	const fresh = await pool(jobs, 2);
	readerRecords = [...have.values(), ...fresh];
	writeFileSync(readerFile, `${JSON.stringify(readerRecords, null, "\t")}\n`);
}

// Phase B: the listener, fed the reader's text.
const listenerFile = new URL("../results/study5-listener.json", import.meta.url).pathname;
const existing: Cell4Record[] = existsSync(listenerFile)
	? JSON.parse(readFileSync(listenerFile, "utf8"))
	: [];
{
	const have = new Map(
		existing.filter((r) => r.outcome === "answered").map((r) => [`${r.itemId}|${r.arm}`, r]),
	);
	const jobs: (() => Promise<Cell4Record>)[] = [];
	for (const item of items) {
		const mix = mixes.find((m) => m.id === item.id);
		if (!mix) throw new Error(`no mix for ${item.id}`);
		for (const [arm, readerArm] of [
			["C5-png", "D-image"],
			["C5-pdf", "D-pdf"],
		] as const) {
			if (have.has(`${item.id}|${arm}`)) continue;
			const reader = readerRecords.find(
				(r) => r.itemId === item.id && r.arm === readerArm && r.outcome === "answered",
			);
			if (!reader) {
				console.log(`listener ${item.id} ${arm}: SKIPPED (no reader output)`);
				continue;
			}
			jobs.push(async () => {
				const r = await runCell4s(
					{ ...mix, chart: reader.text },
					"L-chart",
					LISTENER_MODEL,
					apiKey,
				);
				const rec = { ...r, arm: arm as never };
				const g = r.grade;
				console.log(
					`listener ${item.id} ${arm}: ${r.outcome === "answered" && g ? `tempo ${g.tempoCorrect ? "ok" : "x"} meter ${g.meterCorrect ? "ok" : "x"} key ${g.keyCorrect ? "ok" : "x"} tΔ ${g.tempoChangesFound}/${g.tempoChangesTotal} kΔ ${g.keyChangesFound}/${g.keyChangesTotal}` : r.error}`,
				);
				return rec;
			});
		}
	}
	console.log(`listener: ${jobs.length} cells to run, ${have.size} kept`);
	const fresh = await pool(jobs, 2);
	const all = [...have.values(), ...fresh];
	writeFileSync(listenerFile, `${JSON.stringify(all, null, "\t")}\n`);
}
console.log("study 5 run complete");
