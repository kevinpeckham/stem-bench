/**
 * Study 28 instrument proofs (docs/BRIEF-STUDY28.md): the chartless
 * grid recovers a known lattice's anchor and bar count from the onset
 * envelope and the audible span alone, and the physicality fence
 * holds.
 */
import { describe, expect, test } from "bun:test";
import { chartlessGrid } from "../src/study28/grid.js";

const P = 1.8;

function lattice(fps: number, n: number, anchor: number): Float32Array {
	const env = new Float32Array(Math.ceil((anchor + n * P + 2) * fps));
	for (let i = 0; i < n; i++) {
		const f = Math.round((anchor + i * P) * fps);
		if (f >= 0 && f < env.length) env[f] = 1;
	}
	return env;
}

function audio(rate: number, first: number, last: number): Float32Array {
	const x = new Float32Array(Math.ceil((last + 1) * rate));
	for (let i = Math.round(first * rate); i < Math.round(last * rate); i++) x[i] = 0.8;
	return x;
}

describe("chartlessGrid", () => {
	test("recovers anchor and bar count from a known lattice", () => {
		const fps = 125;
		const n = 60;
		const g = chartlessGrid(lattice(fps, n, 0.4), fps, P, audio(1000, 0.4, 0.4 + n * P), 1000);
		expect(Math.abs(g.period - P) / P).toBeLessThan(0.005);
		expect(Math.abs(g.anchor - 0.4)).toBeLessThanOrEqual(0.05);
		expect(Math.abs(g.n - n)).toBeLessThanOrEqual(1);
	});

	test("registers the anchor at the lattice point nearest the first sound, even just before it", () => {
		// The band opens on bar one but the envelope's first energy sits a
		// hair after the lattice point (letter-lands opens at -0.12 s).
		const fps = 125;
		const n = 60;
		const g = chartlessGrid(lattice(fps, n, 0.4), fps, P, audio(1000, 0.52, 0.4 + n * P), 1000);
		expect(Math.abs(g.anchor - 0.4)).toBeLessThanOrEqual(0.05);
	});

	test("the physicality fence: anchor never leads the first sound by a bar or more", () => {
		const fps = 125;
		const n = 60;
		const g = chartlessGrid(lattice(fps, n, 0.4), fps, P, audio(1000, 0.4, 0.4 + n * P), 1000);
		expect(g.anchor).toBeGreaterThanOrEqual(0.4 - P);
	});
});
