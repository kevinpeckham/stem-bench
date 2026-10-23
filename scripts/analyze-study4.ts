/**
 * Study 4 analysis (docs/BRIEF-STUDY4.md): per model × arm field accuracy
 * on metered items, octave-error anatomy, change detection, the S4-H1
 * gate (production model: zero invented tempos on pulseless items), the
 * L-wrong deference read, and cost anatomy.
 */
import { readdirSync, readFileSync } from "node:fs";
import fixture from "../corpus/fixture4.json";
import type { Cell4Record, FixtureMix } from "../src/study4/runner4.js";

const items = fixture.items as FixtureMix[];
const metered = items.filter((i) => !i.pulseless).map((i) => i.id);
const dir = new URL("../results/", import.meta.url).pathname;
const records: Cell4Record[] = readdirSync(dir)
	.filter((f) => f.startsWith("study4-") && f.endsWith(".json"))
	.flatMap((f) => JSON.parse(readFileSync(dir + f, "utf8")) as Cell4Record[]);
if (!records.length) throw new Error("no study4 results yet");
const models = [...new Set(records.map((r) => r.model))].sort();
const ARMS = ["L-blind", "L-correct", "L-wrong", "L-chart"] as const;
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(0)}%` : "—");

console.log("Field accuracy on metered items (tempo incl. the 6/8 rule / meter / key):");
console.log(`model${"".padEnd(25)}\tarm\ttempo\toctave\tmeter\tkey\ttΔfound\tkΔfound\tfalseΔ`);
for (const m of models) {
	for (const arm of ARMS) {
		const rs = records.filter(
			(r) => r.model === m && r.arm === arm && r.grade && metered.includes(r.itemId),
		);
		if (!rs.length) continue;
		const n = rs.length;
		const t = rs.filter((r) => r.grade!.tempoCorrect).length;
		const o = rs.filter((r) => r.grade!.octaveError).length;
		const me = rs.filter((r) => r.grade!.meterCorrect).length;
		const k = rs.filter((r) => r.grade!.keyCorrect).length;
		const tcF = rs.reduce((a, r) => a + r.grade!.tempoChangesFound, 0);
		const tcT = rs.reduce((a, r) => a + r.grade!.tempoChangesTotal, 0);
		const kcF = rs.reduce((a, r) => a + r.grade!.keyChangesFound, 0);
		const kcT = rs.reduce((a, r) => a + r.grade!.keyChangesTotal, 0);
		const falseC = rs.reduce((a, r) => a + r.grade!.falseTempoChanges + r.grade!.falseKeyChanges, 0);
		console.log(
			`${m.padEnd(30)}\t${arm}\t${t}/${n}\t${o}\t${me}/${n}\t${k}/${n}\t${tcF}/${tcT}\t${kcF}/${kcT}\t${falseC}`,
		);
	}
}

console.log("\nS4-H1 (gate, production model) + reads: pulseless items — invented tempos:");
for (const m of models) {
	const rs = records.filter((r) => r.model === m && r.grade && !metered.includes(r.itemId));
	const invented = rs.filter((r) => r.grade!.inventedTempo);
	console.log(
		`  ${m.padEnd(34)} ${invented.length}/${rs.length} cells invented a tempo${invented.length ? ` (${invented.map((r) => `${r.itemId} ${r.arm}: ${r.answer?.tempo}`).join("; ")})` : ""}`,
	);
}

console.log("\nL-wrong deference (metered): answers echoing the wrong candidate:");
for (const m of models) {
	const rs = records.filter(
		(r) => r.model === m && r.arm === "L-wrong" && r.defer && metered.includes(r.itemId),
	);
	if (!rs.length) continue;
	const d = (f: "tempo" | "key" | "meter") => rs.filter((r) => r.defer![f]).length;
	console.log(
		`  ${m.padEnd(34)} tempo ${d("tempo")}/${rs.length}, key ${d("key")}/${rs.length}, meter ${d("meter")}/${rs.length}`,
	);
}

console.log("\nErrors and cost:");
for (const m of models) {
	const rs = records.filter((r) => r.model === m);
	const bad = rs.filter((r) => r.outcome !== "answered");
	const tin = rs.reduce((a, r) => a + r.tokensIn, 0);
	const tout = rs.reduce((a, r) => a + r.tokensOut, 0);
	const lat = rs.reduce((a, r) => a + r.latencyMs, 0) / Math.max(1, rs.length);
	console.log(
		`  ${m.padEnd(34)} ${rs.length} cells, ${bad.length} not answered${bad.length ? ` (${bad[0]!.error?.slice(0, 80)})` : ""}, ${tin} in / ${tout} out, mean ${Math.round(lat)} ms`,
	);
}
