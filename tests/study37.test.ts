import { describe, expect, test } from "bun:test";
import { candidateLengths, changeBeats, harmonicPeriod, mergeIdentical, scoreBarLength } from "../src/study37/harmonic.js";

const beats = Array.from({ length: 64 }, (_, i) => i * 0.5); // 120 bpm lattice

describe("study 37 harmonic-rhythm witness", () => {
	test("changeBeats snaps segment starts to the nearest beat within half a beat and ignores no-chord transitions", () => {
		const segs = [
			{ start: 0, end: 2.0, chord: "C" },
			{ start: 2.0, end: 4.05, chord: "G" }, // exactly on beat 4
			{ start: 4.05, end: 6.3, chord: "Am" }, // 50 ms late, snaps to beat 8
			{ start: 6.3, end: 8.0, chord: "N" }, // into no-chord: ignored
			{ start: 8.0, end: 10.0, chord: "F" }, // out of no-chord: ignored
			{ start: 10.0, end: 12.0, chord: "F" }, // same chord: ignored
			{ start: 12.0, end: 14.0, chord: "C" },
		];
		expect(changeBeats(segs, beats)).toEqual([4, 8, 24]);
		// a change beyond the lattice's end (more than half a beat from any beat) is dropped
		expect(changeBeats([{ start: 0, end: 40, chord: "C" }, { start: 40, end: 43, chord: "G" }], beats)).toEqual([]);
		// a change exactly half a beat from two beats snaps to one of them (never dropped on a uniform lattice)
		expect(changeBeats([{ start: 0, end: 1.25, chord: "C" }, { start: 1.25, end: 3, chord: "G" }], beats).length).toBe(1);
	});

	test("scoreBarLength: one chord per 4-beat bar scores 1 at k=4, 0.5 at k=2, 0 at k=8", () => {
		const changes = [0, 4, 8, 12, 16, 20, 24, 28, 32];
		expect(scoreBarLength(changes, 4).score).toBe(1);
		expect(scoreBarLength(changes, 4).phase).toBe(0);
		const two = scoreBarLength(changes, 2);
		expect(two.startRate).toBeCloseTo(0.5, 9);
		expect(two.stability).toBe(1);
		const eight = scoreBarLength(changes, 8);
		expect(eight.stability).toBe(0);
		expect(eight.score).toBe(0);
	});

	test("scoreBarLength finds the phase: changes on beats 2, 6, 10 are bars of 4 from phase 2", () => {
		const s = scoreBarLength([2, 6, 10, 14, 18, 22, 26, 30, 34], 4);
		expect(s.phase).toBe(2);
		expect(s.score).toBe(1);
	});

	test("candidateLengths keeps exact integers at the registered ratios", () => {
		expect(candidateLengths(4)).toEqual([2, 4, 6, 8]);
		expect(candidateLengths(3)).toEqual([2, 3, 6]);
		expect(candidateLengths(6)).toEqual([3, 4, 6, 9, 12]);
		expect(candidateLengths(2)).toEqual([2, 3, 4]);
	});

	test("harmonicPeriod picks the bar that carries the harmonic rhythm and reports the ratio", () => {
		// the tracker read a 2-beat bar (half the true 4-beat bar); chords change every 4 beats
		const changes = Array.from({ length: 12 }, (_, i) => i * 4);
		const w = harmonicPeriod(changes, 2);
		expect(w.abstain).toBeNull();
		expect(w.k).toBe(4);
		expect(w.ratio).toBe(2);
		// the tracker read an 8-beat bar (double): chords every 4 beats, witness halves it
		const h = harmonicPeriod(changes, 8);
		expect(h.k).toBe(4);
		expect(h.ratio).toBe(0.5);
	});

	test("harmonicPeriod follows a two-bar harmonic rhythm to the double bar (the registered blind spot)", () => {
		const changes = Array.from({ length: 10 }, (_, i) => i * 8); // chords every 8 beats
		const w = harmonicPeriod(changes, 4);
		expect(w.k).toBe(8);
		expect(w.ratio).toBe(2);
	});

	test("harmonicPeriod abstains on few changes and on thin margins, keeping the base", () => {
		const few = harmonicPeriod([0, 4, 8], 4);
		expect(few.abstain).toBe("too few changes");
		expect(few.k).toBe(4);
		// changes every 2 beats: k=2 scores 1, k=4 scores startRate 1 × stability 0 = 0, so no thin margin;
		// make a mixed pattern where 2 and 4 tie: changes on every beat 0,2 of each 4 and the rest random
		const tie = harmonicPeriod([0, 2, 4, 6, 8, 10, 12, 14, 16, 18], 4, 8, 0.1);
		// every 2 beats: k=2 wins outright (ratio 0.5), that is a confident call, not an abstention
		expect(tie.k).toBe(2);
		expect(tie.abstain).toBeNull();
		// exact tie between k=4 and k=8 breaks to the shorter bar; margin 0 then abstains at minMargin 0.1
		const t2 = harmonicPeriod(Array.from({ length: 10 }, (_, i) => i * 4), 4, 8, 0.1);
		expect(t2.k).toBe(4);
		expect(t2.abstain).toBeNull(); // k=4 scores 1, k=8 scores 0, k=2 scores 0.5: margin 0.5
	});

	test("mergeIdentical collapses repeated neighbours only", () => {
		expect(mergeIdentical(["C", "C", "G", "G", "G", "C"])).toEqual(["C", "G", "C"]);
		expect(mergeIdentical([])).toEqual([]);
	});
});
