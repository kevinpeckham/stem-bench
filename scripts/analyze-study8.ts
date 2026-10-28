/**
 * Study 8 analysis (docs/BRIEF-STUDY8.md): per model × arm boundary
 * detection split by item class (contrast vs no-contrast vs
 * single-section loops), false boundaries, names, the S8-G1 gate.
 */
import { readdirSync, readFileSync } from "node:fs";
import mixes from "../corpus/mixes.json";
import type { MixSpec } from "../src/study4/synth4.js";

const CONTRAST = ["contrast-a", "contrast-b", "contrast-c"];
const specs = (mixes.mixes as MixSpec[]).filter((m) => !m.pulseless);
const multi = specs.filter((s) => s.sections.length > 1 && !CONTRAST.includes(s.id)).map((s) => s.id);
const loops = specs.filter((s) => s.sections.length === 1).map((s) => s.id);

interface Cell8 {
	itemId: string;
	arm: string;
	model: string;
	outcome: string;
	grade: {
		boundariesTotal: number;
		boundariesFound: number;
		falseBoundaries: number;
		namesTotal: number;
		namesCorrect: number;
	} | null;
	tokensIn: number;
	tokensOut: number;
}
const dir = new URL("../results/", import.meta.url).pathname;
const records: Cell8[] = readdirSync(dir)
	.filter((f) => f.startsWith("study8-") && f.endsWith(".json"))
	.flatMap((f) => JSON.parse(readFileSync(dir + f, "utf8")) as Cell8[]);
if (!records.length) throw new Error("no study8 results yet");
const models = [...new Set(records.map((r) => r.model))].sort();
const ARMS = ["S-blind", "S-vocab", "S-chart"];

function agg(rs: Cell8[], ids: string[]) {
	const sel = rs.filter((r) => ids.includes(r.itemId) && r.grade);
	const bT = sel.reduce((a, r) => a + r.grade!.boundariesTotal, 0);
	const bF = sel.reduce((a, r) => a + r.grade!.boundariesFound, 0);
	const fb = sel.reduce((a, r) => a + r.grade!.falseBoundaries, 0);
	return { bT, bF, fb, n: sel.length };
}

console.log(`Classes: contrast ${CONTRAST.length} items, change-boundary ${multi.length}, single-section loops ${loops.length}\n`);
console.log("Boundary detection per model × arm × class (found/total, false per item):");
for (const m of models) {
	for (const arm of ARMS) {
		const rs = records.filter((r) => r.model === m && r.arm === arm);
		const c = agg(rs, CONTRAST);
		const x = agg(rs, multi);
		const l = agg(rs, loops);
		console.log(
			`  ${m.padEnd(26)} ${arm.padEnd(8)} contrast ${c.bF}/${c.bT} (false ${(c.fb / Math.max(1, c.n)).toFixed(1)}/item) | changes ${x.bF}/${x.bT} (${(x.fb / Math.max(1, x.n)).toFixed(1)}) | loops false ${(l.fb / Math.max(1, l.n)).toFixed(1)}/item`,
		);
	}
}

console.log("\nS8-G1 (gate, production model): S-chart boundaries ≥ 80%, false ≤ 0.5/item:");
for (const m of models) {
	const rs = records.filter((r) => r.model === m && r.arm === "S-chart" && r.grade);
	const bT = rs.reduce((a, r) => a + r.grade!.boundariesTotal, 0);
	const bF = rs.reduce((a, r) => a + r.grade!.boundariesFound, 0);
	const fb = rs.reduce((a, r) => a + r.grade!.falseBoundaries, 0) / Math.max(1, rs.length);
	const pass = bF / Math.max(1, bT) >= 0.8 && fb <= 0.5;
	console.log(`  ${m.padEnd(26)} ${bF}/${bT} (${((100 * bF) / Math.max(1, bT)).toFixed(0)}%), false ${fb.toFixed(2)}/item → ${pass ? "PASS" : "FAIL"}`);
}

console.log("\nNames on the named (contrast) items:");
for (const m of models) {
	for (const arm of ARMS) {
		const rs = records.filter((r) => r.model === m && r.arm === arm && CONTRAST.includes(r.itemId) && r.grade);
		const nT = rs.reduce((a, r) => a + r.grade!.namesTotal, 0);
		const nC = rs.reduce((a, r) => a + r.grade!.namesCorrect, 0);
		console.log(`  ${m.padEnd(26)} ${arm.padEnd(8)} ${nC}/${nT}`);
	}
}

console.log("\nErrors and cost:");
for (const m of models) {
	const rs = records.filter((r) => r.model === m);
	const bad = rs.filter((r) => r.outcome !== "answered").length;
	console.log(`  ${m.padEnd(26)} ${rs.length} cells, ${bad} not answered, ${rs.reduce((a, r) => a + r.tokensIn, 0)} in / ${rs.reduce((a, r) => a + r.tokensOut, 0)} out`);
}
