/**
 * Study 11c analyzer (docs/BRIEF-STUDY11C.md): gate verdicts over
 * results/study11c.json. No re-thresholding.
 */
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const run = JSON.parse(readFileSync(`${root}results/study11c.json`, "utf8"));

// ---- C1: the declared-meter gate against the shipped numbers ----
console.log("C1 — the declared-meter gate over the 11b corpus:");
let wrongRows = 0;
let wrongAccepts = 0;
let lostMatches = 0;
let gainedMatches = 0;
const keyItems = ["lilt-a", "lilt-b", "contrast-c", "verb-y", "mop-heart", "peaceful-dreams"];
for (const r of run.arm1 as {
	itemId: string;
	meter: string;
	trueTempos: number[];
	detected: number;
	shippedMatch: { factor: number } | null;
	patchedMatch: { factor: number } | null;
	wrongRows: { declared: number; multiplier: number; acceptPatched: boolean }[];
}[]) {
	for (const w of r.wrongRows) {
		wrongRows++;
		if (w.acceptPatched) {
			wrongAccepts++;
			console.log(`  FALSE ACCEPT: ${r.itemId} declared ${w.declared} (×${w.multiplier}) vs ${r.detected} (${r.meter})`);
		}
	}
	if (r.shippedMatch && !r.patchedMatch && r.itemId !== "peaceful-dreams") {
		lostMatches++;
		console.log(`  LOST MATCH: ${r.itemId} (${r.meter}) shipped f=${r.shippedMatch.factor} patched none`);
	}
	if (!r.shippedMatch && r.patchedMatch) {
		gainedMatches++;
		console.log(`  GAINED: ${r.itemId} (${r.meter}) patched f=${r.patchedMatch.factor.toFixed(2)}`);
	}
	if (keyItems.includes(r.itemId)) {
		console.log(
			`  ${r.itemId.padEnd(18)} ${r.meter.padEnd(4)} truth ${r.trueTempos.join("/")} det ${r.detected} | shipped ${r.shippedMatch ? `f=${r.shippedMatch.factor.toFixed(2)}` : "✗"} | patched ${r.patchedMatch ? `f=${r.patchedMatch.factor.toFixed(2)}` : "✗ (stays loud)"}`,
		);
	}
}
const peaceful = (run.arm1 as { itemId: string; patchedMatch: unknown }[]).find(
	(r) => r.itemId === "peaceful-dreams",
);
const c1 = wrongAccepts === 0 && lostMatches === 0 && peaceful?.patchedMatch === null;
console.log(
	`C1: wrong rows ${wrongAccepts}/${wrongRows} accepted; true-count matches lost ${lostMatches}, gained ${gainedMatches}; peaceful-dreams ${peaceful?.patchedMatch ? "WRONGLY matched" : "stays loud"} → ${c1 ? "PASS" : "FAIL"}`,
);

// ---- C2: the mirror ----
console.log("\nC2 — the mirror fixture (straight running eighths, declared at ⅔):");
let lagAccepts = 0;
let meterAccepts = 0;
for (const m of run.arm2 as {
	itemId: string;
	truth: number;
	detected: number;
	wrongDeclared: number;
	subAtDeclared: { subdivision: number; r3: number; rBeat: number };
	declaredLagAccept: boolean;
	declaredMeterAccept: boolean;
}[]) {
	lagAccepts += m.declaredLagAccept ? 1 : 0;
	meterAccepts += m.declaredMeterAccept ? 1 : 0;
	console.log(
		`  ${m.itemId.padEnd(12)} truth ${m.truth} det ${m.detected} | wrong ${m.wrongDeclared} | declared-lag sub ${m.subAtDeclared.subdivision} (r3 ${m.subAtDeclared.r3.toFixed(2)}/rB ${m.subAtDeclared.rBeat.toFixed(2)}) ${m.declaredLagAccept ? "ACCEPTS" : "rejects"} | declared-meter ${m.declaredMeterAccept ? "ACCEPTS" : "rejects"}`,
	);
}
const c2 = meterAccepts === 0;
console.log(
	`C2: declared-meter accepts ${meterAccepts}/3 (gate: 0) → ${c2 ? "PASS" : "FAIL"}; the bench's declared-lag rule accepts ${lagAccepts}/3 (reported: the mirror the two anecdotes could not show)`,
);

// ---- C3: the ×3 rung's exposure ----
console.log("\nC3 — the ×3 rung (rows at 3×, 3×±4 of a correct detection):");
let nonTripleAccepts = 0;
let tripleExact = 0;
let tripleTotal = 0;
let offTolAccepts = 0;
for (const r of run.arm3 as {
	itemId: string;
	meter: string;
	triple: boolean;
	detected: number;
	rows: { declared: number; accept: boolean }[];
}[]) {
	for (const [i, row] of r.rows.entries()) {
		if (!r.triple && row.accept) {
			nonTripleAccepts++;
			console.log(`  LEAK: ${r.itemId} (${r.meter}) accepted ${row.declared}`);
		}
		if (r.triple && i === 0) {
			tripleTotal++;
			if (row.accept) tripleExact++;
		}
		if (i > 0 && row.accept) {
			offTolAccepts++;
			console.log(`  OFF-TOLERANCE ACCEPT: ${r.itemId} ${row.declared} vs ${r.detected}`);
		}
	}
}
const c3 = nonTripleAccepts === 0 && offTolAccepts === 0;
console.log(
	`C3: non-triple leaks ${nonTripleAccepts} (gate: 0); off-tolerance accepts ${offTolAccepts} (gate: 0); exact-3× accepted on ${tripleExact}/${tripleTotal} triple-declared items (the ×2-class ambiguity, reported — the rung-picker's subject) → ${c3 ? "PASS" : "FAIL"}`,
);

console.log(`\nVERDICT: C1 ${c1 ? "PASS" : "FAIL"}, C2 ${c2 ? "PASS" : "FAIL"}, C3 ${c3 ? "PASS" : "FAIL"}`);
