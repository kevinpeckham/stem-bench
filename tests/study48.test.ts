import { describe, expect, it } from "bun:test";
import { parseChart } from "barmark-0-17";
import { type Bar, barsOf, chooseMode, gradeBar, meantNotes, noteName, quantizeBar, slotOf, writeBar, writeLines } from "../src/study48/bassLine.js";

// a 4/4 bar at 120 bpm from t = 10: beats at 10, 10.5, 11, 11.5; next bar at 12
const beats = [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5];
const downbeats = [10, 12];
const bars: Bar[] = barsOf(beats, downbeats, 14);
const bar = bars[0]!;

describe("Study 48 grid", () => {
	it("builds bars from downbeats with their beats", () => {
		expect(bars).toHaveLength(2);
		expect(bar.beats.map((b) => b.start)).toEqual([10, 10.5, 11, 11.5]);
		expect(bars[1]!.end).toBe(14);
	});
	it("puts an onset on the nearest sixteenth or triplet, and gives the downbeat's early onsets to the next bar", () => {
		expect(slotOf(10.26, bar, "straight")).toMatchObject({ slot: 2 });
		expect(slotOf(10.26, bar, "straight")!.residual).toBeCloseTo(0.01, 6);
		expect(slotOf(10.34, bar, "triplet")).toMatchObject({ slot: 2 });
		expect(slotOf(11.99, bar, "straight")).toBeNull();
	});
	it("chooses the triplet grid only when it fits clearly better", () => {
		expect(chooseMode([10, 10.167, 10.333, 10.5], bar)).toBe("triplet");
		expect(chooseMode([10, 10.125, 10.25, 10.375], bar)).toBe("straight");
		expect(chooseMode([10.17], bar)).toBe("straight");
	});
	it("gives an onset just ahead of the downbeat to that bar's first slot, and to neither bar's last", () => {
		const early = [{ start: 11.99, end: 12.4, pitch: 40 }];
		const next = quantizeBar(early, bars[1]!);
		expect([...next.onsets.keys()]).toEqual([0]);
		expect(quantizeBar(early, bar).onsets.size).toBe(0);
		// but one a whole sixteenth early is the previous bar's last slot
		const late = [{ start: 11.875, end: 12.1, pitch: 40 }];
		expect([...quantizeBar(late, bar, "straight").onsets.keys()]).toEqual([15]);
		expect(quantizeBar(late, bars[1]!).onsets.size).toBe(0);
	});
	it("drops notes shorter than 40 % of a sixteenth", () => {
		const kept = meantNotes(
			[
				{ start: 10, end: 10.04, pitch: 40 },
				{ start: 10.5, end: 10.6, pitch: 40 },
			],
			bars,
		);
		expect(kept).toHaveLength(1);
	});
});

describe("Study 48 bar grading", () => {
	const truth = quantizeBar(
		[
			{ start: 10, end: 10.5, pitch: 38 },
			{ start: 10.5, end: 10.75, pitch: 38 },
			{ start: 10.75, end: 11, pitch: 45 },
			{ start: 11, end: 12, pitch: 43 },
		],
		bar,
	);
	it("quantizes onsets and ends to slots", () => {
		expect([...truth.onsets.keys()]).toEqual([0, 4, 6, 8]);
		expect(truth.ends.get(0)).toBe(4);
		expect(truth.ends.get(8)).toBe(16);
	});
	it("grades a bar right, one error, wrong", () => {
		const same = quantizeBar(
			[
				{ start: 10.01, end: 10.5, pitch: 38 },
				{ start: 10.49, end: 10.75, pitch: 38 },
				{ start: 10.76, end: 11, pitch: 45 },
				{ start: 11.02, end: 12, pitch: 43 },
			],
			bar,
			"straight",
		);
		expect(gradeBar(truth, same)).toMatchObject({ cls: "right", errors: 0, rhythmRight: 4, pitchRight: 4 });
		const octave = quantizeBar(
			[
				{ start: 10, end: 10.5, pitch: 50 },
				{ start: 10.5, end: 10.75, pitch: 38 },
				{ start: 10.75, end: 11, pitch: 45 },
				{ start: 11, end: 12, pitch: 43 },
			],
			bar,
			"straight",
		);
		expect(gradeBar(truth, octave)).toMatchObject({ cls: "one-error", errors: 1, rhythmExact: true, rhythmRight: 4, pitchClassRight: 4, pitchRight: 3 });
		const missing = quantizeBar([{ start: 10, end: 10.5, pitch: 38 }], bar, "straight");
		expect(gradeBar(truth, missing)).toMatchObject({ cls: "wrong", errors: 3 });
		const extra = quantizeBar(
			[
				{ start: 10, end: 10.5, pitch: 38 },
				{ start: 10.25, end: 10.4, pitch: 38 },
				{ start: 10.5, end: 10.75, pitch: 38 },
				{ start: 10.75, end: 11, pitch: 45 },
				{ start: 11, end: 12, pitch: 43 },
			],
			bar,
			"straight",
		);
		expect(gradeBar(truth, extra)).toMatchObject({ cls: "one-error", errors: 1, rhythmExact: false });
		expect(gradeBar(truth, { ...truth, mode: "triplet" }).cls).toBe("wrong");
		expect(gradeBar(quantizeBar([], bar), quantizeBar([], bar)).cls).toBe("right");
	});
});

describe("Study 48 barmark line", () => {
	it("names pitches as sounding pitch with octave", () => {
		expect(noteName(28)).toBe("E1");
		expect(noteName(60)).toBe("C4");
		expect(noteName(34)).toBe("Bb1");
	});
	it("writes a bar with holds, rests, groups and a dotted figure", () => {
		const line = quantizeBar(
			[
				{ start: 10, end: 10.5, pitch: 38 },
				{ start: 10.5, end: 10.75, pitch: 38 },
				{ start: 10.75, end: 11, pitch: 45 },
				{ start: 11, end: 11.375, pitch: 43 },
				{ start: 11.375, end: 11.5, pitch: 45 },
			],
			bar,
			"straight",
		);
		expect(writeBar(line, 4)).toBe("{D2} {D2}_/_{A2}_/ {G2}._{A2} --");
		const rest = quantizeBar([], bar, "straight");
		expect(writeBar(rest, 4)).toBe("--");
		const held = quantizeBar([{ start: 10, end: 12, pitch: 31 }], bar, "straight");
		expect(writeBar(held, 4)).toBe("{G1} / / /");
	});
	it("writes lines that barmark reads without error", () => {
		const bl = quantizeBar(
			[
				{ start: 10, end: 10.167, pitch: 38 },
				{ start: 10.167, end: 10.333, pitch: 40 },
				{ start: 10.333, end: 10.5, pitch: 41 },
				{ start: 10.5, end: 11.5, pitch: 43 },
			],
			bar,
		);
		expect(bl.mode).toBe("triplet");
		const text = writeLines([bl, quantizeBar([], bars[1]!)], [4, 4]);
		expect(text).toBe("Bs | {D2}_{E2}_{F2} {G2} / -- | -- |");
		const chart = `# Test\ntime: 4/4\ntempo: 120\npart: Bs = Bass, instrument: electric bass\n\n## Verse\n${text}\n`;
		const parsed = parseChart(chart) as { diagnostics: { severity: string; message: string }[] };
		expect(parsed.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
	});
});
