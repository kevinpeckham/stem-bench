/**
 * Runs Study 7 (docs/BRIEF-STUDY7.md), single phase: 12 metered items ×
 * 4 arms × 2 models. Score arms use fixture5's truth summaries as the
 * chart; chord arms use the committed band-chart generator. Idempotent.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import fixture4 from "../corpus/fixture4.json";
import fixture5 from "../corpus/fixture5.json";
import mixes from "../corpus/mixes.json";
import { chordChart } from "../src/study7/chordChart.js";
import { ARMS7, runCell7, type Cell7Record } from "../src/study7/runner7.js";
import type { FixtureMix } from "../src/study4/runner4.js";
import type { MixSpec } from "../src/study4/synth4.js";

const MODELS = ["google/gemini-3-flash", "google/gemini-3.5-flash"];

const apiKey =
	process.env.AI_GATEWAY_API_KEY ??
	readFileSync(new URL("../.env.local", import.meta.url), "utf8")
		.split("\n")
		.find((l) => l.startsWith("AI_GATEWAY_API_KEY="))
		?.slice("AI_GATEWAY_API_KEY=".length)
		.trim()
		.replace(/^"|"$/g, "");
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");

const items = (fixture4.items as FixtureMix[]).filter((i) => !i.pulseless);
const summaries = new Map(
	(fixture5.items as { id: string; truthSummary: string }[]).map((i) => [i.id, i.truthSummary]),
);
const specs = new Map((mixes.mixes as MixSpec[]).map((m) => [m.id, m]));

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
	const file = new URL(`../results/study7-${slug}.json`, import.meta.url).pathname;
	const existing: Cell7Record[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
	const have = new Map(
		existing.filter((r) => r.outcome === "answered").map((r) => [`${r.itemId}|${r.arm}`, r]),
	);
	const jobs: (() => Promise<Cell7Record>)[] = [];
	for (const item of items) {
		for (const arm of ARMS7) {
			if (have.has(`${item.id}|${arm}`)) continue;
			const chart =
				arm === "R-chord" || arm === "R-chord-wrong"
					? chordChart(specs.get(item.id)!)
					: summaries.get(item.id)!;
			jobs.push(async () => {
				const r = await runCell7(item, arm, chart, model, apiKey);
				const g = r.grade;
				console.log(
					`${model} ${item.id} ${arm}: ${r.outcome === "answered" && g ? `raw t${g.rawTempoCorrect ? "+" : "-"}m${g.rawMeterCorrect ? "+" : "-"}k${g.rawKeyCorrect ? "+" : "-"} applied t${g.appliedTempoCorrect ? "+" : "-"}m${g.appliedMeterCorrect ? "+" : "-"}${g.echoedWrongTempo ? " ECHO-T" : ""}${g.echoedWrongMeter ? " ECHO-M" : ""}${g.rawInventedTempo ? " INVENTED" : ""}` : r.error}`,
				);
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
	console.log(`${model}: ${all.length} cells, ${tin} in / ${tout} out`);
}
