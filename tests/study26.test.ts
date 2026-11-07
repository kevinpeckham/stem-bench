/**
 * Study 26 instrument proofs (docs/BRIEF-STUDY26.md): the interior
 * fit, the trusted span, the comb slide, the recipe end-to-end on
 * constructed grids, the registered refusal, and the audible span.
 */
import { describe, expect, test } from "bun:test";
import {
	audibleSpan,
	combSlide,
	interiorFit,
	repairEnds,
	trustedSpan,
} from "../src/study26/recipe.js";

const P = 1.8;
/** A 60-bar "aligned" grid: true at anchor 0.4, ends corrupted like the DTW's. */
function corruptedTs(): number[] {
	const ts = Array.from({ length: 60 }, (_, i) => 0.4 + i * P);
	for (let i = 0; i < 5; i++) ts[i] = 7.0 - i * 0.9; // compressed intro, wrong place
	for (let i = 55; i < 60; i++) ts[i] = ts[54]! + (i - 54) * 0.7; // collapsed tail
	return ts;
}

function impulsesAtTrueBars(fps: number, n: number): Float32Array {
	const env = new Float32Array(Math.ceil((0.4 + n * P + 2) * fps));
	for (let i = 0; i < n; i++) {
		const f = Math.round((0.4 + i * P) * fps);
		if (f >= 0 && f < env.length) env[f] = 1;
	}
	return env;
}

describe("interiorFit", () => {
	test("recovers the true period from the middle despite corrupted ends", () => {
		const fit = interiorFit(corruptedTs());
		expect(Math.abs(fit.period - P) / P).toBeLessThan(0.005);
		expect(Math.abs(fit.predict(30) - (0.4 + 30 * P))).toBeLessThan(0.05);
	});
});

describe("trustedSpan", () => {
	test("excludes the corrupted ends", () => {
		const ts = corruptedTs();
		const span = trustedSpan(ts, interiorFit(ts));
		expect(span).not.toBeNull();
		expect(span!.iFirst).toBeGreaterThanOrEqual(5);
		expect(span!.iFirst).toBeLessThanOrEqual(8);
		expect(span!.iLast).toBeGreaterThanOrEqual(52);
		expect(span!.iLast).toBeLessThanOrEqual(54);
	});
	test("null when nothing coheres", () => {
		const ts = Array.from({ length: 40 }, (_, i) => (i * 7919) % 50);
		expect(trustedSpan(ts, interiorFit(ts))).toBeNull();
	});
});

describe("combSlide", () => {
	test("finds a known offset", () => {
		const fps = 125;
		const env = new Float32Array(60 * fps);
		for (let t = 1.0; t < 58; t += P) env[Math.round(t * fps)] = 1;
		const times = Array.from({ length: 10 }, (_, i) => 1.12 + i * P); // 120 ms late
		const d = combSlide(env, fps, times, 0.25 * P);
		expect(Math.abs(d + 0.12)).toBeLessThanOrEqual(0.02);
	});
});

describe("repairEnds", () => {
	test("repairs corrupted ends to the true grid", () => {
		const fps = 125;
		const out = repairEnds(corruptedTs(), impulsesAtTrueBars(fps, 60), fps);
		expect(out).not.toBeNull();
		for (const i of [0, 1, 2, 3, 56, 57, 58, 59]) {
			expect(Math.abs(out!.barStarts[i]! - (0.4 + i * P))).toBeLessThanOrEqual(0.25 * P);
		}
		expect(out!.confidence[0]).toBe("extrapolated");
		expect(out!.confidence[30]).toBe("aligned");
		expect(out!.barStarts).toHaveLength(60);
	});
	test("refuses when the trusted span is under half the bars", () => {
		// Only 20 of 60 bars cohere with any uniform line.
		const ts = Array.from({ length: 60 }, (_, i) =>
			i >= 20 && i < 40 ? 0.4 + i * P : ((i * 7919) % 97) + (i % 2) * 40,
		);
		expect(repairEnds(ts, new Float32Array(1000), 125)).toBeNull();
	});
});

describe("audibleSpan", () => {
	test("finds the loud span and ignores a quiet lead-in", () => {
		const rate = 1000;
		const x = new Float32Array(10 * rate);
		for (let i = 2 * rate; i < 7 * rate; i++) x[i] = 0.8;
		for (let i = 0; i < rate; i++) x[i] = 0.01; // below 5% of peak
		const span = audibleSpan(x, rate);
		expect(span.first).toBeGreaterThanOrEqual(1.9);
		expect(span.first).toBeLessThanOrEqual(2.05);
		expect(span.last).toBeGreaterThanOrEqual(6.9);
		expect(span.last).toBeLessThanOrEqual(7.05);
	});
});
