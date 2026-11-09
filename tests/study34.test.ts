/**
 * Study 34 instrument proofs (docs/CORPUS-STUDY34.md): Harte symbols
 * convert, a JAAH part parses into bars on its own beat grid, the
 * transfer aligner recovers a known speed and offset, and the quality,
 * slash and section graders count mechanically.
 */
import { describe, expect, test } from "bun:test";
import { alignBeats } from "../src/study34/align.js";
import { bassPc, qualityFamily, qualityScore, sectionScore, slashScore } from "../src/study34/grade34.js";
import { harteToSymbol, parseJaah } from "../src/study34/jaah.js";
import {
	alignRigid,
	alignSequenceToTime,
	calibrateKeyGlobal,
	calibrateTransposition,
	chordTemplate,
	transposeSymbol,
	truthAtTime,
} from "../src/study34/seqalign.js";

describe("harteToSymbol", () => {
	test("maps the families and drops what the grading ignores", () => {
		expect(harteToSymbol("G:min").symbol).toBe("Gm");
		expect(harteToSymbol("D:7").symbol).toBe("D7");
		expect(harteToSymbol("Eb:maj").symbol).toBe("Eb");
		expect(harteToSymbol("C:hdim7").symbol).toBe("Cm7b5");
		expect(harteToSymbol("F:maj(9)").symbol).toBe("F");
		expect(harteToSymbol("N").symbol).toBe("N.C.");
		const inv = harteToSymbol("G:7/5");
		expect(inv.symbol).toBe("G7");
		expect(inv.droppedInversion).toBe(true);
	});
});

describe("parseJaah", () => {
	test("bars come from beats in metre groups, sections from parts", () => {
		const truth = parseJaah({
			title: "t",
			artist: "a",
			key: "C major",
			metre: "4/4",
			tuning: 440,
			duration: 10,
			parts: [
				{ name: "Intro", beats: [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5], chords: ["|C |G:7 |"] },
				{ name: "Theme", beats: [4.0, 4.5, 5.0, 5.5], chords: ["|F C |"] },
			],
		});
		expect(truth.bars.map((b) => b.start)).toEqual([0, 2.0, 4.0]);
		expect(truth.bars[1]!.chords).toEqual(["G7"]);
		expect(truth.bars[2]!.chords).toEqual(["F", "C"]);
		expect(truth.sections).toEqual([
			{ name: "Intro", bar: 0 },
			{ name: "Theme", bar: 2 },
		]);
	});
	test("a cell-count mismatch is an error, never a guess", () => {
		expect(() =>
			parseJaah({
				title: "t",
				artist: "a",
				key: "C",
				metre: "4/4",
				tuning: 440,
				duration: 4,
				parts: [{ name: "x", beats: [0, 1, 2, 3], chords: ["|C |G |"] }],
			}),
		).toThrow();
	});
});

describe("alignBeats", () => {
	test("recovers a known speed and offset", () => {
		const fps = 125;
		const scaleTrue = 1.012;
		const offsetTrue = 0.4;
		const beats = Array.from({ length: 40 }, (_, i) => i * 0.5);
		const env = new Float32Array(30 * fps);
		for (const b of beats) {
			const at = Math.round((b * scaleTrue + offsetTrue) * fps);
			if (at >= 0 && at < env.length) env[at] = 1;
		}
		const fit = alignBeats(beats, env, fps, 1.0);
		expect(Math.abs(fit.scale - scaleTrue)).toBeLessThan(0.002);
		expect(Math.abs(fit.offset - offsetTrue)).toBeLessThan(0.02);
		expect(fit.gain).toBeGreaterThan(5);
		expect(fit.contrast).toBeGreaterThan(3); // impulses at beats: half-beat off sees nothing
	});
});

describe("qualityFamily", () => {
	test("five families, extensions ignored", () => {
		expect(qualityFamily("")).toBe("maj");
		expect(qualityFamily("maj7")).toBe("maj");
		expect(qualityFamily("6")).toBe("maj");
		expect(qualityFamily("m")).toBe("min");
		expect(qualityFamily("m9")).toBe("min");
		expect(qualityFamily("7")).toBe("dom");
		expect(qualityFamily("13")).toBe("dom");
		expect(qualityFamily("dim7")).toBe("dim");
		expect(qualityFamily("m7b5")).toBe("dim");
		expect(qualityFamily("sus4")).toBe("sus");
		expect(qualityFamily("7sus4")).toBe("sus");
		expect(qualityFamily("5")).toBe("other");
	});
});

describe("the three graders", () => {
	test("qualityScore counts family matches over parsing truth bars", () => {
		const s = qualityScore(["C", "Gm", "D7"], [["C"], ["G"], ["D9"]]);
		expect(s).toEqual({ right: 2, bearing: 3 }); // C=maj ok, Gm vs G maj MISS, D7 vs D9 both dom ok
	});
	test("slashScore only grades bars whose truth writes a bass", () => {
		expect(bassPc("G/B")).toBe(11);
		const s = slashScore(["G/B", "C"], [["G/B"], ["C/E"]]);
		expect(s).toEqual({ right: 1, bearing: 2 });
	});
	test("sectionScore matches within one bar", () => {
		expect(sectionScore([0, 8, 16], [0, 9, 20])).toEqual({ right: 2, bearing: 3 });
	});
});

describe("seqalign", () => {
	// 10 fps synthetic chroma: C for 4 s, F for 6 s, G for 3 s, C for 5 s
	const plan: [string, number][] = [
		["C", 4],
		["F", 6],
		["G", 3],
		["C", 5],
	];
	const hopSec = 0.1;
	const makeFrames = (transpose: number): Float32Array[] => {
		const frames: Float32Array[] = [];
		for (const [chord, sec] of plan) {
			const tpl = chordTemplate(chord, transpose)!;
			for (let i = 0; i < sec / hopSec; i++) frames.push(tpl);
		}
		return frames;
	};
	test("recovers the boundaries of a known progression", () => {
		const { segments, score } = alignSequenceToTime(
			plan.map(([c]) => c),
			makeFrames(0),
			hopSec,
		);
		expect(segments.map((s) => s.chord)).toEqual(["C", "F", "G", "C"]);
		expect(Math.abs(segments[1]!.from - 4)).toBeLessThan(0.25);
		expect(Math.abs(segments[2]!.from - 10)).toBeLessThan(0.25);
		expect(Math.abs(segments[3]!.from - 13)).toBeLessThan(0.25);
		expect(score).toBeGreaterThan(0.95); // frames ARE the templates
	});
	test("calibrateTransposition finds a capo", () => {
		const { transpose } = calibrateTransposition(
			plan.map(([c]) => c),
			makeFrames(3),
			hopSec,
		);
		expect(transpose).toBe(3);
	});
	test("alignRigid recovers tempo and offset of a fixed chain", () => {
		// 30 units (short chains leave tempo/offset ties; length breaks them by drift)
		const chain = Array.from({ length: 30 }, (_, i) => ["C", "F", "G", "Am", "Dm", "E"][i % 6]!);
		const hopSec = 0.1;
		const unitTrue = 1.02;
		const offsetTrue = 1.5;
		const frames: Float32Array[] = [];
		const silent = new Float32Array(12);
		for (let t = 0; t < 400; t++) {
			const sec = t * hopSec;
			const u = Math.floor((sec - offsetTrue) / unitTrue);
			frames.push(u >= 0 && u < chain.length ? chordTemplate(chain[u]!)! : silent);
		}
		const fit = alignRigid(chain, frames, hopSec, 1.0);
		expect(Math.abs(fit.unitSec - unitTrue)).toBeLessThan(0.01);
		expect(Math.abs(fit.offset - offsetTrue)).toBeLessThan(0.15);
		expect(fit.contrast).toBeGreaterThan(1.1);
	});
	test("calibrateKeyGlobal finds a global transposition", () => {
		const chords = ["C", "F", "G", "Am"];
		const frames = chords.flatMap((c) => Array.from({ length: 20 }, () => chordTemplate(c, 4)!));
		const key = calibrateKeyGlobal(chords, frames);
		expect(key.transpose).toBe(4);
		expect(key.score - key.runnerUp).toBeGreaterThan(0.02);
	});
	test("truthAtTime reads segments; transposeSymbol keeps quality and bass", () => {
		const segs = [
			{ chord: "C", from: 0, to: 4 },
			{ chord: "F", from: 4, to: 10 },
		];
		expect(truthAtTime(segs, 5)).toBe("F");
		expect(truthAtTime(segs, 11)).toBe("");
		expect(transposeSymbol("Gm7", 2)).toBe("Am7");
		expect(transposeSymbol("G/B", 1)).toBe("Ab/C");
		expect(transposeSymbol("N.C.", 5)).toBe("N.C.");
	});
});
