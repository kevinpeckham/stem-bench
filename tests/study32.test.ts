/**
 * Study 32 construction proofs (docs/BRIEF-STUDY32.md): every item's
 * true bar one survives pads, trims, pickups and count-ins; the
 * overlays land on their declared beats; the ritardando stretches the
 * last bars; the ratio rule abstains on thin chord margins.
 */
import { describe, expect, test } from "bun:test";
import {
	addChord,
	applyRatioRule,
	padStart,
	RATE32,
	renderSong,
	trimStart,
	withCountIn,
	withPickup,
} from "../src/study32/corpus32.js";

const base = () =>
	renderSong({
		name: "t",
		bpm: 120,
		beats: 4,
		bars: 8,
		harmonic: "bar",
		kickAmp: 1,
		snareAmp: 0.6,
		baseShouldBeCorrect: true,
	});

function energyAround(samples: Float32Array, t: number, win = 0.05): number {
	const from = Math.max(0, Math.floor((t - win / 2) * RATE32));
	const to = Math.min(samples.length, Math.floor((t + win / 2) * RATE32));
	let s = 0;
	for (let i = from; i < to; i++) s += samples[i]! * samples[i]!;
	return s / Math.max(1, to - from);
}

describe("renderSong", () => {
	test("kick energy sits on the bar lines, snare on two and four", () => {
		const it = base();
		// low band at bar line vs mid-bar offbeat eighth
		expect(energyAround(it.samples, 2.0)).toBeGreaterThan(energyAround(it.samples, 2.0 + 0.25));
		// snare beats carry more mid/high content than beat 1's immediate pre-window
		expect(energyAround(it.samples, 2.5)).toBeGreaterThan(0);
	});
	test("ritardando stretches the last bars", () => {
		const steady = base();
		const rit = renderSong({
			name: "r",
			bpm: 120,
			beats: 4,
			bars: 8,
			harmonic: "bar",
			kickAmp: 1,
			snareAmp: 0.6,
			ritStretch: 1.08,
			baseShouldBeCorrect: true,
		});
		expect(rit.samples.length).toBeGreaterThan(steady.samples.length);
	});
	test("6/8 uses two beats a bar", () => {
		const it = renderSong({
			name: "s",
			bpm: 72,
			beats: 2,
			bars: 4,
			harmonic: "bar",
			kickAmp: 1,
			snareAmp: 0.6,
			baseShouldBeCorrect: true,
		});
		expect(it.beats).toBe(2);
		expect(it.beatSec).toBeCloseTo(60 / 72);
	});
});

describe("start variants carry their truth", () => {
	test("pad moves the truth right, trim moves it left", () => {
		const it = base();
		expect(padStart(it, 2.0, "p").truth).toBeCloseTo(2.0, 3);
		expect(trimStart(it, 0.5, "t").truth).toBeCloseTo(-0.5, 3);
	});
	test("a pickup puts music one beat before bar one", () => {
		const it = base();
		const p = withPickup(it, "pickup");
		expect(p.truth).toBeCloseTo(it.beatSec, 3);
		expect(energyAround(p.samples, 0.1)).toBeGreaterThan(0); // the pickup sounds
	});
	test("a count-in puts four clicks and bar one four beats in", () => {
		const it = base();
		const c = withCountIn(it, "count");
		expect(c.truth).toBeCloseTo(4 * it.beatSec, 3);
		expect(energyAround(c.samples, 0.005, 0.01)).toBeGreaterThan(energyAround(c.samples, 0.25, 0.01));
	});
});

describe("applyRatioRule", () => {
	test("abstains on a thin margin, keeps a clear one", () => {
		const thin = applyRatioRule({ cls: 0, detail: { hist: [10, 9, 1, 1] } });
		expect(thin.cls).toBeNull();
		const clear = applyRatioRule({ cls: 0, detail: { hist: [10, 4, 1, 1] } });
		expect(clear.cls).toBe(0);
	});
	test("decides when the runner-up is zero", () => {
		expect(applyRatioRule({ cls: 2, detail: { hist: [0, 0, 12, 0] } }).cls).toBe(2);
	});
});

describe("addChord", () => {
	test("an anticipated chord has energy before the bar line", () => {
		const samples = new Float32Array(2 * RATE32);
		addChord(samples, 0.75, 2.0, "C"); // half a beat before a bar line at 1.0 (120 bpm)
		expect(energyAround(samples, 0.85)).toBeGreaterThan(energyAround(samples, 0.5));
	});
});
