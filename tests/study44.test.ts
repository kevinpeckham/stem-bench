import { describe, expect, it } from "bun:test";
import {
	barCounts,
	beatCv,
	declaredBarSec,
	foldShare,
	joinHalfBars,
	modalOf,
	profile,
	type Reading,
	steadyShare,
	trackerBarGrid,
} from "../src/study44/gridRules.js";

const BEAT = 0.5;

/** The app's test reading: one bar per entry of `counts`, a beat every half second, downbeats among the beats, `tail` seconds after the last. */
function reading(counts: number[], tail = 0): Reading {
	const beats: number[] = [];
	const downbeats: number[] = [];
	let t = 0;
	for (const n of counts) {
		downbeats.push(t);
		for (let k = 0; k < n; k++) beats.push(t + k * BEAT);
		t += n * BEAT;
	}
	downbeats.push(t);
	beats.push(t);
	return { duration: t + tail, beats, downbeats };
}

// The app's own cases (stem-shovel src/lib/utils/trackerBarGrid.test.ts at 36e7a919), verbatim in substance.
describe("trackerBarGrid, the app's rules ported", () => {
	it("null without a reading, or with fewer than five downbeats", () => {
		expect(trackerBarGrid(null)).toBeNull();
		expect(trackerBarGrid(reading([4, 4, 4]))).toBeNull();
		expect(trackerBarGrid({ duration: 30, beats: [], downbeats: [] })).toBeNull();
	});
	it("steady 4/4: every downbeat a bar line, the usual bar's seconds", () => {
		expect(trackerBarGrid(reading([4, 4, 4, 4]))).toEqual({ bars: [0, 2, 4, 6, 8], meter: "4/4", barSeconds: 2 });
	});
	it("3/4 and 6/8 by the modal count", () => {
		expect(trackerBarGrid(reading([3, 3, 3, 3]))?.meter).toBe("3/4");
		const six = trackerBarGrid(reading([6, 6, 6, 6]));
		expect(six?.meter).toBe("6/8");
		expect(six?.barSeconds).toBe(3);
	});
	it("joins two adjacent half bars into one bar", () => {
		expect(trackerBarGrid(reading([2, 2, 4, 4, 4, 4]))).toEqual({ bars: [0, 2, 4, 6, 8, 10], meter: "4/4", barSeconds: 2 });
		expect(trackerBarGrid(reading([6, 6, 3, 3, 6, 6]))?.bars).toEqual([0, 3, 6, 9, 12, 15]);
	});
	it("leaves a half bar with no partner as read", () => {
		expect(trackerBarGrid(reading([4, 4, 2, 4, 4, 4]))).toEqual({ bars: [0, 2, 4, 5, 7, 9, 11], meter: "4/4", barSeconds: 2 });
	});
	it("joins only pairs: three half bars in a row leave the third as read", () => {
		expect(trackerBarGrid(reading([2, 2, 2, 4, 4, 4, 4, 4]))?.bars).toEqual([0, 2, 3, 5, 7, 9, 11, 13]);
	});
	it("never joins bars when the usual bar has an odd count of beats", () => {
		expect(trackerBarGrid(reading([3, 3, 3, 3, 3, 3, 1, 1]))?.bars).toEqual([0, 1.5, 3, 4.5, 6, 7.5, 9, 9.5, 10]);
	});
	it("closes with a bar to the audio's end when at least half a bar remains", () => {
		expect(trackerBarGrid(reading([4, 4, 4, 4], 1))?.bars).toEqual([0, 2, 4, 6, 8, 9]);
		expect(trackerBarGrid(reading([4, 4, 4, 4], 1.5))?.bars).toEqual([0, 2, 4, 6, 8, 9.5]);
		expect(trackerBarGrid(reading([4, 4, 4, 4], 0.99))?.bars).toEqual([0, 2, 4, 6, 8]);
	});
	it("barSeconds is the median bar of the joined grid", () => {
		expect(trackerBarGrid(reading([4, 2, 2, 4, 4, 4, 2, 5]))?.barSeconds).toBe(2);
	});
	it("null when fewer than 60% of the bars hold the usual count", () => {
		expect(trackerBarGrid(reading([3, 3, 3, 2, 4, 5, 2, 4, 5]))).toBeNull();
		expect(trackerBarGrid(reading([3, 3, 3, 3, 3, 4, 2, 5, 6]))).toBeNull();
	});
	it("a grid when the steady share reaches 60%", () => {
		expect(trackerBarGrid(reading([3, 3, 3, 3, 3, 3, 4, 2, 5, 6]))?.meter).toBe("3/4");
		const over = trackerBarGrid(reading([3, 3, 3, 3, 3, 3, 3, 4, 2, 5, 6]));
		expect(over?.meter).toBe("3/4");
		expect(over?.bars).toHaveLength(12);
	});
	it("the steady share counts the bars after half bars are joined", () => {
		expect(trackerBarGrid(reading([2, 2, 4, 4, 4, 4, 4, 2, 2]))?.bars).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
	});
	it("a lower threshold lets an unsteady reading stand", () => {
		expect(trackerBarGrid(reading([3, 3, 3, 2, 4, 5, 2, 4, 5]), 0.3)?.meter).toBe("3/4");
	});
});

describe("the measures", () => {
	it("barCounts and modalOf: beats strictly between consecutive downbeats plus one; smallest on a tie", () => {
		const r = reading([4, 2, 4, 6]);
		expect(barCounts(r.beats, r.downbeats)).toEqual([4, 2, 4, 6]);
		expect(modalOf([4, 2, 4, 6])).toBe(4);
		expect(modalOf([3, 6, 6, 3])).toBe(3);
		expect(modalOf([])).toBeNull();
	});
	it("joinHalfBars removes one line per pair and counts beats from the downbeat", () => {
		const r = reading([2, 2, 2, 2, 4]);
		expect(joinHalfBars(r.beats, r.downbeats, 4)).toEqual([0, 2, 4, 6]);
		expect(joinHalfBars(r.beats, r.downbeats, 3)).toEqual(r.downbeats);
	});
	it("steadyShare and foldShare: a 6/8 read as bars of 3 and 6 by turns is half steady and wholly fold-steady", () => {
		const r = reading([6, 3, 6, 3, 6, 3, 6, 3]);
		expect(steadyShare(r.beats, r.downbeats, 6)).toBe(0.5);
		expect(foldShare(r.beats, r.downbeats, 6)).toBe(1);
		const odd = reading([3, 6, 3, 1, 3, 2]);
		expect(foldShare(odd.beats, odd.downbeats, 3)).toBeCloseTo(4 / 6, 10);
	});
	it("beatCv: zero on an even beat, null under three beats", () => {
		expect(beatCv([0, 0.5, 1, 1.5])).toBe(0);
		expect(beatCv([0, 1])).toBeNull();
		expect(beatCv([0, 0.5, 1.5])).toBeCloseTo(0.3333, 3);
	});
	it("profile reports joins, both shares, both bar counts and whether the reading stands", () => {
		const p = profile(reading([2, 2, 4, 4, 4, 4, 4, 2, 2], 0.2));
		expect(p.usual).toBe(4);
		expect(p.meter).toBe("4/4");
		expect(p.tempo).toBe(120);
		expect(p.joins).toBe(2);
		expect(p.shareAsRead).toBeCloseTo(5 / 9, 10);
		expect(p.shareJoined).toBe(1);
		expect(p.foldShareAsRead).toBe(1);
		expect(p.barsAsRead).toBe(9);
		expect(p.barsJoined).toBe(7);
		expect(p.stands).toBe(true);
		expect(profile(reading([3, 3, 3, 2, 4, 5, 2, 4, 5])).stands).toBe(false);
	});
	it("declaredBarSec follows Study 36b: 6/8 two dotted quarters, 3/4 three, 4/4 four", () => {
		expect(declaredBarSec(120, "4/4")).toBe(2);
		expect(declaredBarSec(120, "3/4")).toBe(1.5);
		expect(declaredBarSec(48, "6/8")).toBe(2.5);
	});
});
