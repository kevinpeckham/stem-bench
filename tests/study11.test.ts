import { describe, expect, test } from "bun:test";
import mixes from "../corpus/mixes.json";
import { renderMix, type MixSpec } from "../src/study4/synth4.js";
import { analyse } from "../src/study9/analysis.js";
import { featuresOf } from "../src/study9/instruments.js";
import {
	autocorrelationMirror,
	detrendMirror,
	subdivisionOf,
	tempoLadderMatch,
	wrongTempoSet,
	LADDER_TOLERANCE,
} from "../src/study11/ladder.js";

describe("tempoLadderMatch", () => {
	test("rungs 1, 2 and half are always on the ladder", () => {
		expect(tempoLadderMatch(120, 120, 2, "L-gated").rung).toBe(1);
		expect(tempoLadderMatch(224, 112, 2, "L-gated").rung).toBe(2);
		expect(tempoLadderMatch(60, 120, 2, "L-gated").rung).toBe(0.5);
	});
	test("tolerance is a ratio, so it scales at high rungs", () => {
		// 2 % of the rung value: 224 vs 112 passes at 228.4 (1.96 % off) and
		// fails at 230 (2.7 % off) — an absolute ±3 would have passed both.
		expect(tempoLadderMatch(228.4, 112, 2, "L-gated").match).toBe(true);
		expect(tempoLadderMatch(230, 112, 2, "L-gated").match).toBe(false);
		expect(LADDER_TOLERANCE).toBe(0.02);
	});
	test("3:2 rungs are gated on compound evidence", () => {
		expect(tempoLadderMatch(90, 60, 2, "L-gated").match).toBe(false);
		expect(tempoLadderMatch(90, 60, 3, "L-gated").rung).toBe(1.5);
		expect(tempoLadderMatch(90, 60, 2, "L-open").rung).toBe(1.5);
		expect(tempoLadderMatch(145, 96.7, 2, "L-gated").match).toBe(false); // peaceful-dreams: a true miss stays a miss
		expect(tempoLadderMatch(145, 96.7, 3, "L-gated").match).toBe(true); // ...unless compound evidence licenses it
	});
	test("genuinely off values miss every rung", () => {
		for (const d of [128.5, 134, 96, 160]) {
			expect(tempoLadderMatch(d, 120, 3, "L-open").match).toBe(false);
		}
	});
});

describe("wrongTempoSet", () => {
	test("seven multipliers on straight items, 1.5 excluded on compound", () => {
		expect(wrongTempoSet(120, false)).toHaveLength(7);
		expect(wrongTempoSet(60, true)).toHaveLength(6);
		expect(wrongTempoSet(60, true).map((r) => r.multiplier)).not.toContain(1.5);
	});
	test("no wrong multiplier sits within ladder tolerance of a rung", () => {
		for (const { declared } of wrongTempoSet(120, false)) {
			if (declared === 180) continue; // the 1.5 row: on the gated rung by design
			expect(tempoLadderMatch(declared, 120, 2, "L-gated").match).toBe(false);
		}
	});
});

describe("the detrend/autocorrelation mirror matches the port's observable behavior", () => {
	// The port keeps both functions private; the mirror is pinned by
	// reproducing detectTempo's chosen peak: at the detected bpm the
	// mirrored autocorrelation of the mirrored detrend must score the
	// detected lag at least as high as its half and double lags.
	test("on drift-4a the detected lag is the mirror's best of the three", () => {
		const spec = mixes.mixes.find((m) => m.id === "drift-4a")! as MixSpec;
		const i = mixes.mixes.findIndex((m) => m.id === "drift-4a");
		const f = featuresOf(renderMix(spec, 4000 + i));
		const d = analyse(f);
		const x = detrendMirror(f.onset, f.fps);
		const lag = Math.round((60 / d.tempo.bpm) * f.fps);
		const zero = autocorrelationMirror(x, 0) || 1;
		const at = (l: number) => autocorrelationMirror(x, l) / zero;
		expect(d.tempo.bpm).toBe(120);
		expect(at(lag)).toBeGreaterThan(at(Math.round(lag / 2)) * 0.999);
	});
});

describe("subdivisionOf on synthetic envelopes", () => {
	// A pulse train at the beat with triplet subdivision vs duple
	// subdivision; fps 86 (the bench's 22050/256).
	const fps = 22050 / 256;
	const make = (beatSec: number, split: 2 | 3, seconds: number) => {
		const x = new Float32Array(Math.round(seconds * fps));
		const sub = beatSec / split;
		for (let t = 0; t < seconds; t += sub) {
			const i = Math.round(t * fps);
			if (i < x.length) x[i] = t % beatSec < sub / 2 ? 1 : 0.5;
		}
		return x;
	};
	test("triplet envelope reads 3, duple reads 2", () => {
		expect(subdivisionOf(make(0.5, 3, 30), fps, 120).subdivision).toBe(3);
		expect(subdivisionOf(make(0.5, 2, 30), fps, 120).subdivision).toBe(2);
	});
	test("a real 6/8 item reads 3 at its true dotted-quarter tempo", () => {
		const spec = mixes.mixes.find((m) => m.id === "lilt-a")! as MixSpec;
		const i = mixes.mixes.findIndex((m) => m.id === "lilt-a");
		const f = featuresOf(renderMix(spec, 4000 + i));
		expect(subdivisionOf(f.onset, f.fps, 60).subdivision).toBe(3);
	});
	test("a real 4/4 item reads 2 at its true tempo", () => {
		const spec = mixes.mixes.find((m) => m.id === "drift-4a")! as MixSpec;
		const i = mixes.mixes.findIndex((m) => m.id === "drift-4a");
		const f = featuresOf(renderMix(spec, 4000 + i));
		expect(subdivisionOf(f.onset, f.fps, 120).subdivision).toBe(2);
	});
});
