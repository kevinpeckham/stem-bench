/**
 * Study 3 analysis (docs/BRIEF-STUDY3.md): per model × arm on READABLE
 * items — per-class recall (exact and ±1), chord recall/precision, the
 * S3-H1 gate read (production model key recall ±1 ≥ 90%), the S3-H2
 * honesty gate on the probe, the S3-H3 PDF-vs-image paired read, and
 * cost anatomy.
 */
import { readdirSync, readFileSync } from "node:fs";
import fixture from "../corpus/fixture3.json";
import type { ElementClass } from "../src/grading/summary.js";
import type { Cell3Record, FixtureItem } from "../src/study3/runner.js";

const items = fixture.items as FixtureItem[];
const readable = items.filter((i) => !i.unreadable).map((i) => i.id);
const dir = new URL("../results/", import.meta.url).pathname;
const records: Cell3Record[] = readdirSync(dir)
	.filter((f) => f.startsWith("study3-") && f.endsWith(".json"))
	.flatMap((f) => JSON.parse(readFileSync(dir + f, "utf8")) as Cell3Record[]);
if (!records.length) throw new Error("no study3 results yet");
const models = [...new Set(records.map((r) => r.model))].sort();
const CLASSES: ElementClass[] = [
	"keys",
	"times",
	"tempos",
	"rehearsals",
	"words",
	"repeats",
	"endings",
	"specials",
];
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : "—");

for (const arm of ["D-pdf", "D-image"] as const) {
	console.log(`\n=== ${arm} (readable items) ===`);
	console.log(
		`model${"".padEnd(29)}\t${CLASSES.map((c) => c.slice(0, 6)).join("\t")}\tchords\tchord±1\tprec`,
	);
	for (const m of models) {
		const rs = records.filter(
			(r) => r.model === m && r.arm === arm && r.outcome === "answered" && readable.includes(r.itemId),
		);
		if (!rs.length) continue;
		const cls = CLASSES.map((c) => {
			const t = rs.reduce((a, r) => a + (r.classes?.[c].total ?? 0), 0);
			const e = rs.reduce((a, r) => a + (r.classes?.[c].exact ?? 0), 0);
			return pct(e, t);
		});
		const ct = rs.reduce((a, r) => a + (r.chords?.total ?? 0), 0);
		const ce = rs.reduce((a, r) => a + (r.chords?.exact ?? 0), 0);
		const cn = rs.reduce((a, r) => a + (r.chords?.near ?? 0), 0);
		const mc = rs.reduce((a, r) => a + (r.chords?.modelChords ?? 0), 0);
		const cp = rs.reduce((a, r) => a + (r.chords?.precise ?? 0), 0);
		console.log(`${m.padEnd(34)}\t${cls.join("\t")}\t${pct(ce, ct)}\t${pct(cn, ct)}\t${pct(cp, mc)}`);
	}
}

console.log("\nS3-H1 (gate): key recall within ±1 measure, readable items, D-pdf + D-image pooled:");
for (const m of models) {
	const rs = records.filter(
		(r) => r.model === m && r.outcome === "answered" && readable.includes(r.itemId),
	);
	const t = rs.reduce((a, r) => a + (r.classes?.keys.total ?? 0), 0);
	const n = rs.reduce((a, r) => a + (r.classes?.keys.near ?? 0), 0);
	console.log(`  ${m.padEnd(34)} ${n}/${t} (${pct(n, t)})`);
}

console.log("\nS3-H2 (gate): the unreadable probe (all arms):");
for (const m of models) {
	const rs = records.filter((r) => r.model === m && r.outcome === "answered" && !readable.includes(r.itemId));
	for (const r of rs) {
		console.log(
			`  ${m.padEnd(34)} ${r.arm}: declared unreadable ${r.honesty?.declaredUnreadable}, fabricated chord/key lines ${r.honesty?.fabricatedChordLines}`,
		);
	}
}

console.log("\nS3-H3: PDF vs image, paired per single-page readable item (chord exact recall):");
for (const m of models) {
	let pdf = 0;
	let img = 0;
	let n = 0;
	for (const item of items.filter((i) => !i.unreadable && i.pages === 1)) {
		const a = records.find((r) => r.model === m && r.itemId === item.id && r.arm === "D-pdf" && r.chords);
		const b = records.find((r) => r.model === m && r.itemId === item.id && r.arm === "D-image" && r.chords);
		if (!a?.chords || !b?.chords) continue;
		pdf += a.chords.exact / Math.max(1, a.chords.total);
		img += b.chords.exact / Math.max(1, b.chords.total);
		n++;
	}
	if (n) console.log(`  ${m.padEnd(34)} pdf ${((100 * pdf) / n).toFixed(1)}% vs image ${((100 * img) / n).toFixed(1)}% over ${n} items`);
}

console.log("\nMeasure counting (answered readable cells): model m-lines vs GT measures:");
for (const m of models) {
	const rs = records.filter(
		(r) => r.model === m && r.outcome === "answered" && readable.includes(r.itemId),
	);
	const drift = rs.map((r) => {
		const item = items.find((i) => i.id === r.itemId)!;
		return Math.abs(r.measureLines - item.measures);
	});
	const mean = drift.reduce((a, b) => a + b, 0) / Math.max(1, drift.length);
	console.log(`  ${m.padEnd(34)} mean |m-lines − measures| = ${mean.toFixed(1)}`);
}

console.log("\nCost anatomy:");
for (const m of models) {
	const rs = records.filter((r) => r.model === m);
	const tin = rs.reduce((a, r) => a + r.tokensIn, 0);
	const tout = rs.reduce((a, r) => a + r.tokensOut, 0);
	const lat = rs.reduce((a, r) => a + r.latencyMs, 0) / Math.max(1, rs.length);
	const errs = rs.filter((r) => r.outcome !== "answered").length;
	console.log(
		`  ${m.padEnd(34)} ${rs.length} cells, ${tin} in / ${tout} out, mean ${Math.round(lat)} ms, api-errors ${errs}`,
	);
}
