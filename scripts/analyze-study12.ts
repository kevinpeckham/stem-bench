/**
 * Study 12 analyzer (docs/BRIEF-STUDY12.md): gate verdicts over
 * results/study12.json. No re-thresholding.
 */
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const run = JSON.parse(readFileSync(`${root}results/study12.json`, "utf8"));

// ---- G1: the synthetic arm ----
type Synth = { itemId: string; class: string; barCount: number; within025: number; maxAbsErr: number; sectionErrs: number[] };
const synth = run.synth as Synth[];
let bars = 0;
let within = 0;
const byClass = new Map<string, { bars: number; within: number; worst: number }>();
for (const s of synth) {
	bars += s.barCount;
	within += s.within025;
	const c = byClass.get(s.class) ?? { bars: 0, within: 0, worst: 0 };
	c.bars += s.barCount;
	c.within += s.within025;
	c.worst = Math.max(c.worst, s.maxAbsErr);
	byClass.set(s.class, c);
}
console.log("G1a — bar starts within ±0.25 s, by class:");
for (const [cls, c] of byClass) {
	console.log(`  ${cls.padEnd(16)} ${c.within}/${c.bars} (worst ${c.worst.toFixed(2)} s)`);
}
const g1a = within / bars >= 0.95;
console.log(`G1a (≥ 95 % overall): ${within}/${bars} = ${((100 * within) / bars).toFixed(1)} % → ${g1a ? "PASS" : "FAIL"}`);

const contrast = synth.filter((s) => s.class === "contrast");
const cBounds = contrast.flatMap((s) => s.sectionErrs);
const g1b = cBounds.length === 8 && cBounds.every((e) => e <= 0.5);
console.log(
	`G1b (contrast boundaries at ±0.5 s — the metric every model and the neural segmenter failed): ${cBounds.filter((e) => e <= 0.5).length}/${cBounds.length} → ${g1b ? "PASS" : "FAIL"}`,
);
const changey = synth.filter((s) => ["change", "hard-mediantmod"].includes(s.class));
const chBounds = changey.flatMap((s) => s.sectionErrs);
console.log(
	`  Reported: tempo/key-change boundaries at ±0.5 s (invisible to D-activity, 6/8 for the models): ${chBounds.filter((e) => e <= 0.5).length}/${chBounds.length}`,
);

// ---- The wrong-chart probe ----
console.log("\nWrong-chart probe (reported, ungated):");
let sepOk = 0;
for (const p of run.probe as { recording: string; chart: string; rightCost: number; wrongCost: number }[]) {
	const sep = p.wrongCost / Math.max(1e-9, p.rightCost);
	if (p.wrongCost > p.rightCost) sepOk++;
	console.log(`  ${p.recording} vs chart ${p.chart}: right ${p.rightCost.toFixed(3)}, wrong ${p.wrongCost.toFixed(3)} (×${sep.toFixed(1)})`);
}
console.log(`  wrong > right on ${sepOk}/${(run.probe as unknown[]).length} pairs — the mechanical same-piece check's raw material`);

// ---- G2: the real arm ----
console.log("\nG2 — the real arm (declared section starts as truth):");
let g2 = true;
for (const r of run.real as { slug: string; gated: boolean; errs: number[]; declaredCount: number; chartCount: number }[]) {
	const in4 = r.errs.filter((e) => e <= 4).length;
	const in05 = r.errs.filter((e) => e <= 0.5).length;
	console.log(
		`  ${r.slug.padEnd(20)} ${r.gated ? "GATED      " : "exploratory"} boundaries ${in4}/${r.errs.length} ≤4 s, ${in05}/${r.errs.length} ≤0.5 s (chart ${r.chartCount} sections vs ${r.declaredCount} declared) | errs ${r.errs.join(", ")}`,
	);
	if (r.gated && !(in4 >= 8 && in05 >= 7)) g2 = false;
}
console.log(
	`G2 (letter-lands ≥ 8/9 at ±4 s AND ≥ 7/9 at ±0.5 s — parity-or-better with the neural segmenter's 8/9 and 7/9): ${g2 ? "PASS" : "FAIL"}`,
);

console.log(`\nVERDICT: G1a ${g1a ? "PASS" : "FAIL"}, G1b ${g1b ? "PASS" : "FAIL"}, G2 ${g2 ? "PASS" : "FAIL"}`);
