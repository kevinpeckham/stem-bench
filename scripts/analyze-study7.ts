/**
 * Study 7 analysis (docs/BRIEF-STUDY7.md): per model × arm raw and
 * applied field accuracy, the S7-G1/G2 gates, the echo reads against
 * Study 4's L-wrong anchor, and change placement.
 */
import { readdirSync, readFileSync } from "node:fs";
import type { Cell7Record } from "../src/study7/runner7.js";

const dir = new URL("../results/", import.meta.url).pathname;
const records: Cell7Record[] = readdirSync(dir)
	.filter((f) => f.startsWith("study7-") && f.endsWith(".json"))
	.flatMap((f) => JSON.parse(readFileSync(dir + f, "utf8")) as Cell7Record[]);
if (!records.length) throw new Error("no study7 results yet");
const models = [...new Set(records.map((r) => r.model))].sort();
const ARMS = ["R-true", "R-wrong", "R-chord", "R-chord-wrong"] as const;

console.log("Raw (chart obedience) and applied accuracy per model × arm:");
console.log(`model${"".padEnd(25)}\tarm\trawT\trawM\trawK\tappT\tappM\tkΔ\ttΔ`);
for (const m of models) {
	for (const arm of ARMS) {
		const rs = records.filter((r) => r.model === m && r.arm === arm && r.grade);
		if (!rs.length) continue;
		const n = rs.length;
		const c = (f: (g: NonNullable<Cell7Record["grade"]>) => boolean) =>
			rs.filter((r) => f(r.grade!)).length;
		const kF = rs.reduce((a, r) => a + r.grade!.rawKeyChangesFound, 0);
		const kT = rs.reduce((a, r) => a + r.grade!.rawKeyChangesTotal, 0);
		const tF = rs.reduce((a, r) => a + r.grade!.rawTempoChangesFound, 0);
		const tT = rs.reduce((a, r) => a + r.grade!.rawTempoChangesTotal, 0);
		console.log(
			`${m.padEnd(30)}\t${arm.padEnd(13)}\t${c((g) => g.rawTempoCorrect)}/${n}\t${c((g) => g.rawMeterCorrect)}/${n}\t${c((g) => g.rawKeyCorrect)}/${n}\t${c((g) => g.appliedTempoCorrect)}/${n}\t${c((g) => g.appliedMeterCorrect)}/${n}\t${kF}/${kT}\t${tF}/${tT}`,
		);
	}
}

console.log("\nS7-G1 (gate, production model): wrong settings surviving to APPLICATION (anchor: Study 4 L-wrong echoed 10-12/12):");
for (const m of models) {
	const rs = records.filter(
		(r) => r.model === m && (r.arm === "R-wrong" || r.arm === "R-chord-wrong") && r.grade,
	);
	const t = rs.filter((r) => r.grade!.appliedWrongTempo).length;
	const me = rs.filter((r) => r.grade!.appliedWrongMeter).length;
	console.log(`  ${m.padEnd(30)} applied wrong tempo ${t}/${rs.length}, applied wrong meter ${me}/${rs.length}`);
}

console.log("\nS7-G2 (gate, production model): invented tempos in chord arms (chart states none):");
for (const m of models) {
	const rs = records.filter((r) => r.model === m && (r.arm === "R-chord" || r.arm === "R-chord-wrong") && r.grade);
	const inv = rs.filter((r) => r.grade!.rawInventedTempo);
	console.log(`  ${m.padEnd(30)} ${inv.length}/${rs.length}${inv.length ? ` (${inv.map((r) => `${r.itemId} ${r.arm}: ${r.raw?.tempo}`).join("; ")})` : ""}`);
}

console.log("\nS7-H4 (read): RAW echo of wrong settings (the residual the app layer must guard):");
for (const m of models) {
	for (const arm of ["R-wrong", "R-chord-wrong"] as const) {
		const rs = records.filter((r) => r.model === m && r.arm === arm && r.grade);
		const t = rs.filter((r) => r.grade!.echoedWrongTempo).length;
		const me = rs.filter((r) => r.grade!.echoedWrongMeter).length;
		console.log(`  ${m.padEnd(30)} ${arm.padEnd(13)} echo tempo ${t}/${rs.length}, echo meter ${me}/${rs.length}`);
	}
}

console.log("\nErrors and cost:");
for (const m of models) {
	const rs = records.filter((r) => r.model === m);
	const bad = rs.filter((r) => r.outcome !== "answered").length;
	const tin = rs.reduce((a, r) => a + r.tokensIn, 0);
	const tout = rs.reduce((a, r) => a + r.tokensOut, 0);
	console.log(`  ${m.padEnd(30)} ${rs.length} cells, ${bad} not answered, ${tin} in / ${tout} out`);
}
