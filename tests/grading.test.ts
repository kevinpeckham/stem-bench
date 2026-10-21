import { describe, expect, test } from "bun:test";
import { expandChords, gradeChords } from "../src/grading/chart.js";
import { parseChord, sameChord, wrongHint } from "../src/grading/symbols.js";

describe("parseChord", () => {
	test("roots and qualities", () => {
		expect(parseChord("D")).toEqual({ pc: 2, quality: "", ok: true });
		expect(parseChord("Bm")).toEqual({ pc: 11, quality: "m", ok: true });
		expect(parseChord("F#7")).toEqual({ pc: 6, quality: "7", ok: true });
		expect(parseChord("Bbmaj7")).toEqual({ pc: 10, quality: "maj7", ok: true });
		expect(parseChord("E7sus4")).toEqual({ pc: 4, quality: "7sus4", ok: true });
		expect(parseChord("A5")).toEqual({ pc: 9, quality: "5", ok: true });
	});
	test("N.C. in its spellings", () => {
		for (const t of ["N.C.", "NC", "n.c."]) expect(parseChord(t).pc).toBeNull();
		expect(parseChord("N.C.").ok).toBe(true);
	});
	test("garbage does not parse", () => {
		expect(parseChord("%").ok).toBe(false);
		expect(parseChord("?").ok).toBe(false);
	});
});

describe("sameChord (the registered equivalence)", () => {
	test("enharmonics equal", () => {
		expect(sameChord("C#", "Db")).toBe(true);
		expect(sameChord("Eb", "D#")).toBe(true);
		expect(sameChord("F#m", "Gbm")).toBe(true);
	});
	test("unicode accidentals read", () => {
		expect(sameChord("B♭maj7", "Bbmaj7")).toBe(true);
		expect(sameChord("F♯7", "F#7")).toBe(true);
	});
	test("slash bass ignored", () => {
		expect(sameChord("G/B", "G")).toBe(true);
		expect(sameChord("D/F#", "D")).toBe(true);
	});
	test("quality aliases", () => {
		expect(sameChord("Dmin7", "Dm7")).toBe(true);
		expect(sameChord("Cmaj", "C")).toBe(true);
		expect(sameChord("Asus", "Asus4")).toBe(true);
	});
	test("root and quality both matter", () => {
		expect(sameChord("D", "Dm")).toBe(false);
		expect(sameChord("D", "D7")).toBe(false);
		expect(sameChord("D", "E")).toBe(false);
		expect(sameChord("A5", "A")).toBe(false);
	});
});

describe("wrongHint (the registered transform)", () => {
	test("root up a fourth, quality kept", () => {
		expect(wrongHint("D")).toBe("G");
		expect(wrongHint("Bm")).toBe("Em");
		expect(wrongHint("A7")).toBe("D7");
		expect(wrongHint("E5")).toBe("A5");
		expect(wrongHint("Bbmaj7")).toBe("Ebmaj7");
	});
	test("N.C. stays N.C.", () => {
		expect(wrongHint("N.C.")).toBe("N.C.");
	});
	test("never equal to the truth it transforms", () => {
		for (const c of ["D", "Bm", "F#7", "Eb", "Gsus4", "C#m", "A5"]) {
			expect(sameChord(c, wrongHint(c))).toBe(false);
		}
	});
});

describe("expandChords", () => {
	test("% repeats the previous chord", () => {
		expect(expandChords("D % % G", 4)).toEqual(["D", "D", "D", "G"]);
	});
	test("short answers pad with misses, long answers truncate", () => {
		expect(expandChords("D A", 4)).toEqual(["D", "A", "", ""]);
		expect(expandChords("D A Bm G E", 4)).toEqual(["D", "A", "Bm", "G"]);
	});
});

describe("gradeChords", () => {
	test("scores per bar with the equivalence", () => {
		const g = gradeChords("D % Db G/B", ["D", "D", "C#", "G"]);
		expect(g.correct).toBe(4);
		expect(g.lengthDelta).toBe(0);
		expect(g.parsedClean).toBe(true);
	});
	test("N.C. matches only N.C.", () => {
		const g = gradeChords("N.C. D", ["N.C.", "N.C."]);
		expect(g.bars[0]!.correct).toBe(true);
		expect(g.bars[1]!.correct).toBe(false);
	});
	test("an empty answer scores zero", () => {
		const g = gradeChords("", ["D", "A"]);
		expect(g.correct).toBe(0);
		expect(g.total).toBe(2);
	});
});
