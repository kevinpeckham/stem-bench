/**
 * Runs Study 6b reads (docs/BRIEF-STUDY6B.md): the production reader
 * (anthropic/claude-fable-5-1) through Study 3's `runCell3` verbatim, D-pdf
 * arm, over each page in both conditions — clean (`<id>.pdf`) and
 * corrupted (`<id>-corrupt.pdf`). `--pilot` reads the 6 pilot items (12
 * reads), `--matrix` the other 18 (36 reads; Kevin's go-ahead after the
 * pilot's results are committed). Both conditions are sent under the same
 * filename (`<id>.pdf`), so nothing in the request names the condition.
 * Each record is graded against the condition's own truth (the corrupted
 * page's truth has its chord accidentals removed).
 *
 * Idempotent per cell (item × condition) into results/study6b-reader.json:
 * answered cells are kept, api-errors retried. The file is rewritten after
 * every cell, so a stop keeps what it has.
 *
 * Spend fence: estimated from token usage at claude-fable-5-1's list
 * price ($10 / $50 per million input / output tokens), summed over every
 * record in the file (pilot and matrix together). The run stops starting
 * cells once the spend plus one cell's reserve would pass $6, and
 * reports what it has.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import fixture from "../corpus/fixture6b.json";
import { runCell3, type FixtureItem } from "../src/study3/runner.js";
import type { Cell6bRecord, Condition6b } from "../src/study6b/corpus.js";

const MODEL = "anthropic/claude-fable-5-1";
const CAP_USD = 6;
const RESERVE_USD = 0.3; // a generous single read: Study 5's fable reads ran ≈ $0.10 a page
const PRICE_IN = 10 / 1e6;
const PRICE_OUT = 50 / 1e6;


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
if (mode !== "--pilot" && mode !== "--matrix") throw new Error("usage: run-study6b.ts --pilot | --matrix");

interface Item6b {
	id: string;
	title: string;
	group: string;
	pilot: boolean;
	measures: number;
	pages: number;
	summary: string;
	corruptSummary: string;
	pdf: string;
	pdfCorrupt: string;
}
const items = (fixture.items as Item6b[]).filter((i) => (mode === "--pilot" ? i.pilot : !i.pilot));

const file = new URL("../results/study6b-reader.json", import.meta.url).pathname;
const existing: Cell6bRecord[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
const records = new Map(existing.map((r) => [`${r.itemId}|${r.condition}`, r]));
const cost = (r: { tokensIn: number; tokensOut: number }) => r.tokensIn * PRICE_IN + r.tokensOut * PRICE_OUT;
const spent = () => [...records.values()].reduce((a, r) => a + cost(r), 0);
const save = () => writeFileSync(file, `${JSON.stringify([...records.values()], null, "\t")}\n`);

const jobs: { item: Item6b; condition: Condition6b }[] = [];
for (const item of items)
	for (const condition of ["clean", "corrupted"] as const) {
		if (records.get(`${item.id}|${condition}`)?.outcome === "answered") continue;
		jobs.push({ item, condition });
	}
console.log(`${MODEL} ${mode}: ${jobs.length} cells to run, spent so far ≈ $${spent().toFixed(2)} of $${CAP_USD}`);

let next = 0;
let capped = false;
async function worker() {
	while (next < jobs.length) {
		if (spent() + RESERVE_USD > CAP_USD) {
			capped = true;
			return;
		}
		const { item, condition } = jobs[next++]!;
		const page: FixtureItem = {
			id: item.id,
			title: item.title,
			unreadable: false,
			measures: item.measures,
			pages: item.pages,
			summary: condition === "clean" ? item.summary : item.corruptSummary,
			png: [],
			pdf: condition === "clean" ? item.pdf : item.pdfCorrupt,
		};
		const r = await runCell3(page, "D-pdf", MODEL, apiKey!);
		records.set(`${item.id}|${condition}`, { ...r, condition, group: item.group, pilot: item.pilot });
		save();
		console.log(
			`${item.id} ${condition}: ${r.outcome === "answered" ? `chords ${r.chords?.exact}/${r.chords?.total}, keys ${r.classes?.keys.exact}/${r.classes?.keys.total}, ${r.measureLines} m-lines` : r.error} — ≈ $${cost(r).toFixed(3)}, total ≈ $${spent().toFixed(2)}`,
		);
	}
}
await Promise.all([worker(), worker()]);
save();
const all = [...records.values()];
console.log(
	`${all.length} cells in ${file}; ${all.reduce((a, r) => a + r.tokensIn, 0)} in / ${all.reduce((a, r) => a + r.tokensOut, 0)} out ≈ $${spent().toFixed(2)}`,
);
if (capped) console.log(`STOPPED at the spend fence ($${CAP_USD}): ${jobs.length - next} cell(s) not run.`);
