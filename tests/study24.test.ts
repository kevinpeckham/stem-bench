/**
 * Study 24 instrument proofs (docs/BRIEF-STUDY24.md): the joint combs on
 * constructed input, the range fence, and the shifted index pairing.
 */
import { describe, expect, test } from "bun:test";
import { anchorError } from "../src/study23b/downbeat.js";
import {
	jointChangeComb,
	jointOnsetComb,
	RANGE_FRACTION,
	shiftedIndexHits,
} from "../src/study24/tempo.js";

describe("jointChangeComb", () => {
	test("recovers a period 1.9% off the declared one from jittered change times", () => {
		const trueP = 1.63;
		const changes: number[] = [];
		for (let k = 0; k < 90; k += 2) changes.push(0.8 + k * trueP + (k % 5 === 0 ? 0.02 : -0.01));
		const fit = jointChangeComb(changes, 1.6);
		expect(Math.abs(fit.period - trueP) / trueP).toBeLessThan(0.002);
		expect(anchorError(fit.phase, 0.8, fit.period)).toBeLessThan(0.05);
	});
	test("tolerates off-lattice stragglers", () => {
		const changes: number[] = [];
		for (let k = 0; k < 60; k += 3) changes.push(1.2 + k * 2.07);
		changes.push(5.5, 17.3); // stragglers
		const fit = jointChangeComb(changes, 2.0);
		expect(Math.abs(fit.period - 2.07) / 2.07).toBeLessThan(0.003);
	});
	test("stays inside the registered ±10% window", () => {
		// change times on a HALF-period lattice would tempt a degenerate fit
		const changes: number[] = [];
		for (let k = 0; k < 120; k++) changes.push(0.5 + k * 0.9); // 0.9 = half of 1.8
		const fit = jointChangeComb(changes, 1.8);
		expect(fit.period).toBeGreaterThanOrEqual(1.8 * (1 - RANGE_FRACTION) - 1e-9);
		expect(fit.period).toBeLessThanOrEqual(1.8 * (1 + RANGE_FRACTION) + 1e-9);
	});
});

describe("jointOnsetComb", () => {
	test("finds the period of an impulse train 1.25% off declared", () => {
		const fps = 125;
		const trueP = 1.58;
		const env = new Float32Array(Math.ceil(90 * fps));
		for (let t = 0.42; t < 90; t += trueP) env[Math.round(t * fps)] = 1;
		const fit = jointOnsetComb(env, fps, 1.6);
		expect(Math.abs(fit.period - trueP) / trueP).toBeLessThan(0.002);
		expect(anchorError(fit.phase, 0.42, fit.period)).toBeLessThan(0.03);
	});
});

describe("shiftedIndexHits", () => {
	test("finds the whole-bar shift and scores hits at it", () => {
		const truth = Array.from({ length: 40 }, (_, i) => 7.15 + i * 1.7);
		// grid: right geometry, starts 3 bars early
		const grid = Array.from({ length: 46 }, (_, i) => 7.15 - 3 * 1.7 + i * 1.7);
		const s = shiftedIndexHits(grid, truth, 0.15 * 1.7);
		expect(s.shift).toBe(3);
		expect(s.hits).toBe(40);
	});
	test("a wrong-period grid scores low at every shift", () => {
		const truth = Array.from({ length: 40 }, (_, i) => 2.0 + i * 1.7);
		const grid = Array.from({ length: 40 }, (_, i) => 2.0 + i * 1.8);
		const s = shiftedIndexHits(grid, truth, 0.15 * 1.7);
		expect(s.hits).toBeLessThan(8);
	});
});
