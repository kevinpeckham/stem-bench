import { describe, expect, it } from "bun:test";
import { barsOf, quantizeBar } from "../src/study48/bassLine.js";
import { composerGrid, fillBeats, gradeLines, gridAgreement, linesOf, songMode } from "../src/study50/grid.js";

describe("Study 50 composer's grid", () => {
	it("lays quarter-note beats from the tempo map and bar lines from the signatures, on the mix timeline", () => {
		// 120 bpm: two bars of 3/4, then 4/4 from 3 s; the mix starts 10 s later
		const g = composerGrid(
			[{ sec: 0, bpm: 120 }],
			[
				{ sec: 0, sig: "3/4" },
				{ sec: 3, sig: "4/4" },
			],
			7,
			10,
		);
		expect(g.beats.slice(0, 4)).toEqual([10, 10.5, 11, 11.5]);
		expect(g.beats).toHaveLength(14);
		expect(g.downbeats).toEqual([10, 11.5, 13, 15]);
		expect(g.duration).toBe(17);
	});
	it("follows a tempo change and refuses a signature not in quarters", () => {
		const g = composerGrid(
			[
				{ sec: 0, bpm: 120 },
				{ sec: 2, bpm: 60 },
			],
			[{ sec: 0, sig: "4/4" }],
			6,
			0,
		);
		expect(g.beats).toEqual([0, 0.5, 1, 1.5, 2, 3, 4, 5]);
		expect(g.downbeats).toEqual([0, 2]);
		expect(() => composerGrid([{ sec: 0, bpm: 120 }], [{ sec: 0, sig: "6/8" }], 4, 0)).toThrow();
	});
});

describe("Study 50 filled grid", () => {
	it("splits a double and a triple beat and leaves the rest and the bar lines", () => {
		const g = fillBeats({ beats: [0, 0.5, 1, 2, 2.5, 3, 3.5, 5, 5.5, 6], downbeats: [0, 2], duration: 6.5 });
		expect(g.beats).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]);
		expect(g.downbeats).toEqual([0, 2]);
		const steady = { beats: [0, 0.5, 1.02, 1.5], downbeats: [0], duration: 2 };
		expect(fillBeats(steady).beats).toEqual(steady.beats);
	});
});

describe("Study 50 subdivision rules", () => {
	const bars = barsOf([10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5], [10, 12], 14);
	const n = (start: number, pitch = 40) => ({ start, end: start + 0.12, pitch });
	// bar 1 in sixteenths; bar 2 has three onsets that sit nearer triplets
	const notes = [n(10), n(10.125), n(10.25), n(10.375), n(10.5), n(10.75), n(11), n(11.25), n(12), n(12.167), n(12.333)];
	it("chooses once for the song from all the onsets", () => {
		expect(songMode(notes, bars)).toBe("straight");
		expect(songMode([n(10), n(10.167), n(10.333), n(10.5), n(12), n(12.167)], bars)).toBe("triplet");
		expect(songMode([n(10.17)], bars)).toBe("straight");
	});
	it("per bar lets one bar go to triplets; per song holds the line to one grid", () => {
		expect(linesOf(notes, bars, "bar").map((l) => l.mode)).toEqual(["straight", "triplet"]);
		expect(linesOf(notes, bars, "song").map((l) => l.mode)).toEqual(["straight", "straight"]);
	});
	it("grades lines, counting a bar on different grids as wrong and its onsets as extra", () => {
		const truth = linesOf(notes, bars, "song");
		// the transcription misses one note, adds one, and gets one an octave up
		const est = [n(10), n(10.125), n(10.25), n(10.375), n(10.5), n(10.75, 52), n(11), n(11.5), n(12), n(12.167), n(12.333)];
		const same = gradeLines(truth, linesOf(est, bars, "song"));
		expect(same).toMatchObject({ bars: 2, right: 1, oneError: 0, wrong: 1, truthOnsets: 11, estOnsets: 11, found: 10, matched: 9, extra: 1, gridDiffers: 0, truthTriplet: 0, estTriplet: 0 });
		expect(same.slotF).toBeCloseTo(9 / 11, 9);
		const perBar = gradeLines(truth, linesOf(est, bars, "bar"));
		expect(perBar).toMatchObject({ right: 0, wrong: 2, gridDiffers: 1, estTriplet: 1, found: 7, matched: 6, extra: 4 });
		expect(gradeLines(truth, truth)).toMatchObject({ right: 2, matched: 11, slotF: 1 });
		expect(quantizeBar(notes, bars[1]!, "straight").onsets.size).toBe(3);
	});
});

describe("Study 50 grid agreement", () => {
	it("counts tracker beats on a composer beat, composer beats untracked, and bar lines agreed", () => {
		const composer = { beats: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], downbeats: [0, 2], duration: 4 };
		const tracker = { beats: [0.01, 0.52, 1.5, 2.2, 2.51, 3.02, 3.5], downbeats: [0.01, 1.5], duration: 4 };
		expect(gridAgreement(tracker, composer)).toEqual({ trackerBeats: 7, composerBeats: 8, trackerBeatsOnABeat: 6, composerBeatsUntracked: 2, trackerDownbeats: 2, composerDownbeats: 2, trackerDownbeatsOnADownbeat: 1, composerDownbeatsTracked: 1 });
	});
});
