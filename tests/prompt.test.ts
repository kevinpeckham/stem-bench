import { describe, expect, test } from "bun:test";
import { hintSegments, question, system, toSegments, type FixtureSong } from "../src/harness/prompt.js";

const song: FixtureSong = {
	id: "t",
	title: "Test Song",
	key: "D major",
	bpm: 120,
	truth: ["D", "D", "A", "N.C."],
	barNotes: [
		{ bar: 1, notes: "D2×1.6@0.8" },
		{ bar: 2, notes: "D2×1.6@0.8" },
		{ bar: 3, notes: "A2×1.6@0.8" },
		{ bar: 4, notes: "(silence)" },
	],
	matcherSegments: [
		{ bar: 1, bars: 2, chord: "D" },
		{ bar: 3, bars: 1, chord: "A7" },
		{ bar: 4, bars: 1, chord: "N.C." },
	],
	matcherPerBar: ["D", "D", "A7", "N.C."],
};

describe("system (production text, pinned)", () => {
	test("every arm but A-none carries the matcher sentence", () => {
		const sentence = "A simple template matcher's guess follows each bar in brackets";
		expect(system("A-none")).not.toContain(sentence);
		for (const arm of ["A-matcher", "A-correct", "A-wrong"] as const) {
			expect(system(arm)).toContain(sentence);
		}
	});
	test("arms differ in nothing else", () => {
		const none = system("A-none");
		const withHint = system("A-matcher").replace(
			" A simple template matcher's guess follows each bar in brackets — a hint, not an answer.",
			"",
		);
		expect(withHint).toBe(none);
	});
	test("the production anchor phrases are verbatim", () => {
		const s = system("A-matcher");
		expect(s).toContain("You are a music director preparing a chord chart");
		expect(s).toContain("pitch+octave×seconds sounding@loudness 0..1");
		expect(s).toContain('"%" for a bar that repeats the previous chord and "N.C." for silence');
		expect(s).toContain("Reply with JSON only");
	});
});

describe("hints per arm", () => {
	test("A-none renders no brackets", () => {
		expect(question(song, "A-none")).not.toContain("[matcher:");
	});
	test("A-matcher renders the matcher's segments as production does", () => {
		const q = question(song, "A-matcher");
		expect(q).toContain("bar 1 [matcher: D]:");
		expect(q).toContain("bar 2 [matcher: %]:");
		expect(q).toContain("bar 3 [matcher: A7]:");
		expect(q).toContain("bar 4 [matcher: N.C.]:");
	});
	test("A-correct hints are the truth", () => {
		const q = question(song, "A-correct");
		expect(q).toContain("bar 1 [matcher: D]:");
		expect(q).toContain("bar 2 [matcher: %]:");
		expect(q).toContain("bar 3 [matcher: A]:");
	});
	test("A-wrong hints are the registered transform", () => {
		const q = question(song, "A-wrong");
		expect(q).toContain("bar 1 [matcher: G]:");
		expect(q).toContain("bar 3 [matcher: D]:");
		expect(q).toContain("bar 4 [matcher: N.C.]:");
	});
	test("toSegments merges equal neighbors", () => {
		expect(hintSegments(song, "A-correct").map((s) => [s.bar, s.bars, s.chord])).toEqual([
			[1, 2, "D"],
			[3, 1, "A"],
			[4, 1, "N.C."],
		]);
		expect(toSegments(["D", "D", "D"])).toHaveLength(1);
	});
});

describe("question (production shape, pinned)", () => {
	test("facts line and the no-examples branch", () => {
		const q = question(song, "A-none");
		expect(q.startsWith('SONG: "Test Song", 120 bpm, D major, 4/4\nNOTES PER BAR:\n')).toBe(true);
		expect(q.endsWith("No example charts yet; use clear markdown with a heading per section.")).toBe(
			true,
		);
	});
});
