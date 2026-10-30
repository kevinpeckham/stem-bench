import { describe, expect, test } from "bun:test";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { renderReference } from "../src/study12/reference.js";

describe("chromagram", () => {
	test("a pure A440 lands on pitch class 9", () => {
		const sr = 22050;
		const x = new Float32Array(sr * 2);
		for (let i = 0; i < x.length; i++) x[i] = Math.sin((2 * Math.PI * 440 * i) / sr);
		const { frames, hopSec } = chromagram(x);
		expect(hopSec).toBeCloseTo(2048 / 22050, 9);
		const mean = new Float32Array(12);
		for (const f of frames) for (let c = 0; c < 12; c++) mean[c]! += f[c]!;
		expect(mean.indexOf(Math.max(...mean))).toBe(9);
	});
	test("silence yields zero frames, not NaN", () => {
		const { frames } = chromagram(new Float32Array(22050));
		for (const f of frames) for (const v of f) expect(Number.isFinite(v)).toBe(true);
	});
});

describe("dtwAlign", () => {
	const seq = (pcs: number[]) =>
		pcs.map((pc) => {
			const f = new Float32Array(12);
			f[pc] = 1;
			return f;
		});
	test("identical sequences align on the diagonal at zero cost", () => {
		const a = seq([0, 0, 4, 4, 7, 7, 0, 0]);
		const r = dtwAlign(a, a, 0.1);
		expect(r.normalizedCost).toBeCloseTo(0, 9);
		expect(r.mapSeconds(0.4)).toBeCloseTo(0.4, 6);
	});
	test("a 2x-stretched recording maps reference seconds to doubled times", () => {
		const ref = seq([0, 4, 7, 11]);
		const rec = seq([0, 0, 4, 4, 7, 7, 11, 11]);
		const r = dtwAlign(ref, rec, 0.1);
		expect(r.normalizedCost).toBeCloseTo(0, 9);
		expect(r.mapSeconds(0.2)).toBeGreaterThan(0.3); // ref frame 2 → rec frames 4-5
	});
	test("subsequence mode absorbs a count-in", () => {
		const ref = seq([4, 7, 11]);
		const rec = seq([2, 2, 2, 2, 4, 7, 11]);
		const r = dtwAlign(ref, rec, 1, { subsequence: true });
		expect(r.path[0]![1]).toBeGreaterThanOrEqual(3); // starts past the count-in
		expect(r.normalizedCost).toBeLessThan(0.1);
	});
});

describe("renderReference", () => {
	test("deterministic, with bar starts at the declared grid", () => {
		const bars = [
			{ chords: ["C"], bpm: 120 },
			{ chords: ["F", "G"], bpm: 120 },
			{ chords: ["C"], bpm: 60 },
		];
		const a = renderReference(bars, "4/4");
		const b = renderReference(bars, "4/4");
		expect(a.barStarts).toEqual([0, 2, 4, 8]);
		expect(a.samples.length).toBe(b.samples.length);
		let worst = 0;
		for (let i = 0; i < a.samples.length; i += 73) worst = Math.max(worst, Math.abs(a.samples[i]! - b.samples[i]!));
		expect(worst).toBe(0);
	});
});

describe("the MMKK chart transcriptions", () => {
	test("letter-lands is the gated 76-bar reading; eat is exploratory with the disclosed mismatch", () => {
		const letter = mmkkCharts.songs.find((s) => s.slug === "letter-lands")!;
		expect(letter.gated).toBe(true);
		expect(letter.sections.reduce((a, s) => a + s.bars.length, 0)).toBe(76);
		expect(letter.sections).toHaveLength(10);
		const eat = mmkkCharts.songs.find((s) => s.slug === "eat-all-the-clocks")!;
		expect(eat.gated).toBe(false);
		expect(eat.sections).toHaveLength(9);
	});
});
