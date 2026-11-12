import { describe, expect, it } from "bun:test";
import { type Bar, barsOf, quantizeBar } from "../src/study48/bassLine.js";
import { attribute, gradeLine, lostBy, spanOf, type TruthNote } from "../src/study49/grade.js";
import { APP_CONFIG, type AmpNote, applyRules, bassConstrain, beatLengthAt, bpConfigs, ghostFloor, mergeRetriggers } from "../src/study49/rules.js";

// two 4/4 bars at 120 bpm from t = 10: a beat is 0.5 s, a sixteenth 0.125 s
const beats = [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5];
const bars: Bar[] = barsOf(beats, [10, 12], 14);
const beatLen = beatLengthAt(bars);
const n = (start: number, end: number, pitch: number, amp = 0.6): AmpNote => ({ start, end, pitch, amp });

describe("Study 49 configurations", () => {
	it("registers 32, the app's first, each id unique", () => {
		const cs = bpConfigs();
		expect(cs).toHaveLength(32);
		expect(cs[0]).toEqual(APP_CONFIG);
		expect(new Set(cs.map((c) => c.id)).size).toBe(32);
		expect(cs.at(-1)!.id).toBe("o35-f20-n6-i0-m0");
	});
});

describe("Study 49 bass constraint (the port of Study 48's)", () => {
	it("keeps E1 to C4, drops notes under 60 ms, and keeps the lowest of a 30 ms cluster", () => {
		const out = bassConstrain([n(10.01, 10.5, 52), n(10, 10.5, 40), n(11, 11.05, 40), n(11.5, 12, 27), n(11.5, 12, 61), n(12, 12.4, 60), n(12.04, 12.4, 48)]);
		expect(out.map((x) => [x.start, x.pitch])).toEqual([
			[10, 40],
			[12, 60],
			[12.04, 48],
		]);
	});
});

describe("Study 49 merge", () => {
	it("joins a same-pitch note that starts while the last is sounding and inside the window", () => {
		// a re-trigger 0.2 s (1.6 sixteenths) into a held note
		const notes = [n(10, 10.2, 40), n(10.2, 10.9, 40)];
		expect(mergeRetriggers(notes, beatLen, 0.75)).toEqual([n(10, 10.9, 40)]);
		expect(mergeRetriggers(notes, beatLen, 0.375)).toHaveLength(2);
		// inputs are not mutated
		expect(notes[0]!.end).toBe(10.2);
	});
	it("leaves a repeated note that follows a gap, and another pitch", () => {
		expect(mergeRetriggers([n(10, 10.1, 40), n(10.25, 10.4, 40)], beatLen, 0.75)).toHaveLength(2);
		expect(mergeRetriggers([n(10, 10.25, 40), n(10.25, 10.5, 43)], beatLen, 0.75)).toHaveLength(2);
	});
	it("measures the window from the kept note's onset, so a run cannot chain past it", () => {
		const run = [n(10, 10.125, 40), n(10.125, 10.25, 40), n(10.25, 10.375, 40), n(10.375, 10.5, 40)];
		// a sixteenth-and-a-half window: the second joins the first, the third starts a new note, the fourth joins the third
		const out = mergeRetriggers(run, beatLen, 0.375);
		expect(out.map((x) => [x.start, x.end])).toEqual([
			[10, 10.25],
			[10.25, 10.5],
		]);
	});
	it("joins across an intervening note of another pitch", () => {
		const out = mergeRetriggers([n(10, 10.2, 40), n(10.1, 10.15, 47), n(10.2, 10.6, 40)], beatLen, 0.75);
		expect(out.map((x) => x.pitch)).toEqual([40, 47]);
		expect(out[0]!.end).toBe(10.6);
	});
});

describe("Study 49 floor", () => {
	it("drops notes under a share of the median amplitude", () => {
		const notes = [n(10, 10.5, 40, 0.6), n(10.5, 11, 40, 0.7), n(11, 11.5, 40, 0.3), n(11.5, 12, 40, 0.5), n(12, 12.5, 40, 0.62)];
		// median 0.6: a 0.6 share floors at 0.36, a 0.9 share at 0.54
		expect(ghostFloor(notes, 0.6).map((x) => x.amp)).toEqual([0.6, 0.7, 0.5, 0.62]);
		expect(ghostFloor(notes, 0.9).map((x) => x.amp)).toEqual([0.6, 0.7, 0.62]);
		expect(ghostFloor([], 0.6)).toEqual([]);
	});
	it("applies the floor before the merge, and neither when null", () => {
		// the quiet middle note separates two halves; floored first, the halves are then adjacent no longer (a gap), so they stay two
		const notes = [n(10, 10.2, 40, 0.6), n(10.2, 10.3, 40, 0.2), n(10.3, 10.6, 40, 0.6), n(11, 11.5, 43, 0.6), n(12, 12.5, 43, 0.6)];
		expect(applyRules(notes, beatLen, 0.75, 0.6).map((x) => x.start)).toEqual([10, 10.3, 11, 12]);
		expect(applyRules(notes, beatLen, 0.75, null).map((x) => x.start)).toEqual([10, 11, 12]);
		expect(applyRules(notes, beatLen, null, null)).toEqual(notes);
	});
});

describe("Study 49 line grade", () => {
	const truth: TruthNote[] = [
		{ start: 10, end: 10.5, pitch: 38, vel: 90 },
		{ start: 10.5, end: 11, pitch: 38, vel: 60 },
		{ start: 11, end: 12, pitch: 43, vel: 90 },
		{ start: 12, end: 13, pitch: 45, vel: 90 },
	];
	const span = spanOf(truth, bars);
	const truthLines = span.map((b) => quantizeBar(truth, b));
	it("spans the bars that hold truth and counts found, missing and extra onsets", () => {
		expect(span).toHaveLength(2);
		const est = [n(10, 10.5, 38), n(11, 11.4, 43), n(11.5, 12, 43), n(12, 13, 57)];
		const g = gradeLine(truthLines, est, span);
		expect(g).toMatchObject({ bars: 2, right: 0, oneError: 1, wrong: 1, truthOnsets: 4, found: 3, pitchRight: 2, missing: 1, extra: 1, gridDiffers: 0 });
		const exact = gradeLine(truthLines, truth, span);
		expect(exact).toMatchObject({ right: 2, found: 4, missing: 0, extra: 0 });
		expect(lostBy(exact, g)).toBe(1);
		expect(lostBy(g, exact)).toBe(0);
	});
	it("classes extras: re-trigger, over another note, tail, silence, shifted", () => {
		const t2: TruthNote[] = [
			{ start: 10, end: 10.9, pitch: 38 },
			{ start: 11, end: 11.25, pitch: 43 },
			{ start: 12.5, end: 12.75, pitch: 45 },
		];
		const sp = spanOf(t2, bars);
		const tl = sp.map((b) => quantizeBar(t2, b));
		const est = [
			n(10, 10.5, 38),
			n(10.5, 10.9, 50), // same class as the sounding D: re-trigger
			n(10.75, 10.9, 45), // another class over the sounding D
			n(11, 11.25, 43),
			n(11.375, 11.6, 43), // nothing sounding, the G ended within a beat: tail
			n(12, 12.2, 40), // silence
			n(12.625, 12.9, 45), // the A one slot late: shifted, with its miss
		];
		const a = attribute(t2, tl, est, sp, beatLen);
		expect(a.extras).toEqual({ retrigger: 1, overOther: 1, tail: 1, silence: 1, shifted: 1, grid: 0 });
		expect(a.misses).toMatchObject({ shifted: 1, absorbed: 0, nothing: 0 });
	});
	it("classes misses: absorbed, late, other pitch, nothing, and counts features", () => {
		const t3: TruthNote[] = [
			{ start: 10, end: 10.5, pitch: 38, vel: 90 },
			{ start: 10.5, end: 11, pitch: 38, vel: 50 }, // repeated, legato, quiet: absorbed by the long D below
			{ start: 11, end: 11.5, pitch: 43, vel: 90 }, // a G that the transcription starts three sixteenths late
			{ start: 12, end: 12.1, pitch: 45, vel: 90 }, // short, under 130 ms: nothing transcribed
			{ start: 13, end: 13.5, pitch: 47, vel: 90 }, // only a C# over it
		];
		const sp = spanOf(t3, bars);
		const tl = sp.map((b) => quantizeBar(t3, b));
		const est = [n(10, 11, 38), n(11.375, 11.6, 43), n(13, 13.5, 49)];
		const a = attribute(t3, tl, est, sp, beatLen);
		expect(a.misses).toEqual({ absorbed: 1, late: 1, otherPitch: 0, nothing: 1, other: 0, shifted: 0, grid: 0 });
		expect(a.extras).toMatchObject({ retrigger: 1 });
		// the B's slot holds an onset (the C#), so it is found on rhythm and is no miss
		expect(a.features.repeated).toEqual({ with: 1, withMissed: 1, without: 4, withoutMissed: 2 });
		expect(a.features.under130ms).toEqual({ with: 1, withMissed: 1, without: 4, withoutMissed: 2 });
		expect(a.features.quiet).toEqual({ with: 1, withMissed: 1, without: 4, withoutMissed: 2 });
		expect(a.features.legato.with).toBe(2);
	});
	it("puts a bar read on the other subdivision in the grid class", () => {
		const t4: TruthNote[] = [
			{ start: 10, end: 10.5, pitch: 38 },
			{ start: 10.5, end: 11, pitch: 40 },
		];
		const sp = spanOf(t4, bars);
		const tl = sp.map((b) => quantizeBar(t4, b));
		const est = [n(10, 10.167, 38), n(10.167, 10.333, 40), n(10.333, 10.5, 41)];
		const a = attribute(t4, tl, est, sp, beatLen);
		expect(a.misses.grid).toBe(2);
		expect(a.extras.grid).toBe(3);
		expect(gradeLine(tl, est, sp)).toMatchObject({ gridDiffers: 1, found: 0, missing: 2, extra: 3 });
	});
});
