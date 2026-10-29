/**
 * Study 9 analyzer (docs/BRIEF-STUDY9.md, "Registered measures" and
 * "Gates"): reads results/study9-instruments.json (and the Q4 result
 * files when present) and prints the registered tables and gate
 * verdicts. All comparisons are the registered ones; nothing here
 * re-thresholds.
 */
import { existsSync, readFileSync } from "node:fs";
import fixture from "../corpus/fixture9.json";
import { keyEqual } from "../src/grading/listen.js";

const root = new URL("../", import.meta.url).pathname;
const run = JSON.parse(readFileSync(`${root}results/study9-instruments.json`, "utf8"));
const itemOf = new Map(fixture.items.map((i) => [i.id, i]));

type Rec = (typeof run.records)[number];

/** Registered tempo grade: within 1 bpm of the initial tempo or, on tempo-change items, any section's tempo. */
function tempoTruths(id: string): number[] {
	const item = itemOf.get(id)!;
	return [item.truth.tempo, ...item.truth.tempoChanges.map((c: { bpm: number }) => c.bpm)].filter(
		(x): x is number => x !== null,
	);
}
const exact = (bpm: number, truths: number[]) => truths.some((t) => Math.abs(bpm - t) <= 1);
const octave = (bpm: number, truths: number[]) =>
	truths.some((t) => Math.abs(bpm - t / 2) <= 1 || Math.abs(bpm - t * 2) <= 1);

/** Registered key grade: the item's key or, on modulating items, any section's key. */
function keyRight(id: string, name: string): boolean {
	const item = itemOf.get(id)!;
	const truths = [item.truth.key, ...item.truth.keyChanges.map((c: { key: string }) => c.key)];
	return truths.some((t) => keyEqual(name, t));
}

/** Boundaries within ±4 s of truth (grade8's tolerance). */
function boundaryGrade(id: string, boundaries: number[]) {
	const truth = itemOf
		.get(id)!
		.sections.sections.filter((s: { at: number }) => s.at > 0.5)
		.map((s: { at: number }) => s.at);
	const found = truth.filter((t: number) => boundaries.some((b) => Math.abs(b - t) <= 4)).length;
	const fals = boundaries.filter((b) => !truth.some((t: number) => Math.abs(b - t) <= 4)).length;
	return { total: truth.length, found, false: fals };
}

// ---- Q1: sections from stem activity ----
console.log("Q1 — D-activity boundaries (±4 s), truth grid | detected grid:");
const byClass: Record<string, { total: number; found: number; false: number; items: number }> = {};
let loopFalse = 0;
let contrastFound = 0;
let contrastTotal = 0;
for (const r of run.records as Rec[]) {
	const g = boundaryGrade(r.itemId, r.activityTruthGrid.boundaries);
	const g2 = boundaryGrade(r.itemId, r.activityDetectedGrid.boundaries);
	const c = (byClass[r.class] ??= { total: 0, found: 0, false: 0, items: 0 });
	c.total += g.total;
	c.found += g.found;
	c.false += g.false;
	c.items++;
	if (r.class === "loop") loopFalse += g.false;
	if (r.class === "contrast") {
		contrastFound += g.found;
		contrastTotal += g.total;
	}
	console.log(
		`  ${r.itemId.padEnd(22)} ${r.class.padEnd(9)} truth-grid ${g.found}/${g.total} +${g.false} | detected-grid ${g2.found}/${g2.total} +${g2.false}`,
	);
}
for (const [cls, c] of Object.entries(byClass)) {
	console.log(
		`  ${cls}: ${c.found}/${c.total} boundaries, ${(c.false / c.items).toFixed(2)} false/item over ${c.items} items`,
	);
}
const g1 = contrastFound >= 8 && contrastTotal === 8 && loopFalse === 0;
console.log(
	`S9-G1 (contrast ≥ 8/8 as the Study 8 chart arm, 0 false on the 6 loops): contrast ${contrastFound}/${contrastTotal}, loop false ${loopFalse} → ${g1 ? "PASS" : "FAIL"}`,
);

// ---- Q2: tempo from the sharpest stem ----
console.log("\nQ2 — tempo, D-prod vs D-stem-tempo (exact ±1; octave counted apart):");
let prodExact = 0;
let stemExact = 0;
let regressions = 0;
let newOctave = 0;
const misleadProdWrong: Rec[] = [];
for (const r of run.records as Rec[]) {
	const truths = tempoTruths(r.itemId);
	const pe = exact(r.prod.tempo.bpm, truths);
	const se = exact(r.stemTempo.tempo.bpm, truths);
	prodExact += pe ? 1 : 0;
	stemExact += se ? 1 : 0;
	if (pe && !se) {
		regressions++;
		if (octave(r.stemTempo.tempo.bpm, truths)) newOctave++;
	}
	if (!pe && r.class === "mislead") misleadProdWrong.push(r);
	console.log(
		`  ${r.itemId.padEnd(22)} truth ${truths.join("/")} | prod ${r.prod.tempo.bpm} ${pe ? "✓" : octave(r.prod.tempo.bpm, truths) ? "octave" : "✗"} | stem ${r.stemTempo.tempo.bpm} ${se ? "✓" : octave(r.stemTempo.tempo.bpm, truths) ? "octave" : "✗"}${r.stemTempo.octaveFlag ? " ⚑" : ""} [${r.stemTempo.perStem.map((p: { bpm: number }) => p.bpm).join(" ")}]`,
	);
}
const misleadRescued = misleadProdWrong.filter((r) =>
	exact(r.stemTempo.tempo.bpm, tempoTruths(r.itemId)),
).length;
const g2a = regressions === 0;
const g2b = misleadProdWrong.length < 2 || misleadRescued * 2 >= misleadProdWrong.length;
console.log(
	`S9-G2: prod exact ${prodExact}/21, stem exact ${stemExact}/21; regressions ${regressions} (octave ${newOctave}); prod wrong on ${misleadProdWrong.length} mislead items, stem rescued ${misleadRescued}${misleadProdWrong.length < 2 ? " (rescue clause vacuous: the sum was robust)" : ""} → ${g2a && g2b ? "PASS" : "FAIL"}`,
);

// ---- Q3: key confidence vs agreement ----
console.log("\nQ3 — key right/wrong separation, production confidence vs stem agreement:");
const right: Rec[] = [];
const wrong: Rec[] = [];
for (const r of run.records as Rec[]) {
	(keyRight(r.itemId, r.prod.key.value) ? right : wrong).push(r);
	console.log(
		`  ${r.itemId.padEnd(22)} key ${r.prod.key.value.padEnd(9)} ${keyRight(r.itemId, r.prod.key.value) ? "✓" : "✗"} conf ${r.prod.key.confidence.toFixed(3)} agree ${r.keyAgree.agreement.toFixed(2)} (${r.keyAgree.tonalStems} tonal)`,
	);
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const auc = (rightXs: number[], wrongXs: number[]) => {
	let wins = 0;
	for (const a of rightXs) for (const b of wrongXs) wins += a > b ? 1 : a === b ? 0.5 : 0;
	return wins / (rightXs.length * wrongXs.length);
};
console.log(`  right ${right.length}, wrong ${wrong.length}`);
if (wrong.length < 3) {
	console.log(
		"S9-G3: fewer than 3 wrong key answers — UNEVALUABLE on this corpus (registered fallback; reported, not failed)",
	);
} else {
	const sepConf =
		mean(right.map((r) => r.prod.key.confidence)) - mean(wrong.map((r) => r.prod.key.confidence));
	const sepAgree =
		mean(right.map((r) => r.keyAgree.agreement)) - mean(wrong.map((r) => r.keyAgree.agreement));
	const aucConf = auc(
		right.map((r) => r.prod.key.confidence),
		wrong.map((r) => r.prod.key.confidence),
	);
	const aucAgree = auc(
		right.map((r) => r.keyAgree.agreement),
		wrong.map((r) => r.keyAgree.agreement),
	);
	console.log(
		`S9-G3: separation conf ${sepConf.toFixed(3)} vs agree ${sepAgree.toFixed(3)}; AUC conf ${aucConf.toFixed(3)} vs agree ${aucAgree.toFixed(3)} → ${sepAgree > sepConf && aucAgree >= aucConf ? "PASS" : "FAIL"}`,
	);
}

// ---- Q4: the side arm, when run ----
for (const mode of ["pilot", "matrix"]) {
	const path = `${root}results/study9-q4-${mode}.json`;
	if (!existsSync(path)) continue;
	const q4 = JSON.parse(readFileSync(path, "utf8"));
	console.log(`\nQ4 (${mode}) — key and tempo by condition:`);
	for (const model of q4.models as string[]) {
		for (const condition of ["mix", "stem"]) {
			const cells = q4.cells.filter(
				(c: { model: string; condition: string }) => c.model === model && c.condition === condition,
			);
			const answered = cells.filter((c: { answer: unknown }) => c.answer);
			const keyOk = answered.filter((c: { itemId: string; answer: { key: string } }) =>
				keyRight(c.itemId, c.answer.key),
			).length;
			const tempoOk = answered.filter(
				(c: { itemId: string; answer: { tempo: number | null } }) =>
					c.answer.tempo !== null && exact(c.answer.tempo, tempoTruths(c.itemId)),
			).length;
			console.log(
				`  ${model.padEnd(26)} ${condition.padEnd(4)} key ${keyOk}/${cells.length}, tempo ${tempoOk}/${cells.length}${answered.length < cells.length ? ` (${cells.length - answered.length} unanswered)` : ""}`,
			);
		}
		const byItem = new Map<string, { mix?: boolean; stem?: boolean }>();
		for (const c of q4.cells.filter((c: { model: string }) => c.model === model)) {
			if (!c.answer) continue;
			const e = byItem.get(c.itemId) ?? {};
			e[c.condition as "mix" | "stem"] = keyRight(c.itemId, c.answer.key);
			byItem.set(c.itemId, e);
		}
		const flips = [...byItem.values()].filter((e) => e.mix !== undefined && e.mix !== e.stem);
		console.log(`  ${model}: ${flips.length} item(s) change key correctness mix↔stem`);
	}
}
