/**
 * Study 11 analyzer (docs/BRIEF-STUDY11.md): the registered tables and
 * gate verdicts over results/study11.json. Nothing here re-thresholds.
 */
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const run = JSON.parse(readFileSync(`${root}results/study11.json`, "utf8"));
type Item = (typeof run.items)[number];
const items = run.items as Item[];

// ---- G1: the six known octave-family misses ----
const MISSES = ["lilt-a", "lilt-b", "contrast-c", "verb-y", "mop-heart", "peaceful-dreams"];
console.log("G1 — D-prod's six octave-family misses under the ladder:");
let recovered = 0;
let peacefulAccepted = false;
for (const id of MISSES) {
	const it = items.find((x) => x.itemId === id);
	if (!it) {
		console.log(`  ${id}: MISSING from results`);
		continue;
	}
	const correctRung = it.gated.match && it.gated.rung !== 1;
	if (id === "peaceful-dreams") peacefulAccepted = it.gated.match;
	else if (correctRung) recovered++;
	console.log(
		`  ${id.padEnd(18)} truth ${it.trueTempos.join("/")} det ${it.detected} | sub@slower ${it.subAtSlowerOfPair.subdivision} (r3 ${it.subAtSlowerOfPair.r3.toFixed(2)}) | L-gated ${it.gated.match ? `matches at r=${it.gated.rung?.toFixed(2)}` : "mismatch"} | L-open ${it.open.match ? `r=${it.open.rung?.toFixed(2)}` : "mismatch"}`,
	);
}
const g1 = recovered >= 4 && !peacefulAccepted;
console.log(
	`G1: ${recovered}/5 count-class misses recovered at a non-unit rung; peaceful-dreams (a true hearing error) ${peacefulAccepted ? "WRONGLY accepted" : "correctly NOT accepted"} → ${g1 ? "PASS" : "FAIL"}`,
);

// ---- G2: false accepts on the wrong-tempo set ----
console.log("\nG2 — wrong-tempo set (declared = truth × m vs the stored detection):");
const byMult = new Map<number, { gated: number; open: number; n: number }>();
let gatedTotal = 0;
let openTotal = 0;
let rows = 0;
let gated15 = 0;
let open15 = 0;
let n15 = 0;
for (const it of items) {
	for (const r of it.wrongRows) {
		const slot = byMult.get(r.multiplier) ?? { gated: 0, open: 0, n: 0 };
		slot.gated += r.gatedAccept ? 1 : 0;
		slot.open += r.openAccept ? 1 : 0;
		slot.n++;
		byMult.set(r.multiplier, slot);
		gatedTotal += r.gatedAccept ? 1 : 0;
		openTotal += r.openAccept ? 1 : 0;
		rows++;
		if (r.multiplier === 1.5 && it.meterTruth !== "6/8") {
			gated15 += r.gatedAccept ? 1 : 0;
			open15 += r.openAccept ? 1 : 0;
			n15++;
		}
	}
}
for (const [m, s] of [...byMult.entries()].sort((a, b) => a[0] - b[0])) {
	console.log(`  ×${m}: L-gated ${s.gated}/${s.n}, L-open ${s.open}/${s.n}`);
}
const g2 = gated15 === 0;
console.log(
	`G2: 1.5× straight-meter rows — L-gated accepts ${gated15}/${n15} (gate: 0), L-open accepts ${open15}/${n15} (reported; the cost of ungated 3:2 rungs) → ${g2 ? "PASS" : "FAIL"}; all rows: gated ${gatedTotal}/${rows}, open ${openTotal}/${rows}`,
);

// ---- G3: the subdivision test at the true tempo ----
console.log("\nG3 — S-sub at the item's true tempo:");
const compound = items.filter((i) => i.meterTruth === "6/8");
const swing = items.filter((i) => i.class === "hard-swing");
const straight = items.filter((i) => i.meterTruth !== "6/8" && i.class !== "hard-swing");
const comp3 = compound.filter((i) => i.subAtTrue.subdivision === 3).length;
const straightWrong = straight.filter((i) => i.subAtTrue.subdivision === 3);
for (const i of compound) {
	console.log(`  compound ${i.itemId.padEnd(18)} sub ${i.subAtTrue.subdivision} (r3 ${i.subAtTrue.r3.toFixed(2)}, rBeat ${i.subAtTrue.rBeat.toFixed(2)})`);
}
for (const i of swing) {
	console.log(`  swing    ${i.itemId.padEnd(18)} sub ${i.subAtTrue.subdivision} (r3 ${i.subAtTrue.r3.toFixed(2)}) — reported apart`);
}
for (const i of straightWrong) {
	console.log(`  STRAIGHT MISREAD ${i.itemId}: sub 3 (r3 ${i.subAtTrue.r3.toFixed(2)})`);
}
const g3 = comp3 >= 3 && straightWrong.length === 0;
console.log(
	`G3: compound ${comp3}/${compound.length} read 3; straight (excl. swing pair) ${straight.length - straightWrong.length}/${straight.length} read 2; swing reads: ${swing.map((i) => i.subAtTrue.subdivision).join(",")} → ${g3 ? "PASS" : "FAIL"}`,
);

// ---- Derived meter ----
const meterRight = items.filter((i) => {
	const derived = i.subAtTrue.subdivision === 3 ? "6/8" : null;
	return derived === "6/8" ? i.meterTruth === "6/8" : true;
}).length;
const sixEightGain = compound.filter((i) => i.subAtTrue.subdivision === 3).length;
console.log(
	`\nDerived meter: ${sixEightGain}/${compound.length} 6/8 items now expressible (today's vote cannot say 6/8); straight items mislabeled 6/8: ${items.length - meterRight} (the swing caveat applies to ${swing.filter((i) => i.subAtTrue.subdivision === 3).length} swing item(s))`,
);

// ---- G4: no true disagreement silenced ----
console.log("\nG4 — the dry-run against production's 2 % rule:");
let silenced = 0;
let fired = 0;
for (const it of items) {
	for (const r of it.wrongRows) {
		if (r.multiplier === 1.5) continue; // the 3:2 class is G2's subject
		if (r.currentRuleFires) {
			fired++;
			if (r.gatedAccept) {
				silenced++;
				console.log(`  SILENCED: ${it.itemId} declared ${r.declared} (×${r.multiplier}) vs detected ${it.detected}`);
			}
		}
	}
}
const study7OnRung = (run.study7Rows as { onRung: boolean }[]).filter((r) => r.onRung).length;
const g4 = silenced === 0;
console.log(
	`G4: of ${fired} non-3:2 wrong rows the current rule flags, the ladder silences ${silenced} → ${g4 ? "PASS" : "FAIL"}`,
);
console.log(
	`  Context (reported, not gated): ${study7OnRung}/${run.study7Rows.length} of Study 7's registered wrong settings sit on the always-accepted rungs (×2/÷2 by construction) — the ladder reads those as "same grid, counted differently," which is the tradeoff the rung-picker UI answers.`,
);

console.log(
	`\nVERDICT: G1 ${g1 ? "PASS" : "FAIL"}, G2 ${g2 ? "PASS" : "FAIL"}, G3 ${g3 ? "PASS" : "FAIL"}, G4 ${g4 ? "PASS" : "FAIL"} → ${g1 && g2 && g3 && g4 ? "all four pass: the build list ships" : "see the brief's decision rule"}`,
);
