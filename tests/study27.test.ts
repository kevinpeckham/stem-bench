/**
 * Study 27 instrument proofs (docs/BRIEF-STUDY27.md): the whole-grid
 * re-phase lands on the onset lattice, the half-beat fence cannot hop
 * a beat, and the registered refusal is unchanged.
 */
import { describe, expect, test } from "bun:test";
import { rephaseGrid } from "../src/study27/rephase.js";

const P = 0.8;
const BEATS = 3;

function impulses(fps: number, n: number, anchor: number): Float32Array {
	const env = new Float32Array(Math.ceil((anchor + n * P + 2) * fps));
	for (let i = 0; i < n; i++) {
		const f = Math.round((anchor + i * P) * fps);
		if (f >= 0 && f < env.length) env[f] = 1;
	}
	return env;
}

describe("rephaseGrid (recipe v5)", () => {
	test("moves a coherently offset grid onto the onset lattice", () => {
		// The DTW grid is internally coherent but sits 0.11 s off the
		// lattice the notes were played on — the measured mop-heart shape.
		const n = 60;
		const fps = 125;
		const trueAnchor = 0.3;
		const ts = Array.from({ length: n }, (_, i) => trueAnchor + 0.11 + i * P);
		const out = rephaseGrid(ts, impulses(fps, n, trueAnchor), fps, P, BEATS);
		expect(out).not.toBeNull();
		for (const i of [0, 1, 30, 58, 59]) {
			expect(Math.abs(out!.barStarts[i]! - (trueAnchor + i * P))).toBeLessThanOrEqual(0.02);
		}
		expect(Math.abs(out!.delta + 0.11)).toBeLessThanOrEqual(0.02);
	});

	test("the half-beat fence cannot hop to the neighboring beat", () => {
		// Lattice impulses at every BEAT, with the grid offset by nearly a
		// whole beat: the fenced slide must stay within half a beat and
		// never reach the next beat line.
		const n = 60;
		const fps = 125;
		const beat = P / BEATS;
		const env = new Float32Array(Math.ceil((0.3 + n * P + 2) * fps));
		for (let t = 0.3; t < 0.3 + n * P; t += beat) env[Math.round(t * fps)] = 1;
		const ts = Array.from({ length: n }, (_, i) => 0.3 + 0.9 * beat + i * P);
		const out = rephaseGrid(ts, env, fps, P, BEATS);
		expect(out).not.toBeNull();
		expect(Math.abs(out!.delta)).toBeLessThanOrEqual(0.5 * beat + 1e-9);
	});

	test("still refuses an untrusted interior", () => {
		const ts = Array.from({ length: 60 }, (_, i) => ((i * 7919) % 97) + (i % 2) * 40);
		expect(rephaseGrid(ts, new Float32Array(1000), 125, P, BEATS)).toBeNull();
	});
});
