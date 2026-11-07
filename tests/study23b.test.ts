/**
 * Study 23b instrument proofs (docs/BRIEF-STUDY23B.md): the circular
 * anchor error, and each tap-free estimator on constructed input.
 */
import { describe, expect, test } from "bun:test";
import {
	anchorError,
	bassCombAnchor,
	changeCombAnchor,
	musicStartAnchor,
} from "../src/study23b/downbeat.js";

describe("anchorError", () => {
	test("wraps the period both ways", () => {
		expect(anchorError(0.1, 7.15, 1.8)).toBeCloseTo(anchorError(0.1 + 3 * 1.8, 7.15, 1.8), 9);
		expect(anchorError(1.7, 0.0, 1.8)).toBeCloseTo(0.1, 9);
		expect(anchorError(0.9, 0.0, 1.8)).toBeCloseTo(0.9, 9); // the worst case is half a period
	});
});

describe("bassCombAnchor", () => {
	test("finds the phase of low-note starts and ignores high notes", () => {
		const notes = [];
		for (let t = 0.42; t < 60; t += 1.6) notes.push({ start: t, pitch: 40, amplitude: 0.9 });
		for (let t = 1.22; t < 60; t += 1.6) notes.push({ start: t, pitch: 70, amplitude: 1 });
		const est = bassCombAnchor(notes, 1.6, 60);
		expect(anchorError(est, 0.42, 1.6)).toBeLessThan(0.03);
	});
});

describe("changeCombAnchor", () => {
	test("locks to the lattice the change times sit on", () => {
		const changes = [2.4, 5.6, 8.8, 13.6, 20.0]; // all at 0.8 + k·1.6
		const est = changeCombAnchor(changes, 1.6);
		expect(anchorError(est, 0.8, 1.6)).toBeLessThan(0.02);
	});
	test("tolerates off-lattice stragglers", () => {
		const est = changeCombAnchor([2.4, 5.6, 8.8, 9.3], 1.6);
		expect(anchorError(est, 0.8, 1.6)).toBeLessThan(0.1);
	});
});

describe("musicStartAnchor", () => {
	test("takes the earliest loud note and skips quiet noise", () => {
		const notes = [
			{ start: 0.3, pitch: 80, amplitude: 0.2 },
			{ start: 7.18, pitch: 50, amplitude: 0.8 },
			{ start: 9.0, pitch: 50, amplitude: 0.9 },
		];
		expect(musicStartAnchor(notes)).toBeCloseTo(7.18, 9);
		expect(musicStartAnchor([{ start: 1, pitch: 50, amplitude: 0.1 }])).toBeNull();
	});
});
