/**
 * Study 6 evaluation (docs/BRIEF-STUDY6.md): both heuristics over every
 * existing reader text, corrupted and clean, with mechanical expected
 * labels from the committed specs. Zero model calls.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import scores3 from "../corpus/scores.json";
import fixture5 from "../corpus/fixture5.json";
import mixes from "../corpus/mixes.json";
import { chartReadWarnings, chartReadWarningsLetters, chartReadWarningsScoped } from "../src/study6/warnings.js";

const ROOT = resolve(import.meta.dir, "..");

/** |fifths|max and altered-letter chord count per item, from the committed specs. */
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
	const letters = new Set<string>([
		...SHARP_ORDER.slice(0, maxSharps),
		...FLAT_ORDER.slice(0, maxFlats),
	]);
	const altered = chords.filter((c) => /^[A-G][b#]/.test(c) && letters.has(c.charAt(0))).length;
	return { maxAccidentals: Math.max(maxSharps, maxFlats), alteredRootChords: altered };
}

const truths = new Map<string, ItemTruth>();
for (const s of scores3.scores as { id: string; measures: { key?: [number, string]; chords: string[] }[] }[]) {
	const keys = s.measures.filter((m) => m.key).map((m) => m.key![0]);
	truths.set(s.id, truthOfChords(keys, s.measures.flatMap((m) => m.chords)));
}
for (const m of mixes.mixes as { id: string; sections: { key: string; bars: string[] }[] }[]) {
	const keys = m.sections.map((s) => FIFTHS[s.key] ?? 0);
	truths.set(m.id, truthOfChords(keys, m.sections.flatMap((s) => s.bars)));
}

interface Sample {
	item: string;
	model: string;
	condition: "corrupted" | "clean";
	text: string;
}
const samples: Sample[] = [];
const push = (item: string, model: string, condition: Sample["condition"], text: string) => {
	if (text && item !== "smudge") samples.push({ item, model, condition, text });
};
// Study 3 archived (corrupted) + current (clean) D-pdf, all models; D-image as extra clean.
const arch3 = `${ROOT}/results/archive/study3-dpdf-accidentals-confounded`;
for (const f of readdirSync(arch3)) {
	for (const r of JSON.parse(readFileSync(`${arch3}/${f}`, "utf8"))) {
		if (r.outcome === "answered") push(r.itemId, r.model, "corrupted", r.text);
	}
}
for (const f of readdirSync(`${ROOT}/results`).filter((x) => x.startsWith("study3-") && x.endsWith(".json"))) {
	for (const r of JSON.parse(readFileSync(`${ROOT}/results/${f}`, "utf8"))) {
		if (r.outcome === "answered") push(r.itemId, r.model, "clean", r.text);
	}
}
// Study 5 archived (corrupted, fable) + current reader cells (clean, fable).
for (const r of JSON.parse(readFileSync(`${ROOT}/results/archive/study5-pdf-accidentals/reader-dpdf.json`, "utf8"))) {
	if (r.outcome === "answered") push(r.itemId, "anthropic/claude-fable-5-1", "corrupted", r.text);
}
if (existsSync(`${ROOT}/results/study5-reader.json`)) {
	for (const r of JSON.parse(readFileSync(`${ROOT}/results/study5-reader.json`, "utf8"))) {
		if (r.outcome === "answered") push(r.itemId, "anthropic/claude-fable-5-1", "clean", r.text);
	}
}

const DROP = /lost its accidentals|without an accidental/;
function evaluate(name: string, fn: (s: string) => string[], modelFilter?: (m: string) => boolean) {
	let detHit = 0, detTotal = 0, undetFired = 0, undetTotal = 0, cleanFired = 0, cleanTotal = 0;
	const fp: string[] = [];
	const misses: string[] = [];
	for (const s of samples) {
		if (modelFilter && !modelFilter(s.model)) continue;
		const fired = fn(s.text).some((w) => DROP.test(w));
		const t = truths.get(s.item)!;
		if (s.condition === "corrupted") {
			const detectable = t.maxAccidentals >= 2 && t.alteredRootChords >= 2;
			if (detectable) {
				detTotal++;
				if (fired) detHit++;
				else misses.push(`${s.item}(${s.model.split("/")[1]})`);
			} else {
				undetTotal++;
				if (fired) undetFired++;
			}
		} else {
			cleanTotal++;
			if (fired) {
				cleanFired++;
				fp.push(`${s.item}(${s.model.split("/")[1]})`);
			}
		}
	}
	console.log(`\n${name}:`);
	console.log(`  detectable corrupted: ${detHit}/${detTotal} fired (${((100 * detHit) / Math.max(1, detTotal)).toFixed(0)}%)${misses.length ? ` — missed: ${misses.join(", ")}` : ""}`);
	console.log(`  undetectable corrupted: ${undetFired}/${undetTotal} fired (silence is correct)`);
	console.log(`  clean reads: ${cleanFired}/${cleanTotal} FALSE POSITIVES${fp.length ? ` — ${fp.join(", ")}` : ""}`);
}

console.log(`Study 6 — ${samples.length} reader texts (${samples.filter((s) => s.condition === "corrupted").length} corrupted, ${samples.filter((s) => s.condition === "clean").length} clean)`);
const fableOnly = (m: string) => m.includes("fable");
evaluate("H-shipped, production reader (fable)", chartReadWarnings, fableOnly);
evaluate("H-letters, production reader (fable)", chartReadWarningsLetters, fableOnly);
evaluate("H-shipped, all models", chartReadWarnings);
evaluate("H-letters, all models", chartReadWarningsLetters);
evaluate("H-scoped (EXPLORATORY post-hoc), production reader", chartReadWarningsScoped, fableOnly);
evaluate("H-scoped (EXPLORATORY post-hoc), all models", chartReadWarningsScoped);
