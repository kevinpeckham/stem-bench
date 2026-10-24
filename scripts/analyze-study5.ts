/**
 * Study 5 analysis (docs/BRIEF-STUDY5.md): reader error rates per arm,
 * composed-chain listener accuracy vs the frozen truth-summary ceiling
 * (Study 4's L-chart cells), the S5-G1 gate (listener-added errors ≤ 2
 * per arm), and the propagation classification per field.
 */
import { readFileSync } from "node:fs";
import fixture from "../corpus/fixture5.json";
import {
	classify,
	listenerRight,
	readerFacts,
	readerRight,
	type Field,
	type PropClass,
} from "../src/grading/propagation.js";
import type { Cell3Record } from "../src/study3/runner.js";
import type { Cell4Record, FixtureMix } from "../src/study4/runner4.js";

interface Item5 {
	id: string;
	truth: FixtureMix["truth"];
	truthSummary: string;
}
const items = fixture.items as Item5[];
const dir = new URL("../results/", import.meta.url).pathname;
const readers: Cell3Record[] = JSON.parse(readFileSync(`${dir}study5-reader.json`, "utf8"));
const listeners: Cell4Record[] = JSON.parse(readFileSync(`${dir}study5-listener.json`, "utf8"));
const ceiling: Cell4Record[] = JSON.parse(
	readFileSync(`${dir}study4-google_gemini-3-flash.json`, "utf8"),
).filter((r: Cell4Record) => r.arm === "L-chart");

const FIELDS: Field[] = ["tempo", "meter", "key", "tempoChange", "keyChange"];
const ARMS = [
	{ arm: "C5-png", readerArm: "D-image" },
	{ arm: "C5-pdf", readerArm: "D-pdf" },
] as const;

for (const { arm, readerArm } of ARMS) {
	console.log(`\n=== ${arm} (reader: fable ${readerArm}) ===`);
	const counts: Record<PropClass, number> = {
		pass: 0,
		"listener-added": 0,
		propagated: 0,
		rescued: 0,
		mutated: 0,
	};
	let readerWrong = 0;
	let readerFields = 0;
	let listenerWrong = 0;
	for (const item of items) {
		const reader = readers.find(
			(r) => r.itemId === item.id && r.arm === readerArm && r.outcome === "answered",
		);
		const listener = listeners.find(
			(r) => r.itemId === item.id && r.arm === (arm as string) && r.outcome === "answered",
		);
		if (!reader || !listener?.answer) continue;
		const facts = readerFacts(reader.text);
		for (const field of FIELDS) {
			const rr = readerRight(facts, item.truth, field);
			if (rr !== null) {
				readerFields++;
				if (!rr) readerWrong++;
			}
			const lr = listenerRight(listener.answer, item.truth, field);
			if (lr === false) listenerWrong++;
			const cls = classify(facts, listener.answer, item.truth, field);
			if (cls) counts[cls]++;
		}
	}
	console.log(
		`reader wrong facts: ${readerWrong}/${readerFields}; listener wrong fields: ${listenerWrong}`,
	);
	console.log(
		`propagation: pass ${counts.pass}, listener-added ${counts["listener-added"]}, propagated ${counts.propagated}, rescued ${counts.rescued}, mutated ${counts.mutated}`,
	);
	console.log(
		`S5-G1 (listener-added ≤ 2): ${counts["listener-added"]} → ${counts["listener-added"] <= 2 ? "PASS" : "FAIL"}`,
	);
}

console.log("\nCeiling (Study 4 frozen L-chart, truth summaries): listener wrong fields:");
{
	let wrong = 0;
	for (const item of items) {
		const cell = ceiling.find((r) => r.itemId === item.id && r.answer);
		if (!cell?.answer) continue;
		for (const field of FIELDS) {
			if (listenerRight(cell.answer, item.truth, field) === false) wrong++;
		}
	}
	console.log(`  ${wrong} (the composed arms' listener-added counts compare to this)`);
}

console.log("\nPer-item anatomy (reader-wrong facts and what the listener did):");
for (const { arm, readerArm } of ARMS) {
	for (const item of items) {
		const reader = readers.find(
			(r) => r.itemId === item.id && r.arm === readerArm && r.outcome === "answered",
		);
		const listener = listeners.find(
			(r) => r.itemId === item.id && r.arm === (arm as string) && r.outcome === "answered",
		);
		if (!reader || !listener?.answer) continue;
		const facts = readerFacts(reader.text);
		for (const field of FIELDS) {
			const cls = classify(facts, listener.answer, item.truth, field);
			if (cls && cls !== "pass") {
				console.log(
					`  ${arm} ${item.id} ${field}: ${cls} (reader ${JSON.stringify(field === "key" ? facts.key : field === "meter" ? facts.meter : field === "tempo" ? facts.tempo : field === "keyChange" ? facts.changeKeys : facts.changeTempos)}, listener ${JSON.stringify(field === "key" ? listener.answer.key : field === "meter" ? listener.answer.meter : field === "tempo" ? listener.answer.tempo : field === "keyChange" ? listener.answer.keyChanges : listener.answer.tempoChanges)}, truth ${JSON.stringify(field === "key" ? item.truth.key : field === "meter" ? item.truth.meter : field === "tempo" ? item.truth.tempo : field === "keyChange" ? item.truth.keyChanges : item.truth.tempoChanges)})`,
				);
			}
		}
	}
}

console.log("\nCost:");
const tin = [...readers, ...listeners].reduce((a, r) => a + r.tokensIn, 0);
const tout = [...readers, ...listeners].reduce((a, r) => a + r.tokensOut, 0);
console.log(`  reader+listener tokens: ${tin} in / ${tout} out`);
