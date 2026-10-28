/**
 * Study 6b analysis (docs/BRIEF-STUDY6B.md). Two parts:
 *
 * 1. The reproduction check (no reads, zero spend): H-scoped and H-prod
 *    over Study 6's saved reader texts, collected and labeled exactly as
 *    scripts/run-study6.ts does (the archived corrupted Study 3 D-pdf and
 *    Study 5 reader records, the current clean ones, every D-image cell as
 *    clean). H-scoped must reproduce 10/10, 0/12, 1/42 on the production
 *    reader or the port is wrong and the study stops (exit 1). H-prod's
 *    numbers are context, not evidence.
 * 2. The registered measures over results/study6b-reader.json, when it
 *    exists: per instrument the hit rate on detectable corrupted reads,
 *    the silence rate on undetectable corrupted reads, the clean
 *    false-positive rate in all and per group with each flag's anatomy,
 *    the reads H-scoped flags and H-prod does not (labeled hit lost or
 *    false alarm avoided), floor effects counted apart, and gates G1
 *    (H-prod flags ≤ 1 of the 24 clean reads) and G2 (H-prod catches ≥ 7
 *    of the 8 detectable corrupted reads: 8 accidentals items × one
 *    corrupted read, as the registered brief counts).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import scores3 from "../corpus/scores.json";
import mixes from "../corpus/mixes.json";
import scores6b from "../corpus/scores6b.json";
import fixture6b from "../corpus/fixture6b.json";
import { chartReadWarningsProd, chartReadWarningsScoped, DROP_FLAG, lineChords } from "../src/study6b/warnings.js";
import { alteredLetters as scopedLetters, keySignatureSharps } from "../src/study6/warnings.js";
import {
	fifthsLabel,
	suspiciousChords,
	truthKeyByMeasure,
	type Cell6bRecord,
	type RawScore6b,
} from "../src/study6b/corpus.js";

const ROOT = new URL("../", import.meta.url).pathname;
type Instrument = { name: string; fn: (s: string) => string[] };
const H_SCOPED: Instrument = { name: "H-scoped", fn: chartReadWarningsScoped };
const H_PROD: Instrument = { name: "H-prod", fn: chartReadWarningsProd };
const fires = (h: Instrument, text: string) => h.fn(text).some((w) => DROP_FLAG.test(w));

// ─────────────────────────────── 1. Reproduction check (Study 6's corpus, as run-study6.ts builds it)
interface ItemTruth {
	maxAccidentals: number;
	alteredRootChords: number;
}
const FIFTHS: Record<string, number> = {
	"C major": 0, "G major": 1, "D major": 2, "A major": 3, "E major": 4, "B major": 5,
	"F major": -1, "Bb major": -2, "Eb major": -3, "Ab major": -4,
	"A minor": 0, "E minor": 1, "B minor": 2, "F# minor": 3, "C# minor": 4,
	"D minor": -1, "G minor": -2, "C minor": -3, "F minor": -4,
};
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];
function truthOfChords(keys: number[], chords: string[]): ItemTruth {
	const maxSharps = Math.max(0, ...keys.map((k) => k));
	const maxFlats = Math.max(0, ...keys.map((k) => -k));
	const letters = new Set<string>([...SHARP_ORDER.slice(0, maxSharps), ...FLAT_ORDER.slice(0, maxFlats)]);
	const altered = chords.filter((c) => /^[A-G][b#]/.test(c) && letters.has(c.charAt(0))).length;
	return { maxAccidentals: Math.max(maxSharps, maxFlats), alteredRootChords: altered };
}
const truths6 = new Map<string, ItemTruth>();
for (const s of scores3.scores as { id: string; measures: { key?: [number, string]; chords: string[] }[] }[]) {
	const keys = s.measures.filter((m) => m.key).map((m) => m.key![0]);
	truths6.set(s.id, truthOfChords(keys, s.measures.flatMap((m) => m.chords)));
}
for (const m of mixes.mixes as { id: string; sections: { key: string; bars: string[] }[] }[]) {
	const keys = m.sections.map((s) => FIFTHS[s.key] ?? 0);
	truths6.set(m.id, truthOfChords(keys, m.sections.flatMap((s) => s.bars)));
}
interface Sample6 {
	item: string;
	model: string;
	condition: "corrupted" | "clean";
	text: string;
}
const samples6: Sample6[] = [];
const push6 = (item: string, model: string, condition: Sample6["condition"], text: string) => {
	if (text && item !== "smudge") samples6.push({ item, model, condition, text });
};
const arch3 = `${ROOT}results/archive/study3-dpdf-accidentals-confounded`;
for (const f of readdirSync(arch3))
	for (const r of JSON.parse(readFileSync(`${arch3}/${f}`, "utf8")))
		if (r.outcome === "answered") push6(r.itemId, r.model, "corrupted", r.text);
for (const f of readdirSync(`${ROOT}results`).filter((x) => x.startsWith("study3-") && x.endsWith(".json")))
	for (const r of JSON.parse(readFileSync(`${ROOT}results/${f}`, "utf8")))
		if (r.outcome === "answered") push6(r.itemId, r.model, "clean", r.text);
for (const r of JSON.parse(readFileSync(`${ROOT}results/archive/study5-pdf-accidentals/reader-dpdf.json`, "utf8")))
	if (r.outcome === "answered") push6(r.itemId, "anthropic/claude-fable-5-1", "corrupted", r.text);
if (existsSync(`${ROOT}results/study5-reader.json`))
	for (const r of JSON.parse(readFileSync(`${ROOT}results/study5-reader.json`, "utf8")))
		if (r.outcome === "answered") push6(r.itemId, "anthropic/claude-fable-5-1", "clean", r.text);

function evaluate6(h: Instrument, modelFilter?: (m: string) => boolean) {
	let detHit = 0, detTotal = 0, undetFired = 0, undetTotal = 0, cleanFired = 0, cleanTotal = 0;
	const fp: string[] = [];
	const misses: string[] = [];
	for (const s of samples6) {
		if (modelFilter && !modelFilter(s.model)) continue;
		const fired = fires(h, s.text);
		const t = truths6.get(s.item)!;
		const tag = `${s.item}(${s.model.split("/")[1]})`;
		if (s.condition === "corrupted") {
			if (t.maxAccidentals >= 2 && t.alteredRootChords >= 2) {
				detTotal++;
				if (fired) detHit++;
				else misses.push(tag);
			} else {
				undetTotal++;
				if (fired) undetFired++;
			}
		} else {
			cleanTotal++;
			if (fired) {
				cleanFired++;
				fp.push(tag);
			}
		}
	}
	return { detHit, detTotal, undetFired, undetTotal, cleanFired, cleanTotal, fp, misses };
}
const line6 = (name: string, r: ReturnType<typeof evaluate6>) =>
	`  ${name.padEnd(9)} detectable corrupted ${r.detHit}/${r.detTotal} fired${r.misses.length ? ` (missed: ${r.misses.join(", ")})` : ""}; undetectable corrupted ${r.undetFired}/${r.undetTotal} fired; clean ${r.cleanFired}/${r.cleanTotal} FALSE POSITIVES${r.fp.length ? ` — ${r.fp.join(", ")}` : ""}`;

const fable = (m: string) => m.includes("fable");
const scopedFable = evaluate6(H_SCOPED, fable);
const prodFable = evaluate6(H_PROD, fable);
console.log(
	`Study 6b — reproduction check over Study 6's ${samples6.length} saved reader texts (${samples6.filter((s) => s.condition === "corrupted").length} corrupted, ${samples6.filter((s) => s.condition === "clean").length} clean). No reads.`,
);
console.log("\nProduction reader (fable):");
console.log(line6("H-scoped", scopedFable));
console.log(line6("H-prod", prodFable));
console.log("\nAll models (context):");
console.log(line6("H-scoped", evaluate6(H_SCOPED)));
console.log(line6("H-prod", evaluate6(H_PROD)));
const reproduced =
	samples6.length === 148 &&
	scopedFable.detHit === 10 && scopedFable.detTotal === 10 &&
	scopedFable.undetFired === 0 && scopedFable.undetTotal === 12 &&
	scopedFable.cleanFired === 1 && scopedFable.cleanTotal === 42;
console.log(
	`\nReproduction: H-scoped on the production reader ${scopedFable.detHit}/${scopedFable.detTotal}, ${scopedFable.undetFired}/${scopedFable.undetTotal}, ${scopedFable.cleanFired}/${scopedFable.cleanTotal} over ${samples6.length} texts — ${reproduced ? "REPRODUCES Study 6 exactly (10/10, 0/12, 1/42)" : "DOES NOT REPRODUCE: the study stops"}.`,
);
if (!reproduced) process.exit(1);

// ─────────────────────────────── 2. The registered measures (results/study6b-reader.json)
const readerFile = `${ROOT}results/study6b-reader.json`;
if (!existsSync(readerFile)) {
	console.log("\nNo Study 6b reads yet (results/study6b-reader.json absent): registered measures not computed.");
	process.exit(0);
}
const records: Cell6bRecord[] = JSON.parse(readFileSync(readerFile, "utf8"));
const specs = new Map((scores6b.scores as RawScore6b[]).map((s) => [s.id, s]));
const fixtureById = new Map((fixture6b.items as { id: string; detectable: boolean; group: string }[]).map((i) => [i.id, i]));

/** Chords a read carries, counted as both instruments count them (m-lines, after the last colon, N.C. out). */
const readChords = (text: string) =>
	text.split(/\r?\n/).filter((l) => /^m\d+\b/.test(l.trim())).flatMap(lineChords);

/** H-scoped's suspicious chords (key in force of any size, Study 6's definition). */
function scopedSuspicious(text: string): { measure: string; chord: string; keyInForce: number }[] {
	let current = 0;
	const out: { measure: string; chord: string; keyInForce: number }[] = [];
	for (const line of text.split(/\r?\n/)) {
		if (!/^m\d+\b/.test(line.trim())) continue;
		for (const k of line.matchAll(/\bkey\s+([A-G][♭♯b#]?)\s+(major|minor)\b/gi)) {
			const n = keySignatureSharps(`${k[1]} ${k[2]}`);
			if (n !== null) current = n;
		}
		const letters = scopedLetters(Math.max(0, current), Math.max(0, -current));
		const measure = /^m(\d+)/.exec(line.trim())![1]!;
		for (const chord of lineChords(line))
			if (letters.has(chord.charAt(0)) && !/^[A-G][♭♯b#]/.test(chord)) out.push({ measure, chord, keyInForce: current });
	}
	return out;
}

/** Each suspicious chord, with the cause: the read's key in force there differs from the truth's (a misplaced key change), or not (the chord itself). */
function anatomy(r: Cell6bRecord, list: { measure: string; chord: string; keyInForce: number }[]): string {
	const truthKeys = truthKeyByMeasure(specs.get(r.itemId)!);
	return list
		.map((s) => {
			const truth = truthKeys.get(Number(s.measure));
			const cause =
				truth === undefined
					? "measure beyond the score"
					: truth !== s.keyInForce
						? `key change misplaced (truth ${fifthsLabel(truth)})`
						: "chord itself";
			return `m${s.measure} ${s.chord} under ${fifthsLabel(s.keyInForce)}: ${cause}`;
		})
		.join("; ");
}

interface Graded {
	r: Cell6bRecord;
	floor: string | null;
	scoped: boolean;
	prod: boolean;
	detectable: boolean;
}
const graded: Graded[] = records.map((r) => {
	const n = r.outcome === "answered" ? readChords(r.text).length : 0;
	const floor = r.outcome !== "answered" ? `no answer (${r.outcome})` : n < 8 ? `under the 8-chord floor (${n} chords)` : null;
	return {
		r,
		floor,
		scoped: floor ? false : fires(H_SCOPED, r.text),
		prod: floor ? false : fires(H_PROD, r.text),
		detectable: fixtureById.get(r.itemId)?.detectable ?? false,
	};
});
const scored = graded.filter((g) => !g.floor);
const tag = (g: Graded) => `${g.r.itemId}/${g.r.condition}`;
console.log(
	`\nStudy 6b reads: ${records.length} records (${records.filter((r) => r.pilot).length} pilot), ${scored.length} scored, ${graded.length - scored.length} floor effects`,
);
for (const g of graded.filter((x) => x.floor)) console.log(`  floor: ${tag(g)} — ${g.floor}`);
const spend = records.reduce((a, r) => a + (r.tokensIn * 10 + r.tokensOut * 50) / 1e6, 0);
console.log(`  spend ≈ $${spend.toFixed(2)} (fable list price, from token usage)`);

const detCorrupt = scored.filter((g) => g.r.condition === "corrupted" && g.detectable);
const undetCorrupt = scored.filter((g) => g.r.condition === "corrupted" && !g.detectable);
const cleanReads = scored.filter((g) => g.r.condition === "clean");
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(0)}%` : "—");

for (const [h, key] of [[H_PROD, "prod"], [H_SCOPED, "scoped"]] as const) {
	const f = (g: Graded) => g[key];
	const hits = detCorrupt.filter(f).length;
	const alarms = undetCorrupt.filter(f);
	const flags = cleanReads.filter(f);
	console.log(`\n${h.name}:`);
	console.log(
		`  hit rate, detectable corrupted: ${hits}/${detCorrupt.length} (${pct(hits, detCorrupt.length)})${detCorrupt.filter((g) => !f(g)).length ? ` — missed: ${detCorrupt.filter((g) => !f(g)).map(tag).join(", ")}` : ""}`,
	);
	console.log(
		`  silence rate, undetectable corrupted: ${undetCorrupt.length - alarms.length}/${undetCorrupt.length} (${pct(undetCorrupt.length - alarms.length, undetCorrupt.length)})${alarms.length ? ` — false alarms: ${alarms.map(tag).join(", ")}` : ""}`,
	);
	console.log(`  clean false positives: ${flags.length}/${cleanReads.length} (${pct(flags.length, cleanReads.length)})`);
	for (const group of ["honest", "modulating", "accidentals"]) {
		const inGroup = cleanReads.filter((g) => g.r.group === group);
		console.log(`    ${group}: ${inGroup.filter(f).length}/${inGroup.length}`);
	}
	for (const g of [...flags, ...alarms])
		console.log(
			`    flag ${tag(g)}: ${anatomy(g.r, key === "prod" ? suspiciousChords(g.r.text) : scopedSuspicious(g.r.text))}`,
		);
}

console.log("\nThe cost of H-prod's extra condition (H-scoped flags, H-prod does not):");
const diffs = scored.filter((g) => g.scoped && !g.prod);
if (diffs.length === 0) console.log("  none");
for (const g of diffs) {
	const label =
		g.r.condition === "corrupted" && g.detectable
			? "HIT LOST"
			: g.r.condition === "corrupted"
				? "false alarm avoided (undetectable corrupted page)"
				: "false alarm avoided (clean page)";
	const accidentals = readChords(g.r.text).filter((c) => /(^|\/)[A-G][♭♯b#]/.test(c));
	const why = accidentals.length
		? `the no-accidental condition: the read carries ${accidentals.join(" ")}`
		: `the key-size condition: H-scoped counted chords under a one-accidental key (${anatomy(g.r, scopedSuspicious(g.r.text).filter((s) => Math.abs(s.keyInForce) < 2))})`;
	console.log(`  ${tag(g)}: ${label} — ${why}`);
}
const reverse = scored.filter((g) => g.prod && !g.scoped);
if (reverse.length) console.log(`  PORT DEFECT: H-prod flags what H-scoped does not: ${reverse.map(tag).join(", ")}`);

const prodClean = cleanReads.filter((g) => g.prod).length;
const prodHits = detCorrupt.filter((g) => g.prod).length;
const complete = records.length === 48;
console.log("\nGates (H-prod, production reader):");
console.log(
	`  G1 clean flags ≤ 1 of 24: ${prodClean}/${cleanReads.length} — ${prodClean <= 1 ? "PASS" : "FAIL"}${cleanReads.length < 24 ? ` (only ${cleanReads.length} clean reads scored${complete ? "" : "; the matrix is incomplete"})` : ""}`,
);
// G2 as registered: ≥ 7 of the 8 detectable corrupted reads (the fixture's
// detectable count is asserted so a corpus change cannot move the gate).
const detPages = (fixture6b.items as { detectable: boolean }[]).filter((i) => i.detectable).length;
if (detPages !== 8) throw new Error(`the fixture has ${detPages} detectable pages; the brief registers 8`);
console.log(
	`  G2 catches ≥ 7 of 8 detectable: ${prodHits}/${detCorrupt.length} — ${
		complete
			? prodHits >= 7
				? "PASS"
				: "FAIL"
			: `${prodHits >= 7 ? "PASS" : detCorrupt.length - prodHits > 1 ? "FAIL" : "open"} (the matrix is incomplete)`
	}`,
);
const cleanAgree = cleanReads.every((g) => g.prod === g.scoped);
console.log(`  Prediction 3 (H-prod and H-scoped agree on every clean read): ${cleanAgree ? "held" : "did not hold"}`);
