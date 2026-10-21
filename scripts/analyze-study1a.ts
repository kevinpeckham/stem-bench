/**
 * Amendment 2 analysis (docs/BRIEF-STUDY1.md): the shipped-configuration
 * arm under the v0.141 matcher (Study 1's A-matcher) against the v0.142
 * matcher (study1a's A-matcher2), per model: accuracy, and on bars where
 * the respective hint is WRONG, the propagation rate (answer equals the
 * wrong hint) and the rescue rate (answer correct anyway). The flip rate
 * is a wrong-hint-arm metric and does not involve the matcher; it is
 * unchanged by construction.
 */
import { readdirSync, readFileSync } from "node:fs";
import fixture from "../corpus/fixture.json";
import { sameChord } from "../src/grading/symbols.js";
import type { FixtureSong } from "../src/harness/prompt.js";
import type { CellRecord } from "../src/harness/runner.js";

const songs = fixture.songs as FixtureSong[];
const dir = new URL("../results/", import.meta.url).pathname;
const load = (prefix: string): CellRecord[] =>
	readdirSync(dir)
		.filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
		.flatMap((f) => JSON.parse(readFileSync(dir + f, "utf8")) as CellRecord[]);
const study1 = load("study1-").filter((r) => r.arm === "A-matcher");
const study1a = load("study1a-");
const models = [...new Set(study1a.map((r) => r.model))].sort();

function hintAccuracy(field: "matcherPerBar" | "matcher2PerBar"): string {
	let hits = 0;
	let total = 0;
	for (const s of songs) {
		const per = s[field]!;
		hits += s.truth.filter((c, b) => sameChord(c, per[b]!)).length;
		total += s.truth.length;
	}
	return `${hits}/${total} (${((100 * hits) / total).toFixed(1)}%)`;
}
console.log(`Hint accuracy: v0.141 ${hintAccuracy("matcherPerBar")} → v0.142 ${hintAccuracy("matcher2PerBar")}\n`);

function stats(records: CellRecord[], model: string, field: "matcherPerBar" | "matcher2PerBar") {
	let correct = 0;
	let total = 0;
	let wrongHintBars = 0;
	let propagated = 0;
	let rescued = 0;
	for (const s of songs) {
		const r = records.find((x) => x.model === model && x.songId === s.id);
		if (!r?.grade) continue;
		correct += r.grade.correct;
		total += r.grade.total;
		const hints = s[field]!;
		for (const [b, bar] of r.grade.bars.entries()) {
			if (sameChord(hints[b]!, s.truth[b]!)) continue;
			wrongHintBars++;
			if (bar.answer !== "" && sameChord(bar.answer, hints[b]!)) propagated++;
			if (bar.correct) rescued++;
		}
	}
	return { correct, total, wrongHintBars, propagated, rescued };
}

console.log(
	"model".padEnd(34) +
		"\tv0.141 acc\tpropagate\trescue\t|\tv0.142 acc\tpropagate\trescue",
);
for (const m of models) {
	const a = stats(study1, m, "matcherPerBar");
	const b = stats(study1a, m, "matcher2PerBar");
	const pct = (x: number, t: number) => (t ? `${((100 * x) / t).toFixed(1)}%` : "—");
	console.log(
		`${m.padEnd(34)}\t${pct(a.correct, a.total)}\t${a.propagated}/${a.wrongHintBars}\t${pct(a.rescued, a.wrongHintBars)}\t|\t${pct(b.correct, b.total)}\t${b.propagated}/${b.wrongHintBars}\t${pct(b.rescued, b.wrongHintBars)}`,
	);
}
const errs = study1a.filter((r) => r.outcome !== "answered");
console.log(`\nstudy1a non-answered cells: ${errs.length}`);
const tin = study1a.reduce((x, r) => x + r.tokensIn, 0);
const tout = study1a.reduce((x, r) => x + r.tokensOut, 0);
console.log(`study1a tokens: ${tin} in / ${tout} out`);
