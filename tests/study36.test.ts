import { describe, expect, test } from "bun:test";
import {
	downbeatF,
	foldCompare,
	median,
	meterSatisfied,
	meterStringClass,
	productionBeatsPerBar,
	summarizeTracker,
	uniformDownbeats,
} from "../src/study36/metrical.js";

describe("study 36 metrical graders", () => {
	test("median handles odd and even lengths", () => {
		expect(median([3, 1, 2])).toBe(2);
		expect(median([4, 1, 3, 2])).toBe(2.5);
	});

	test("summarizeTracker reads period, grouping and tempo from beat and downbeat times", () => {
		// 120 bpm, 4/4: beats every 0.5 s, downbeats every 2 s, with one jittered beat
		const beats = Array.from({ length: 17 }, (_, i) => i * 0.5);
		beats[5] = 2.53;
		const downbeats = [0, 2, 4, 6, 8];
		const s = summarizeTracker(beats, downbeats);
		expect(s.beatSec).toBeCloseTo(0.5, 6);
		expect(s.barSec).toBe(2);
		expect(s.beatsPerBar).toBe(4);
		expect(s.bpm).toBeCloseTo(120, 6);
		expect(summarizeTracker([1], []).beatSec).toBeNull();
		expect(summarizeTracker([0, 0.5], [1]).barSec).toBeNull();
	});

	test("foldCompare is strict at unity and folds at halves, doubles and thirds", () => {
		const exact = foldCompare(2.0, 2.0);
		expect(exact.strict).toBe(true);
		expect(exact.folded).toBe(true);
		expect(exact.ratio).toBe(1);
		const halved = foldCompare(1.0, 2.0); // estimate half the truth bar
		expect(halved.strict).toBe(false);
		expect(halved.folded).toBe(true);
		expect(halved.ratio).toBe(1 / 2);
		const tripled = foldCompare(7.5, 2.5); // the Study 35 6/8 units error
		expect(tripled.folded).toBe(true);
		expect(tripled.ratio).toBe(3);
		const off = foldCompare(2.3, 2.0); // 15 % off, no fold within 4 %
		expect(off.strict).toBe(false);
		expect(off.folded).toBe(false);
		expect(foldCompare(2.07, 2.0).strict).toBe(true); // 3.5 % inside
		expect(foldCompare(2.09, 2.0).strict).toBe(false); // 4.5 % outside
	});

	test("meterSatisfied follows the registered class rules", () => {
		expect(meterSatisfied(4, 4)).toBe(true);
		expect(meterSatisfied(8, 4)).toBe(true);
		expect(meterSatisfied(2, 4)).toBe(false);
		expect(meterSatisfied(3, 3)).toBe(true);
		expect(meterSatisfied(6, 3)).toBe(false);
		expect(meterSatisfied(6, "compound")).toBe(true);
		expect(meterSatisfied(2, "compound")).toBe(true);
		expect(meterSatisfied(3, "compound")).toBe(false);
		expect(meterSatisfied(null, 4)).toBe(false);
	});

	test("production meter strings map to classes and to the pipeline's beats per bar", () => {
		expect(meterStringClass("4/4")).toBe(4);
		expect(meterStringClass("3/4")).toBe(3);
		expect(meterStringClass("6/8")).toBe("compound");
		expect(meterStringClass("5/4")).toBeNull();
		expect(productionBeatsPerBar("6/8")).toBe(6);
		expect(productionBeatsPerBar("3/4")).toBe(3);
		expect(productionBeatsPerBar("4/4")).toBe(4);
	});

	test("downbeatF matches one-to-one within the window and ignores references outside the span", () => {
		const ref = [0, 2, 4, 6, 8];
		expect(downbeatF(ref, ref).f).toBe(1);
		const shifted = ref.map((r) => r + 0.05); // inside 70 ms
		expect(downbeatF(shifted, ref).f).toBe(1);
		const late = ref.map((r) => r + 0.1); // outside
		expect(downbeatF(late, ref).f).toBe(0);
		const halfTime = [0, 4, 8]; // every other downbeat
		const h = downbeatF(halfTime, ref);
		expect(h.precision).toBe(1);
		expect(h.recall).toBeCloseTo(0.6, 6);
		expect(h.f).toBeCloseTo(0.75, 6);
		// two estimates near one reference match only once
		const doubled = [0, 0.03, 2, 4, 6, 8];
		expect(downbeatF(doubled, ref).matched).toBe(5);
		// references past the audio end are ignored
		expect(downbeatF([0, 2], [0, 2, 4, 6], 0.07, 0, 3).f).toBe(1);
	});

	test("uniformDownbeats runs from bar one back to time zero and forward to the end", () => {
		const g = uniformDownbeats(0.5, 2, 7);
		expect(g).toEqual([0.5, 2.5, 4.5, 6.5]);
		const back = uniformDownbeats(4.1, 2, 5);
		expect(back[0]).toBeCloseTo(0.1, 9);
		expect(back.length).toBe(3);
	});
});
