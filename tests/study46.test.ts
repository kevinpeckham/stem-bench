import { describe, expect, it } from "bun:test";
import { addScore, emptyScore, hintScore } from "../src/study46/score.js";

describe("Study 46 hint score", () => {
	it("scores root and quality family per bar, by the truth's family", () => {
		const s = hintScore(["C#m", "F#7", "B", "Bbm7b5", "Eb7", "Abm", "N.C.", "X"], ["C#m", "F#", "B", "E", "Eb7", "Ab", "C", "C"]);
		expect(s.bars).toBe(6);
		expect(s.rootRight).toBe(5);
		expect(s.familyRight).toBe(3);
		expect(s.chordRight).toBe(3);
		expect(s.byFamily.min).toEqual({ n: 2, rootRight: 2, familyRight: 1 });
		expect(s.byFamily.dom).toEqual({ n: 2, rootRight: 2, familyRight: 1 });
		expect(s.byFamily.dim).toEqual({ n: 1, rootRight: 0, familyRight: 0 });
		expect(s.confusion.dim).toEqual({ maj: 1 });
		expect(s.confusion.dom).toEqual({ maj: 1, dom: 1 });
	});
	it("counts an empty or N.C. hint as wrong on a scored bar, under 'none'", () => {
		const s = hintScore(["G", "G"], ["", "N.C."]);
		expect(s.bars).toBe(2);
		expect(s.rootRight).toBe(0);
		expect(s.confusion.maj).toEqual({ none: 2 });
	});
	it("puts a dim hint on an m7b5 truth in the right family (the mapping writes hdim7 as dim)", () => {
		const s = hintScore(["Gm7b5"], ["Gdim"]);
		expect(s.familyRight).toBe(1);
		expect(s.chordRight).toBe(1);
	});
	it("adds scores", () => {
		const a = hintScore(["C", "Dm"], ["C", "D"]);
		const b = hintScore(["G7"], ["G7"]);
		const t = emptyScore();
		addScore(t, a);
		addScore(t, b);
		expect(t.bars).toBe(3);
		expect(t.familyRight).toBe(2);
		expect(t.byFamily.min).toEqual({ n: 1, rootRight: 1, familyRight: 0 });
		expect(t.confusion.min).toEqual({ maj: 1 });
	});
});
