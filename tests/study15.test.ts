import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { chordChartBars } from "../src/study14/chordChartBars.js";
import { ALIGNMENT_SAME_PIECE_RATIO } from "../src/study15/constants.js";
import { chartBarSeconds } from "../src/study15/chartBarSeconds.js";

describe("the bc683871 port, pinned", () => {
	test("the constant is the bench-recommended 1.6", () => {
		expect(ALIGNMENT_SAME_PIECE_RATIO).toBe(1.6);
	});
	test("chartBarSeconds counts the meter's bottom note (the app convention)", () => {
		expect(chartBarSeconds("4/4", 120)).toBeCloseTo(2, 9);
		expect(chartBarSeconds("6/8", 120)).toBeCloseTo(3, 9); // 120 eighths a minute
		expect(chartBarSeconds("3/4", 90)).toBeCloseTo(2, 9);
		expect(chartBarSeconds("free", 100)).toBeCloseTo(2.4, 9); // unreadable numerator counts four
	});
});

describe("the committed chart texts", () => {
	test("all three parse clean, with peaceful-dreams at the band's revised 152 bars", () => {
		for (const [slug, bars] of [
			["letter-lands", 76],
			["eat-all-the-clocks", 86],
			["peaceful-dreams", 152],
		] as [string, number][]) {
			const md = readFileSync(new URL(`../corpus/mmkk-chart-texts/${slug}.md`, import.meta.url), "utf8");
			const parsed = chordChartBars(md, { tempo: null, meter: null })!;
			expect(parsed.warnings).toEqual([]);
			expect(parsed.bars).toHaveLength(bars);
		}
	});
	test("peaceful-dreams' ten sections grid-match its committed declared starts", () => {
		const md = readFileSync(new URL("../corpus/mmkk-chart-texts/peaceful-dreams.md", import.meta.url), "utf8");
		const { sections } = JSON.parse(readFileSync(new URL("../corpus/mmkk-peaceful-rev.json", import.meta.url), "utf8"));
		const parsed = chordChartBars(md, { tempo: null, meter: null })!;
		const barSec = (4 * 60) / 145;
		const starts = parsed.bars.flatMap((b, i) => (b.section ? [i * barSec] : []));
		expect(starts).toHaveLength(sections.length);
		for (const [k, s] of starts.entries()) expect(Math.abs(s - sections[k].start)).toBeLessThan(0.9);
	});
});
