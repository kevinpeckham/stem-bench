/**
 * Study 22 instrument proofs (docs/BRIEF-STUDY22.md): the fit recovers
 * exact grids, the hit metric's tolerance behaves at its edges, and the
 * phase comb finds an impulse train's phase.
 */
import { describe, expect, test } from "bun:test";
import { fitUniformGrid, latticeHits, phaseFromOnset, uniformGrid } from "../src/study22/grid.js";

describe("fitUniformGrid", () => {
	test("recovers an exact uniform grid", () => {
		const truth = Array.from({ length: 50 }, (_, i) => 1.23 + i * 1.655);
		const fit = fitUniformGrid(truth);
		expect(fit.period).toBeCloseTo(1.655, 9);
		expect(fit.phase).toBeCloseTo(1.23, 9);
		expect(uniformGrid(fit, 3)[2]).toBeCloseTo(1.23 + 2 * 1.655, 9);
		expect(latticeHits(fit, truth).hitRate).toBe(1);
	});
	test("averages through symmetric jitter", () => {
		const truth = Array.from({ length: 51 }, (_, i) => 2 + i * 0.8 + (i % 2 === 0 ? 0.02 : -0.02));
		const fit = fitUniformGrid(truth);
		expect(fit.period).toBeCloseTo(0.8, 2);
	});
});

describe("latticeHits", () => {
	const truth = Array.from({ length: 11 }, (_, i) => i * 2); // bar = 2 s, tol = 0.3 s
	test("inside and outside the 15% tolerance", () => {
		expect(latticeHits({ period: 2, phase: 0.29 }, truth).hits).toBe(11);
		expect(latticeHits({ period: 2, phase: 0.31 }, truth).hits).toBe(0);
		expect(latticeHits({ period: 2, phase: 0.29 }, truth).tolMs).toBe(300);
	});
	test("a half-bar offset misses every bar", () => {
		expect(latticeHits({ period: 2, phase: 1 }, truth).hits).toBe(0);
	});
	test("the first run's defect: a phase one bar up (mod period) still hits", () => {
		expect(latticeHits({ period: 2, phase: 2 - 0.068 }, truth).hits).toBe(11);
		expect(latticeHits({ period: 2, phase: 40.1 }, truth).hits).toBe(11);
	});
	test("a wrong period walks across the lattice and mostly misses", () => {
		const score = latticeHits({ period: 1.8, phase: 0 }, truth);
		expect(score.hitRate).toBeLessThan(0.5);
	});
	test("a half period contains the true lattice (why the period is reported)", () => {
		expect(latticeHits({ period: 1, phase: 0 }, truth).hits).toBe(11);
	});
});

describe("phaseFromOnset", () => {
	const fps = 125;
	function impulses(phase: number, period: number, seconds: number): Float32Array {
		const x = new Float32Array(Math.round(seconds * fps));
		for (let t = phase; t < seconds; t += period) x[Math.round(t * fps)] = 1;
		return x;
	}
	test("finds an impulse train's phase", () => {
		const est = phaseFromOnset(impulses(0.42, 1.6, 60), fps, 1.6);
		expect(Math.abs(est - 0.42)).toBeLessThan(0.02);
	});
	test("locks to the stronger of two beat combs (the registered failure mode)", () => {
		const x = impulses(0.1, 1.6, 60);
		const loud = impulses(0.9, 1.6, 60); // the off-beat, twice as strong
		for (let i = 0; i < x.length; i++) x[i]! += 2 * loud[i]!;
		const est = phaseFromOnset(x, fps, 1.6);
		expect(Math.abs(est - 0.9)).toBeLessThan(0.02);
	});
});
