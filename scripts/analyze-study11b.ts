/**
 * Study 11b analyzer (docs/BRIEF-STUDY11B.md): gate verdicts and the
 * margin distributions over results/study11b.json. No re-thresholding.
 */
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const run = JSON.parse(readFileSync(`${root}results/study11b.json`, "utf8"));
type Read = (typeof run.reads)[number];
const reads = run.reads as Read[];

const compound = reads.filter((r) => r.meterTruth === "6/8");
const swingStress = reads.filter((r) => r.source === "swing");
const swingHard = reads.filter((r) => r.class === "hard-swing");
const straight = reads.filter(
	(r) => r.meterTruth !== "6/8" && r.source !== "swing" && r.class !== "hard-swing",
);

// ---- V1: compound heard ----
console.log("V1 — the shipped detector on the 4 compound items (6/8 + dotted tempo ±1):");
let v1 = 0;
for (const r of compound) {
	const dotted = Math.abs(r.nw.bpm - r.trueTempos[0]!) <= 1;
	const ok = r.nw.subdivision === 3 && r.nw.meter === "6/8" && dotted;
	v1 += ok ? 1 : 0;
	console.log(
		`  ${r.itemId.padEnd(14)} truth ${r.trueTempos[0]} 6/8 | new ${r.nw.bpm} sub ${r.nw.subdivision} ${r.nw.meter} ${ok ? "✓" : "✗"} | true rung ${r.trueRungInAlternates ? `on ladder f=${r.trueRungInAlternates.factor.toFixed(2)} strength ${r.trueRungInAlternates.strength}` : "ABSENT"}`,
	);
}
console.log(`V1 (gate ≥ 3/4): ${v1}/4 → ${v1 >= 3 ? "PASS" : "FAIL"}`);
const saved = compound.filter((r) => r.trueRungInAlternates).length;
console.log(`  Reported: the true dotted tempo is on the shipped ladder (alternates) for ${saved}/4 — the rung-picker's save when the 6/8 call misses.`);

// ---- V2: no regressions ----
console.log("\nV2 — no new misses, no false compound on straight or real items:");
let newMiss = 0;
let falseCompound = 0;
for (const r of [...straight, ...swingHard]) {
	const newExact = r.trueTempos.some((t: number) => Math.abs(r.nw.bpm - t) <= 1);
	if (r.oldExact && !newExact) {
		newMiss++;
		console.log(`  NEW MISS: ${r.itemId} old ${r.oldDetected} new ${r.nw.bpm} (truth ${r.trueTempos.join("/")})`);
	}
	if (r.nw.subdivision === 3) {
		falseCompound++;
		console.log(`  FALSE COMPOUND: ${r.itemId} (${r.class}, swing ${r.swing ?? "—"}) read sub 3 / ${r.nw.meter}`);
	}
}
const mmkk = reads.filter((r) => r.source === "mmkk");
for (const r of mmkk) {
	if (r.nw.subdivision === 3) {
		falseCompound++;
		console.log(`  FALSE COMPOUND (real): ${r.itemId} read sub 3 / ${r.nw.meter} (declared ${r.meterTruth})`);
	}
	console.log(
		`  mmkk ${r.itemId.padEnd(20)} declared ${r.trueTempos.join("/")} ${r.meterTruth} | old ${r.oldDetected} new ${r.nw.bpm} sub ${r.nw.subdivision} | ladder vs declared ${r.gatedMatch ? `f=${r.gatedMatch.factor.toFixed(2)}` : "✗"}`,
	);
}
const v2 = newMiss === 0 && falseCompound === 0;
console.log(`V2 (gate: 0 new misses, 0 false compound incl. real): ${newMiss} new misses, ${falseCompound} false compound → ${v2 ? "PASS" : "FAIL"}`);

// ---- V3: swing stress ----
console.log("\nV3 — the swing-stress set (15 items, truth straight 4/4):");
let v3Fails = 0;
for (const r of swingStress) {
	const bad = r.nw.subdivision === 3;
	if (bad) v3Fails++;
	const exact = Math.abs(r.nw.bpm - r.trueTempos[0]!) <= 1;
	console.log(
		`  ${r.itemId.padEnd(22)} swing ${r.swing} | new ${r.nw.bpm} ${exact ? "✓" : "✗"} sub ${r.nw.subdivision}${bad ? " ← FALSE 6/8" : ""}`,
	);
}
console.log(`V3 (gate: 0/15 read compound): ${v3Fails} false → ${v3Fails === 0 ? "PASS" : "FAIL"}`);

// ---- V4: the shipped ladder on the corrected wrong set ----
console.log("\nV4 — shipped tempoLadderMatch, lesson-6-corrected wrong set:");
let rows = 0;
let accepts = 0;
for (const r of reads) {
	for (const w of r.wrongRows) {
		rows++;
		if (w.accept) {
			accepts++;
			console.log(`  FALSE ACCEPT: ${r.itemId} declared ${w.declared} (×${w.multiplier}) vs new ${r.nw.bpm} (sub ${r.nw.subdivision})`);
		}
	}
}
const declaredMatched = reads.filter((r) => r.source !== "swing" && r.gatedMatch).length;
const declaredTotal = reads.filter((r) => r.source !== "swing").length;
console.log(
	`V4 (gate: 0 false accepts): ${accepts}/${rows} → ${accepts === 0 ? "PASS" : "FAIL"}; declared-vs-detected matches on ${declaredMatched}/${declaredTotal} corpus items (the misses are the items whose detection is off the declared grid)`,
);

console.log(
	`\nVERDICT: V1 ${v1 >= 3 ? "PASS" : "FAIL"}, V2 ${v2 ? "PASS" : "FAIL"}, V3 ${v3Fails === 0 ? "PASS" : "FAIL"}, V4 ${accepts === 0 ? "PASS" : "FAIL"}`,
);
