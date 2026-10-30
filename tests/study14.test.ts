import { describe, expect, test } from "bun:test";
import { RECONCILE_SYSTEM, reconcileQuestion } from "../src/study13/grading13.js";
import { ALIGNMENT_SAME_PIECE_RATIO } from "../src/study14/constants.js";
import { chartBars } from "../src/study14/chartBars.js";
import { chordChartBars } from "../src/study14/chordChartBars.js";
import { parseReconciledChords } from "../src/study14/parseReconciledChords.js";
import { reconcileChordsMessage } from "../src/study14/reconcileChordsMessage.js";

describe("the 39c25b5 / 5b2288f8 ports, pinned", () => {
	test("the shipped constant is the provisional 3", () => {
		expect(ALIGNMENT_SAME_PIECE_RATIO).toBe(3);
	});
	test("chordChartBars reads the band conventions", () => {
		const md = "key: F#maj 4/4 132 bpm\n\n## Intro\n| F#5 Esus4 | F#5 Esus4 |\n\n## Verse\n| B5 | N.C. |";
		const parsed = chordChartBars(md, { tempo: null, meter: null })!;
		expect(parsed.bars).toHaveLength(4);
		expect(parsed.bars[0]!.chords).toEqual(["F#5", "Esus4"]);
		expect(parsed.bars[0]!.section).toBe("Intro");
		expect(parsed.bars[2]!.section).toBe("Verse");
		expect(parsed.bars[3]!.chords).toEqual(["N.C."]);
		expect(parsed.bars[0]!.bpm).toBe(132);
	});
	test("chartBars reads the measure-summary form", () => {
		const summary = 'm1 key D major 4/4 tempo 120 [A]: D\nm2: G\nm3: A\nm4: D';
		const parsed = chartBars(summary, { tempo: null, meter: null })!;
		expect(parsed.bars).toHaveLength(4);
		expect(parsed.bars[0]!.bpm).toBe(120);
		expect(parsed.bars[0]!.meter).toBe("4/4");
		expect(parsed.bars[0]!.section).toBe("A");
	});
	test("their message builder matches the bench's registered form on the shared fields", () => {
		const theirs = reconcileChordsMessage({
			key: "F# major",
			meter: "4/4",
			tempo: "132",
			chords: ["F#5", "B5"],
			bars: [{ notes: "F#2 C#3" }, { notes: "" }],
		});
		const ours = reconcileQuestion("F# major", "4/4", 132, ["F#5", "B5"], [{ bar: 1, notes: "F#2 C#3" }]);
		expect(theirs).toContain("Bar 1: detected F#5; notes: F#2 C#3");
		expect(theirs).toContain("Bar 2: detected B5; notes: (none)");
		expect(theirs).toContain("Return the corrected chord for every bar, in order.");
		for (const line of theirs.split("\n").slice(1)) expect(ours).toContain(line);
		expect(reconcileChordsMessage({ key: null, meter: null, tempo: null, chords: ["C"], bars: [{ notes: "" }] })).toContain("key unknown");
	});
	test("their parser enforces the bar count like the bench's", () => {
		expect(parseReconciledChords('{"chords": ["C", "F"]}', 2).chords).toEqual(["C", "F"]);
		expect(parseReconciledChords('{"chords": ["C"]}', 2).chords).toBeNull();
	});
	test("the registered system prompt is unchanged (their aiDetect uses it verbatim)", () => {
		expect(RECONCILE_SYSTEM).toContain("careful music copyist");
	});
});
