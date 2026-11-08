/**
 * Study 29 instrument proofs (docs/BRIEF-STUDY29.md): the beat
 * envelope puts weights where declared, the classifier names beats
 * correctly, and the high-pass kills a low tone while passing a high
 * one.
 */
import { describe, expect, test } from "bun:test";
import { beatEnvelope, classifyGrid, FPS, highpass4 } from "../src/study29/backbeat.js";

describe("beatEnvelope", () => {
	test("weights land on the declared beats", () => {
		const env = beatEnvelope(120, 4, 1.0, 0.3, { hihatW: 0.6, pickupW: 0.8 });
		const at = (t: number) => env[Math.round(t * FPS)]!;
		expect(at(1.0)).toBeCloseTo(0.3); // downbeat
		expect(at(1.5)).toBeCloseTo(1.0); // beat 2
		expect(at(2.0)).toBeCloseTo(0.3); // beat 3
		expect(at(2.5)).toBeCloseTo(1.0); // beat 4
		expect(at(1.25)).toBeCloseTo(0.6); // off-eighth
		expect(at(0.75)).toBeCloseTo(0.8); // pickup
	});
});

describe("classifyGrid", () => {
	test("downbeat, backbeat, elsewhere", () => {
		expect(classifyGrid(10.02, 10.0, 120)).toBe("downbeat");
		expect(classifyGrid(10.5, 10.0, 120)).toBe("backbeat"); // one beat late
		expect(classifyGrid(11.0, 10.0, 120)).toBe("backbeat"); // two beats late
		expect(classifyGrid(10.25, 10.0, 120)).toBe("elsewhere"); // half a beat
	});
	test("whole-bar shifts are still the downbeat", () => {
		expect(classifyGrid(12.0, 10.0, 120)).toBe("downbeat");
	});
});

describe("highpass4 at 150 Hz", () => {
	test("kills a 60 Hz kick tone, passes a 400 Hz snare tone", () => {
		const rate = 22050;
		const n = rate;
		const low = new Float32Array(n);
		const high = new Float32Array(n);
		for (let i = 0; i < n; i++) {
			low[i] = Math.sin((2 * Math.PI * 60 * i) / rate);
			high[i] = Math.sin((2 * Math.PI * 400 * i) / rate);
		}
		const rms = (x: Float32Array) => {
			let s = 0;
			for (let i = Math.floor(n / 4); i < n; i++) s += x[i]! * x[i]!;
			return Math.sqrt(s / (n - Math.floor(n / 4)));
		};
		expect(rms(highpass4(low, rate, 150))).toBeLessThan(0.1);
		expect(rms(highpass4(high, rate, 150))).toBeGreaterThan(0.5);
	});
});
