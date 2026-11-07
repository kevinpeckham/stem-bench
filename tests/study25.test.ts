/**
 * Study 25 instrument proofs (docs/BRIEF-STUDY25.md): the best-shift
 * anchor on constructed hints, the anchor arithmetic, and the
 * registered tie-break.
 */
import { describe, expect, test } from "bun:test";
import { bestShiftAnchor, shiftOrder } from "../src/study25/anchor.js";

describe("shiftOrder", () => {
	test("walks 0, -1, +1, -2, +2, ...", () => {
		expect(shiftOrder(2)).toEqual([0, -1, 1, -2, 2]);
	});
});

describe("bestShiftAnchor", () => {
	// A chart whose roots are all distinct, so only the correct pairing scores.
	const truth = ["C", "D", "E", "F", "G", "A", "B", "C#", "D#", "F#", "G#", "A#"].map((c) => [
		c,
		c,
	]);

	test("finds a negative shift: the grid starts four chart bars in", () => {
		// Grid bar j hears chart bar j + 4 (the DTW start was 4 bars late),
		// so chart bar i pairs with grid bar i - 4.
		const hintsU = truth.slice(4).map((bar) => bar[0]!);
		const fit = bestShiftAnchor(hintsU, truth, 7.15, 1.8186);
		expect(fit.shift).toBe(-4);
		expect(fit.anchor).toBeCloseTo(7.15 - 4 * 1.8186, 6);
		expect(fit.right).toBe(truth.length - 4); // the first 4 chart bars have no grid bar
	});

	test("finds a positive shift when the grid starts early", () => {
		const hintsU = ["X", "X", ...truth.map((bar) => bar[0]!)];
		const fit = bestShiftAnchor(hintsU, truth, 0.5, 2.0);
		expect(fit.shift).toBe(2);
		expect(fit.anchor).toBeCloseTo(0.5 + 2 * 2.0, 6);
		expect(fit.right).toBe(truth.length);
	});

	test("ties keep the smallest shift (uniform hints)", () => {
		const hintsU = Array.from({ length: 20 }, () => "C");
		const sameTruth = Array.from({ length: 12 }, () => ["C", "C"]);
		const fit = bestShiftAnchor(hintsU, sameTruth, 3.0, 1.5);
		expect(fit.shift).toBe(0);
		expect(fit.anchor).toBeCloseTo(3.0, 6);
	});

	test("missing indices grade as empty, not as a crash", () => {
		const hintsU = truth.slice(0, 3).map((bar) => bar[0]!); // far fewer hints than bars
		const fit = bestShiftAnchor(hintsU, truth, 0, 1.0, 2);
		expect(fit.bearing).toBe(truth.length);
		expect(fit.right).toBeLessThanOrEqual(3);
	});
});
