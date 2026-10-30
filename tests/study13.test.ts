import { describe, expect, test } from "bun:test";
import {
	chordRight,
	fixesAndBreaks,
	gradeBars,
	parseReconciled,
	RECONCILE_SYSTEM,
	reconcileQuestion,
} from "../src/study13/grading13.js";

describe("chordRight (the registered real-recording grade)", () => {
	test("sameChord equivalence, either chord of a two-chord bar", () => {
		expect(chordRight("F#5", ["F#5", "Esus4"])).toBe(true);
		expect(chordRight("Esus4", ["F#5", "Esus4"])).toBe(true);
		expect(chordRight("B5", ["F#5", "Esus4"])).toBe(false);
	});
	test("the power-chord allowance: X5 truth accepts X, Xm and X5 — same root only", () => {
		expect(chordRight("F#", ["F#5"])).toBe(true);
		expect(chordRight("F#m", ["F#5"])).toBe(true);
		expect(chordRight("F#7", ["F#5"])).toBe(false);
		expect(chordRight("E", ["F#5"])).toBe(false);
		// the allowance never runs the other way: a full-triad truth is not met by a power chord
		expect(chordRight("C5", ["C"])).toBe(false);
	});
	test("rest bars want N.C.", () => {
		expect(chordRight("N.C.", [""])).toBe(true);
		expect(chordRight("Am", [""])).toBe(false);
	});
});

describe("gradeBars and fixesAndBreaks", () => {
	const truth = [["C"], ["F", "G"], ["Am"], [""]];
	test("counts right, strict-first and the power allowance", () => {
		const g = gradeBars(["C", "G", "Am", "N.C."], truth);
		expect(g.right).toBe(4);
		expect(g.strictFirstRight).toBe(3); // bar 2 strict wants F
		expect(g.powerAllowance).toBe(0);
	});
	test("a wrong bar changed to another wrong chord is neither fix nor break", () => {
		const d = fixesAndBreaks(["C", "C", "C", "N.C."], ["C", "F", "E", "N.C."], truth);
		expect(d.fixes).toBe(1); // bar 2 wrong→right
		expect(d.breaks).toBe(0); // bar 3 wrong→wrong
		expect(d.changed).toBe(2);
	});
	test("fixes and breaks counted separately", () => {
		const d = fixesAndBreaks(["C", "C", "Am", "N.C."], ["C", "F", "E", "N.C."], truth);
		expect(d.fixes).toBe(1);
		expect(d.breaks).toBe(1);
		expect(d.changed).toBe(2);
	});
});

describe("the reconciler prompt and parser (pinned)", () => {
	test("system anchors", () => {
		expect(RECONCILE_SYSTEM).toContain("careful music copyist");
		expect(RECONCILE_SYSTEM).toContain('answer "N.C." for that bar; never invent harmony');
		expect(RECONCILE_SYSTEM).toContain('{"chords": ["...", one entry per bar in order]}');
	});
	test("question carries key, grid and per-bar evidence", () => {
		const q = reconcileQuestion("F# major", "4/4", 132, ["F#5", "B5"], [{ bar: 1, notes: "F#2 C#3" }]);
		expect(q).toContain("key F# major, 4/4, 132 bpm, 2 bars");
		expect(q).toContain("Bar 1: detected F#5; notes: F#2 C#3");
		expect(q).toContain("Bar 2: detected B5; notes: (none)");
	});
	test("parser enforces the bar count", () => {
		expect(parseReconciled('{"chords": ["C", "F"]}', 2).chords).toEqual(["C", "F"]);
		expect(parseReconciled('{"chords": ["C"]}', 2).error).toContain("expected 2");
		expect(parseReconciled("no json", 2).error).toBe("no JSON in the answer");
	});
});
