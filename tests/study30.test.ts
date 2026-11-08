/**
 * Study 30 instrument proofs (docs/BRIEF-STUDY30.md): the
 * disambiguator picks the lattice position whose bar lines sit on the
 * novelty impulses, the physicality window holds, and the low-pass is
 * the complement of Study 29's high-pass.
 */
import { describe, expect, test } from "bun:test";
import { disambiguate, lowpass4, scoreAnchor } from "../src/study30/downbeat.js";

const P = 1.8;

function impulsesAt(fps: number, times: number[], length: number): Float32Array {
	const env = new Float32Array(Math.ceil(length * fps));
	for (const t of times) {
		const f = Math.round(t * fps);
		if (f >= 0 && f < env.length) env[f] = 1;
	}
	return env;
}

describe("disambiguate", () => {
	test("recovers the downbeat from a base anchor two beats late", () => {
		const fps = 125;
		const n = 40;
		const trueAnchor = 0.4;
		const bars = Array.from({ length: n }, (_, i) => trueAnchor + i * P);
		const env = impulsesAt(fps, bars, trueAnchor + n * P + 2);
		const base = trueAnchor + 2 * (P / 4); // the Study 28 failure shape
		const out = disambiguate(base, P, 4, trueAnchor, n, env, fps);
		expect(Math.abs(out.anchor - trueAnchor)).toBeLessThanOrEqual(0.02);
	});

	test("keeps a correct anchor (shift 0 wins when base is right)", () => {
		const fps = 125;
		const n = 40;
		const trueAnchor = 0.4;
		const bars = Array.from({ length: n }, (_, i) => trueAnchor + i * P);
		const env = impulsesAt(fps, bars, trueAnchor + n * P + 2);
		const out = disambiguate(trueAnchor, P, 4, trueAnchor, n, env, fps);
		expect(out.shift).toBe(0);
	});

	test("every candidate stays inside the physicality window", () => {
		const fps = 125;
		const env = impulsesAt(fps, [0.4], 80);
		const out = disambiguate(0.4, P, 4, 0.4, 40, env, fps);
		for (const c of out.scores) {
			expect(c.anchor).toBeGreaterThanOrEqual(0.4 - P);
			expect(c.anchor).toBeLessThan(0.4 + P);
		}
	});
});

describe("scoreAnchor", () => {
	test("on-impulse grid outscores an off-impulse grid", () => {
		const fps = 125;
		const n = 40;
		const bars = Array.from({ length: n }, (_, i) => 0.4 + i * P);
		const env = impulsesAt(fps, bars, 0.4 + n * P + 2);
		const on = scoreAnchor(env, fps, 0.4, P, n);
		const off = scoreAnchor(env, fps, 0.4 + P / 2, P, n);
		expect(on).toBeGreaterThan(off);
	});
});

describe("lowpass4 at 150 Hz", () => {
	test("passes a 60 Hz kick tone, kills a 400 Hz snare tone", () => {
		const rate = 22050;
		const nn = rate;
		const low = new Float32Array(nn);
		const high = new Float32Array(nn);
		for (let i = 0; i < nn; i++) {
			low[i] = Math.sin((2 * Math.PI * 60 * i) / rate);
			high[i] = Math.sin((2 * Math.PI * 400 * i) / rate);
		}
		const rms = (x: Float32Array) => {
			let s = 0;
			for (let i = Math.floor(nn / 4); i < nn; i++) s += x[i]! * x[i]!;
			return Math.sqrt(s / (nn - Math.floor(nn / 4)));
		};
		expect(rms(lowpass4(low, rate, 150))).toBeGreaterThan(0.5);
		expect(rms(lowpass4(high, rate, 150))).toBeLessThan(0.1);
	});
});
