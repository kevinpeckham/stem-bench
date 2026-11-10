import { describe, expect, test } from "bun:test";
import { chordAtBars, chordSequence, harteToSymbol } from "../src/study38/truth.js";

describe("study 38 truth adapters", () => {
	test("harteToSymbol maps shorthands, accidentals, bass degrees and no-chord", () => {
		expect(harteToSymbol("G:maj")).toBe("G");
		expect(harteToSymbol("A:min7")).toBe("Am7");
		expect(harteToSymbol("Bb:maj7")).toBe("Bbmaj7");
		expect(harteToSymbol("F#:min")).toBe("F#m");
		expect(harteToSymbol("Db:7")).toBe("C#7");
		expect(harteToSymbol("D:7/3")).toBe("D7/F#");
		expect(harteToSymbol("E:min/b3")).toBe("Em/G");
		expect(harteToSymbol("C")).toBe("C");
		expect(harteToSymbol("B:hdim7")).toBe("Bm7b5");
		expect(harteToSymbol("N")).toBe("N.C.");
		expect(harteToSymbol("X")).toBe("N.C.");
		expect(harteToSymbol("G:maj(9)")).toBe("G");
	});

	test("chordSequence drops no-chord, merges identical neighbours and respects a window", () => {
		const timed = [
			{ start: 0, end: 1, label: "N" },
			{ start: 1, end: 3, label: "C:maj" },
			{ start: 3, end: 5, label: "C:maj" },
			{ start: 5, end: 7, label: "G:maj" },
			{ start: 7, end: 9, label: "A:min" },
			{ start: 9, end: 11, label: "F:maj" },
		];
		expect(chordSequence(timed)).toEqual(["C", "G", "Am", "F"]);
		expect(chordSequence(timed, 4, 8)).toEqual(["C", "G", "Am"]);
	});

	test("chordAtBars reads the chord sounding at each bar start", () => {
		const timed = [
			{ start: 0, end: 2, label: "C:maj" },
			{ start: 2, end: 4, label: "G:maj" },
			{ start: 4, end: 6, label: "N" },
		];
		expect(chordAtBars(timed, [0, 2, 4, 6])).toEqual(["C", "G", "N.C.", "N.C."]);
	});
});
