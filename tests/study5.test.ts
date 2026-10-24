import { describe, expect, test } from "bun:test";
import {
	classify,
	matchesReader,
	readerFacts,
	readerRight,
} from "../src/grading/propagation.js";
import { leadSheetMeasures } from "../src/study5/leadsheet.js";
import type { MixSpec } from "../src/study4/synth4.js";
import fixture from "../corpus/fixture5.json";

const truth = {
	tempo: 110,
	meter: "4/4" as const,
	key: "F major",
	tempoChanges: [],
	keyChanges: [{ at: 17.4, key: "G major" }],
	durationSec: 36,
};
const answer = (over: object) => ({
	tempo: 110,
	tempoChanges: [],
	meter: "4/4",
	key: "F major",
	keyChanges: [{ at: 17, key: "G major" }],
	confidence: 0.9,
	notes: "",
	...over,
});

describe("readerFacts", () => {
	const facts = readerFacts(
		'Title: X\nPart: Y\nm1 key F major 4/4 tempo 110 "110 bpm": F\nm9 key G major: G\nm12: C',
	);
	test("first facts and change facts split at measure 1", () => {
		expect(facts.key).toBe("F major");
		expect(facts.meter).toBe("4/4");
		expect(facts.tempo).toBe(110);
		expect(facts.changeKeys).toEqual(["G major"]);
		expect(facts.changeTempos).toEqual([]);
	});
	test("readerRight across fields", () => {
		expect(readerRight(facts, truth, "key")).toBe(true);
		expect(readerRight(facts, truth, "keyChange")).toBe(true);
		expect(readerRight(facts, truth, "tempoChange")).toBeNull();
		const wrong = readerFacts("m1 key D major 3/4 tempo 80: D");
		expect(readerRight(wrong, truth, "key")).toBe(false);
		expect(readerRight(wrong, truth, "meter")).toBe(false);
	});
});

describe("classify", () => {
	const rightFacts = readerFacts('m1 key F major 4/4 tempo 110: F\nm9 key G major: G');
	const wrongFacts = readerFacts('m1 key D major 4/4 tempo 110: D\nm9 key A major: A');
	test("pass and listener-added when the reader is right", () => {
		expect(classify(rightFacts, answer({}), truth, "key")).toBe("pass");
		expect(classify(rightFacts, answer({ key: "B minor" }), truth, "key")).toBe("listener-added");
	});
	test("propagated when the listener repeats the reader's wrong fact", () => {
		expect(classify(wrongFacts, answer({ key: "D major" }), truth, "key")).toBe("propagated");
		expect(
			classify(wrongFacts, answer({ keyChanges: [{ at: 17, key: "A major" }] }), truth, "keyChange"),
		).toBe("propagated");
	});
	test("rescued and mutated", () => {
		expect(classify(wrongFacts, answer({}), truth, "key")).toBe("rescued");
		expect(classify(wrongFacts, answer({ key: "E minor" }), truth, "key")).toBe("mutated");
	});
	test("matchesReader tolerances", () => {
		expect(matchesReader(answer({ tempo: 82 }), readerFacts("m1 key F major 4/4 tempo 80: F"), "tempo")).toBe(
			true,
		);
	});
});

describe("the committed fixture", () => {
	test("12 metered items, truth summaries non-empty, artifacts present", () => {
		expect(fixture.items).toHaveLength(12);
		for (const i of fixture.items) {
			expect(i.truthSummary).toContain("m1 key");
			expect(i.png.length).toBeGreaterThan(0);
			expect(i.pdf).toContain(i.id);
		}
	});
	test("leadSheetMeasures marks section changes", () => {
		const spec: MixSpec = {
			id: "t",
			title: "T",
			meter: "4/4",
			sections: [
				{ bpm: 100, key: "C major", bars: ["C", "F"] },
				{ bpm: 140, key: "D major", bars: ["D", "G"] },
			],
		};
		const measures = leadSheetMeasures(spec);
		expect(measures).toHaveLength(4);
		expect(measures[0]!.key).toBeDefined();
		expect(measures[2]!.key).toBeDefined();
		expect(measures[2]!.tempo).toBe(140);
		expect(measures[1]!.key).toBeUndefined();
	});
});
