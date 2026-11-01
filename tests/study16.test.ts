import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { barmarkChartBars } from "../src/study16/barmarkChartBars.js";
import {
	barsAgreement,
	collapsedBar,
	contentDiffs,
	normalizeChord,
	sectionGridErrors,
} from "../src/study16/grading16.js";
import type { ChartBar } from "../src/study14/chartBars.js";

const bar = (over: Partial<ChartBar>): ChartBar => ({
	measure: 1,
	chords: ["C"],
	bpm: 120,
	meter: "4/4",
	key: null,
	section: null,
	...over,
});

describe("the pins", () => {
	test("barmark is exactly 0.5.0, the version the app consumes (431f3506)", () => {
		const pkg = JSON.parse(
			readFileSync(new URL("../node_modules/barmark/package.json", import.meta.url), "utf8"),
		);
		expect(pkg.version).toBe("0.5.0");
	});
});

describe("the 371831ae adapter port, pinned by behavior", () => {
	const DEFAULTS = { tempo: null, meter: null };
	test("holds repeat the symbol before them; a bar of holds is []", () => {
		const read = barmarkChartBars("tempo: 100\n\n## A\n| C G | % | / |\n", DEFAULTS)!;
		expect(read.bars.map((b) => b.chords)).toEqual([["C", "G"], ["C", "G"], []]);
		expect(read.warnings).toEqual([]);
	});
	test("N.C. and -- read as N.C.; `...` is not a bar", () => {
		const read = barmarkChartBars("tempo: 100\n\n## A\n| N.C. | -- |\n| Em | ... |\n", DEFAULTS)!;
		expect(read.bars.map((b) => b.chords)).toEqual([["N.C."], ["N.C."], ["Em"]]);
		expect(read.bars).toHaveLength(3);
	});
	test("a bare repeated heading replays its section (elision)", () => {
		const read = barmarkChartBars("tempo: 100\n\n## V\n| C | D |\n\n## B\n| E |\n\n## V\n", DEFAULTS)!;
		expect(read.bars.map((b) => [b.section, b.chords[0]])).toEqual([
			["V", "C"],
			[null, "D"],
			["B", "E"],
			["V", "C"],
			[null, "D"],
		]);
	});
	test("the song's meter substitutes for barmark's 4/4 assumption only when the chart sets no time", () => {
		const noTime = barmarkChartBars("tempo: 100\n\n## A\n| C |\n", { tempo: null, meter: "6/8" })!;
		expect(noTime.bars[0]!.meter).toBe("6/8");
		const withTime = barmarkChartBars("time: 4/4, tempo: 100\n\n## A\n| C |\n", { tempo: null, meter: "6/8" })!;
		expect(withTime.bars[0]!.meter).toBe("4/4");
	});
	test("null without a tempo anywhere; defaults.tempo fills a chart that states none", () => {
		expect(barmarkChartBars("## A\n| C |\n", { tempo: null, meter: null })).toBeNull();
		const read = barmarkChartBars("## A\n| C |\n", { tempo: 132, meter: null })!;
		expect(read.bars[0]!.bpm).toBe(132);
	});
	test("a barmark diagnostic becomes a warning line", () => {
		const read = barmarkChartBars("key: F#maj 4/4 132 bpm\n\n## A\n| C |\n", { tempo: 132, meter: null })!;
		expect(read.warnings.length).toBeGreaterThan(0);
		expect(read.warnings[0]).toMatch(/^Line 1:/);
	});
	test("a mid-chart key directive changes the key in force", () => {
		const read = barmarkChartBars("key: A, tempo: 224\n\n## A\n| A |\n\nkey: B\n\n## Out\n| B |\n", DEFAULTS)!;
		expect(read.bars.map((b) => b.key)).toEqual(["A major", "B major"]);
	});
});

describe("the registered chord normalization", () => {
	test("accidentals fold to ASCII", () => {
		expect(normalizeChord("F♯ major")).toBe("F# major");
		expect(normalizeChord("B♭7")).toBe("Bb7");
	});
	test("a parenthetical after a power chord's 5 is dropped; elsewhere it splices", () => {
		expect(normalizeChord("F#5(7)")).toBe("F#5");
		expect(normalizeChord("B5(7)")).toBe("B5");
		expect(normalizeChord("C#(7)")).toBe("C#7");
		expect(normalizeChord("D(7)sus4")).toBe("D7sus4");
		expect(normalizeChord("Em")).toBe("Em");
	});
	test("bars collapse runs", () => {
		expect(collapsedBar(["F#5(7)", "F#5(7)", "F#5(7)", "Esus4"])).toEqual(["F#5", "Esus4"]);
		expect(collapsedBar(["Am7", "G5(7)"])).toEqual(["Am7", "G5"]);
	});
});

describe("barsAgreement", () => {
	test("agreement is silence; every difference is one line", () => {
		const a = [bar({ chords: ["F♯5", "Esus4"], key: "F♯ major", section: "Intro" })];
		const b = [bar({ chords: ["F#5(7)", "F#5(7)", "F#5(7)", "Esus4"], key: "F# major", section: "Intro" })];
		expect(barsAgreement(a, b)).toEqual([]);
		const c = [bar({ chords: ["G5"], key: "F# major", section: "Intro" })];
		expect(barsAgreement(a, c)).toHaveLength(1);
		expect(barsAgreement(a, [...c, bar({})])).toHaveLength(2);
	});
});

describe("sectionGridErrors", () => {
	test("cumulative bar seconds land each ordered section start", () => {
		const bars: ChartBar[] = [
			bar({ section: "Intro", bpm: 132 }),
			bar({ bpm: 132 }),
			bar({ section: "Verse", bpm: 132 }),
			bar({ bpm: 132 }),
		];
		const errs = sectionGridErrors(bars, [
			{ name: "Intro", start: 0 },
			{ name: "Verse", start: (2 * 4 * 60) / 132 },
		])!;
		expect(errs.map((e) => Math.abs(e.err) < 1e-9)).toEqual([true, true]);
	});
	test("a section-count mismatch is null, not a partial score", () => {
		expect(sectionGridErrors([bar({ section: "A" })], [{ name: "A", start: 0 }, { name: "B", start: 2 }])).toBeNull();
	});
});

describe("contentDiffs", () => {
	const truth = [
		{ name: "A", bars: [["C"], ["D"]] },
		{ name: "B", bars: [["E"]] },
	];
	const chart = (last: ChartBar[]) => [
		bar({ section: "A", chords: ["C"] }),
		bar({ chords: ["D"] }),
		bar({ section: "B", chords: ["E"] }),
		...last,
	];
	test("a matching chart is silent; one ring-out attack bar is allowed at the end", () => {
		expect(contentDiffs(truth, chart([]), 1)).toEqual([]);
		expect(contentDiffs(truth, chart([bar({ chords: ["E"] })]), 1)).toEqual([]);
	});
	test("two trailing bars, a wrong chord or an interior extra bar are differences", () => {
		expect(contentDiffs(truth, chart([bar({ chords: ["E"] }), bar({ chords: ["E"] })]), 1)).toHaveLength(1);
		const wrong = chart([]);
		wrong[1] = bar({ chords: ["G"] });
		expect(contentDiffs(truth, wrong, 1)).toHaveLength(1);
		const interior = [wrong[0]!, bar({ chords: ["D"] }), bar({ chords: ["D"] }), wrong[2]!];
		expect(contentDiffs(truth, interior, 1).length).toBeGreaterThan(0);
	});
});
