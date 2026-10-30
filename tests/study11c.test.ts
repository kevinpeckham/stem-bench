import { describe, expect, test } from "bun:test";
import mixes11c from "../corpus/mixes11c.json";
import {
	isCompoundMeter,
	isTripleMeter,
	TEMPO_LADDER_RUNGS,
	tempoLadderMatch,
} from "../src/study11c/ladder2cf.js";

describe("the 2cf70cb port, pinned", () => {
	test("rungs include ×3; gates are the declared meter's", () => {
		expect([...TEMPO_LADDER_RUNGS]).toEqual([2, 0.5, 1.5, 2 / 3, 3]);
		expect(tempoLadderMatch(224, 74.7, { triple: true })).toEqual({ factor: 3 });
		expect(tempoLadderMatch(224, 74.7, {})).toBeNull();
		expect(tempoLadderMatch(90, 60, { compound: true })).toEqual({ factor: 1.5 });
		expect(tempoLadderMatch(90, 60, { triple: true })).toBeNull(); // triple opens only ×3
		expect(tempoLadderMatch(145, 96.7, {})).toBeNull(); // peaceful-dreams stays loud
		expect(tempoLadderMatch(224, 112, {})).toEqual({ factor: 2 }); // ×2 always
	});
	test("meter predicates match the shipped comments", () => {
		for (const m of ["6/8", "9/8", "12/8", "6/16"]) expect(isCompoundMeter(m)).toBe(true);
		for (const m of ["4/4", "3/4", "3/8", "7/8", "2/4", null]) expect(isCompoundMeter(m)).toBe(false);
		for (const m of ["3/4", "3/8", "3/2"]) expect(isTripleMeter(m)).toBe(true);
		for (const m of ["6/8", "4/4", "9/8", null]) expect(isTripleMeter(m)).toBe(false);
	});
});

describe("the mirror fixture", () => {
	test("three straight running-eighths items declared wrongly at ⅔", () => {
		expect(mixes11c.mixes).toHaveLength(3);
		for (const m of mixes11c.mixes as { meter: string; swing: number; wrongDeclared: number; sections: { bpm: number }[] }[]) {
			expect(m.meter).toBe("4/4");
			expect(m.swing).toBe(0.5);
			expect(m.wrongDeclared * 3).toBeCloseTo(m.sections[0]!.bpm * 2, 6);
		}
	});
});
