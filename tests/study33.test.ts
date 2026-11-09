/**
 * Study 33 construction proofs (docs/BRIEF-STUDY33.md): the mid/side
 * split is lossless, the pan law behaves at both ends, the HPSS
 * instrument keeps tones and drops clicks, the purity grader counts
 * chord tones mechanically, and two pseudo-stems' notes merge in order.
 */
import { describe, expect, test } from "bun:test";
import { chordTonePurity, renderPanned } from "../src/study33/corpus33.js";
import { hpssHarmonic } from "../src/study33/hpss.js";
import { mergeNotes, midSide, peakNorm } from "../src/study33/stereo.js";

const RATE = 22050;

function energy(x: Float32Array, from = 0, to = x.length): number {
	let s = 0;
	for (let i = from; i < to; i++) s += x[i]! * x[i]!;
	return s;
}

describe("midSide", () => {
	test("reconstructs both channels and zeroes the side of identical channels", () => {
		const l = Float32Array.from([0.5, -0.25, 0.1]);
		const r = Float32Array.from([0.1, -0.25, -0.3]);
		const { mid, side } = midSide(l, r);
		for (let i = 0; i < l.length; i++) {
			expect(mid[i]! + side[i]!).toBeCloseTo(l[i]!, 6);
			expect(mid[i]! - side[i]!).toBeCloseTo(r[i]!, 6);
		}
		const same = midSide(l, l);
		expect(energy(same.side)).toBeCloseTo(0, 9);
	});
});

describe("peakNorm", () => {
	test("peak lands on 1, silence stays silent", () => {
		const n = peakNorm(Float32Array.from([0.25, -0.5]));
		expect(Math.max(...n.map(Math.abs))).toBeCloseTo(1, 6);
		expect(energy(peakNorm(new Float32Array(8)))).toBe(0);
	});
});

describe("mergeNotes", () => {
	test("concatenates sorted by start", () => {
		const m = mergeNotes([{ start: 2 }, { start: 0 }], [{ start: 1 }]);
		expect(m.map((n) => n.start)).toEqual([0, 1, 2]);
	});
});

describe("renderPanned", () => {
	test("width 0 is center (L = R), width 1 removes the chords from L", () => {
		const c = renderPanned(0, 120, 2);
		let diff = 0;
		for (let i = 0; i < c.l.length; i++) diff += Math.abs(c.l[i]! - c.r[i]!);
		expect(diff).toBeCloseTo(0, 4);
		const hard = renderPanned(1, 120, 2);
		const { side } = midSide(hard.l, hard.r);
		// at full width the side channel is the chords alone (scaled): it correlates with chordsOnly
		let dot = 0;
		let sc = 0;
		let ss = 0;
		for (let i = 0; i < side.length; i++) {
			dot += side[i]! * hard.chordsOnly[i]!;
			sc += hard.chordsOnly[i]! * hard.chordsOnly[i]!;
			ss += side[i]! * side[i]!;
		}
		expect(Math.abs(dot) / Math.sqrt(sc * ss)).toBeGreaterThan(0.999);
	});
	test("bar starts cover the bars plus the closing edge", () => {
		const c = renderPanned(0.5, 120, 4);
		expect(c.barStarts.length).toBe(5);
		expect(c.barStarts[1]!).toBeCloseTo(2.0, 6);
		expect(c.chords).toEqual(["C", "F", "G", "Am"]);
	});
});

describe("hpssHarmonic", () => {
	test("keeps a steady tone, drops a click train", () => {
		const n = 3 * RATE;
		const sine = new Float32Array(n);
		for (let i = 0; i < n; i++) sine[i] = 0.3 * Math.sin((2 * Math.PI * 440 * i) / RATE);
		const hSine = hpssHarmonic(sine);
		expect(energy(hSine, RATE, 2 * RATE) / energy(sine, RATE, 2 * RATE)).toBeGreaterThan(0.7);

		const clicks = new Float32Array(n);
		for (let t = 0.25; t < 2.9; t += 0.25) {
			const at = Math.floor(t * RATE);
			for (let i = 0; i < 64; i++) clicks[at + i] = 0.8 * (1 - i / 64) * (i % 2 === 0 ? 1 : -1);
		}
		const hClicks = hpssHarmonic(clicks);
		expect(energy(hClicks, RATE, 2 * RATE) / energy(clicks, RATE, 2 * RATE)).toBeLessThan(0.3);
	});
});

describe("chordTonePurity", () => {
	test("counts chord-tone seconds against the bar's chord", () => {
		const barStarts = [0, 2, 4];
		const chords = ["C", "F"];
		// C4 across bar one (pure), F#4 across bar two (impure), A3 spanning both (tonal in C? no — A is not in C; tonal in F? yes)
		const notes = [
			{ start: 0, end: 2, pitch: 60 },
			{ start: 2, end: 4, pitch: 66 },
			{ start: 1, end: 3, pitch: 57 },
		];
		const p = chordTonePurity(notes, barStarts, chords);
		// totals: 2 (C4) + 2 (F#4) + 2 (A3) = 6; tonal: 2 (C4) + 0 + 1 (A3's second half over F)
		expect(p.total).toBeCloseTo(6, 6);
		expect(p.tonal).toBeCloseTo(3, 6);
		expect(p.purity).toBeCloseTo(0.5, 6);
	});
	test("empty transcription grades zero without dividing by zero", () => {
		expect(chordTonePurity([], [0, 2], ["C"]).purity).toBe(0);
	});
});
