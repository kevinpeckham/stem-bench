/**
 * Study 1 analysis (docs/BRIEF-STUDY1.md, "Hypotheses"): per model × arm
 * accuracy, the matcher baseline, the two registered paired comparisons
 * (A-correct vs A-none, A-wrong vs A-none; sign-flip permutation on
 * per-song accuracy differences, 20000 draws, seeded), the wrong-hint copy
 * and flip rates, disclosure counts, and the cost anatomy. Reads every
 * results/study1-*.json present.
 */
import { readdirSync, readFileSync } from "node:fs";
import fixture from "../corpus/fixture.json";
import { mulberry32 } from "../src/fixture/synth.js";
import { sameChord, wrongHint } from "../src/grading/symbols.js";
import type { FixtureSong } from "../src/harness/prompt.js";
import type { CellRecord } from "../src/harness/runner.js";

const songs = fixture.songs as FixtureSong[];
const songOf = new Map(songs.map((s) => [s.id, s]));
const dir = new URL("../results/", import.meta.url).pathname;
const records: CellRecord[] = readdirSync(dir)
	.filter((f) => f.startsWith("study1-") && f.endsWith(".json"))
	.flatMap((f) => JSON.parse(readFileSync(dir + f, "utf8")) as CellRecord[]);
if (records.length === 0) throw new Error("no results yet");

const models = [...new Set(records.map((r) => r.model))].sort();
const ARMS = ["A-none", "A-matcher", "A-correct", "A-wrong"] as const;

const totalBars = songs.reduce((a, s) => a + s.truth.length, 0);
const matcherHits = songs.reduce(
	(a, s) => a + s.truth.filter((c, b) => sameChord(c, s.matcherPerBar[b]!)).length,
	0,
);
console.log(`Fixture: ${songs.length} songs, ${totalBars} bars.`);
console.log(
	`Template-matcher baseline: ${matcherHits}/${totalBars} (${pct(matcherHits / totalBars)})\n`,
);

const cell = (m: string, s: string, a: string) =>
	records.find((r) => r.model === m && r.songId === s && r.arm === a);

console.log("Bar accuracy per model × arm (answered cells; a parse failure scores 0):");
console.log(`model${"".padEnd(30)}\t${ARMS.join("\t")}\tparse/api errors`);
for (const m of models) {
	const row = ARMS.map((a) => {
		const rs = records.filter((r) => r.model === m && r.arm === a && r.grade);
		const correct = rs.reduce((x, r) => x + (r.grade?.correct ?? 0), 0);
		const total = rs.reduce((x, r) => x + (r.grade?.total ?? 0), 0);
		return total ? pct(correct / total) : "—";
	});
	const errs = records.filter((r) => r.model === m && r.outcome !== "answered").length;
	console.log(`${m.padEnd(34)}\t${row.join("\t")}\t${errs}`);
}

/** Per-song accuracy for a (model, arm); null when the cell is missing. */
function songAcc(m: string, s: string, a: string): number | null {
	const r = cell(m, s, a);
	if (!r?.grade) return null;
	return r.grade.correct / r.grade.total;
}

function permutationP(diffs: number[]): number {
	const rand = mulberry32(20261021);
	const observed = Math.abs(diffs.reduce((a, b) => a + b, 0));
	let extreme = 0;
	const draws = 20000;
	for (let i = 0; i < draws; i++) {
		let sum = 0;
		for (const d of diffs) sum += rand() < 0.5 ? d : -d;
		if (Math.abs(sum) >= observed - 1e-12) extreme++;
	}
	return extreme / draws;
}

for (const [label, arm] of [
	["S1-H1 A-correct vs A-none", "A-correct"],
	["S1-H2 A-wrong vs A-none", "A-wrong"],
	["(read) A-matcher vs A-none", "A-matcher"],
] as const) {
	console.log(`\n${label} (paired per song, sign-flip permutation):`);
	for (const m of models) {
		const diffs = songs
			.map((s) => {
				const a = songAcc(m, s.id, arm);
				const b = songAcc(m, s.id, "A-none");
				return a === null || b === null ? null : a - b;
			})
			.filter((d): d is number => d !== null);
		if (!diffs.length) continue;
		const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
		console.log(
			`  ${m.padEnd(34)} Δ ${(100 * mean).toFixed(1)} pts over ${diffs.length} songs, p = ${permutationP(diffs).toFixed(4)}`,
		);
	}
}

console.log("\nS1-H3 wrong-hint influence (A-wrong):");
for (const m of models) {
	let hintable = 0;
	let copied = 0;
	let flipBase = 0;
	let flipped = 0;
	for (const s of songs) {
		const wrong = s.truth.map(wrongHint);
		const none = cell(m, s.id, "A-none")?.grade?.bars;
		const w = cell(m, s.id, "A-wrong")?.grade?.bars;
		if (!w) continue;
		for (const [b, bar] of w.entries()) {
			const hint = wrong[b]!;
			if (sameChord(hint, s.truth[b]!)) continue; // N.C. bars: the hint is not wrong
			hintable++;
			const copiedThis = bar.answer !== "" && sameChord(bar.answer, hint);
			if (copiedThis) copied++;
			if (none?.[b]?.correct) {
				flipBase++;
				if (copiedThis) flipped++;
			}
		}
	}
	console.log(
		`  ${m.padEnd(34)} copy rate ${copied}/${hintable} (${pct(copied / Math.max(1, hintable))}), flip rate ${flipped}/${flipBase} (${pct(flipped / Math.max(1, flipBase))})`,
	);
}

console.log("\nS1-H5 disclosure: cells whose notes/chart mention the matcher or a disagreement (A-wrong):");
const DISCLOSURE = /matcher|hint|disagree|conflict|differ|does not match|doesn't match|inconsistent/i;
for (const m of models) {
	const rs = records.filter((r) => r.model === m && r.arm === "A-wrong" && r.outcome === "answered");
	const n = rs.filter((r) => DISCLOSURE.test(r.modelNotes)).length;
	console.log(`  ${m.padEnd(34)} ${n}/${rs.length} cells`);
}

console.log("\nCost anatomy (all arms):");
for (const m of models) {
	const rs = records.filter((r) => r.model === m);
	const tin = rs.reduce((a, r) => a + r.tokensIn, 0);
	const tout = rs.reduce((a, r) => a + r.tokensOut, 0);
	const lat = rs.reduce((a, r) => a + r.latencyMs, 0) / Math.max(1, rs.length);
	console.log(
		`  ${m.padEnd(34)} ${rs.length} cells, ${tin} in / ${tout} out, mean ${Math.round(lat)} ms`,
	);
}

function pct(x: number): string {
	return `${(100 * x).toFixed(1)}%`;
}
