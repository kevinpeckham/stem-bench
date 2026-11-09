/**
 * Study 34 instrument proofs (docs/CORPUS-STUDY34.md): Harte symbols
 * convert, a JAAH part parses into bars on its own beat grid, the
 * transfer aligner recovers a known speed and offset, and the quality,
 * slash and section graders count mechanically.
 */
import { describe, expect, test } from "bun:test";
import { alignBeats } from "../src/study34/align.js";
import {
	bassPc,
	familyOf,
	pairBarsByTime,
	qualityFamily,
	qualityScore,
	rootOf,
	sectionScore,
	sequenceScore,
	sequenceScoreIntervals,
	slashScore,
} from "../src/study34/grade34.js";
import { harteToSymbol, parseJaah } from "../src/study34/jaah.js";
import { parseMidi } from "../src/study34/midi.js";
import { labelBar, midiBarChords } from "../src/study34/midichords.js";
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
	test("pairBarsByTime pairs by midpoint and survives different bar counts", () => {
		const truthBars = [
			{ start: 0, chords: ["C"] },
			{ start: 2, chords: ["F"] },
			{ start: 4, chords: ["G"] },
		];
		// draft grid shifted 0.3s and one bar short
		const { answers, truth } = pairBarsByTime([0.3, 2.3], ["C", "F"], truthBars);
		expect(answers).toEqual(["C", "F"]);
		expect(truth).toEqual([["C"], ["F"]]);
	});
	test("sequenceScore collapses repeats and takes the LCS over the projection", () => {
		const published = ["Dm", "C", "G/B", "Bbmaj7", "Am", "A"];
		// published roots collapse to [D C B Bb A] (Am and A share a root); draft misses G(B bass is dropped)
		const draft = ["Dm", "Dm", "C", "C", "Bb", "Am", "A7"];
		const roots = sequenceScore(draft, published, rootOf);
		expect(roots).toEqual({ right: 4, bearing: 5 });
		const families = sequenceScore(draft, published, familyOf);
		// published families: min maj maj maj min maj; draft: min maj maj min dom->... LCS over collapsed family runs
		expect(families.bearing).toBe(4); // min maj min maj after collapsing
	});
	test("sequenceScoreIntervals is blind to transposition", () => {
		const published = ["F", "Em", "G", "Am"];
		const draftTransposed = ["F#", "Fm", "G#", "A#m"]; // +1 semitone throughout
		const s = sequenceScoreIntervals(draftTransposed, published);
		expect(s).toEqual({ right: 3, bearing: 3 });
	});
});

describe("midi truth extraction", () => {
	// hand-built SMF: 4/4, two bars at 96 tpb — bar 1 C major (C4 E4 G4), bar 2 G7 (G3 B3 D4 F4)
	const makeMidi = (): Uint8Array => {
		const bytes: number[] = [];
		const push = (...b: number[]) => bytes.push(...b);
		push(0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 1, 0, 96);
		const track: number[] = [];
		const ev = (delta: number, ...rest: number[]) => {
			// vlq for deltas < 128 only
			track.push(delta, ...rest);
		};
		ev(0, 0xff, 0x58, 4, 4, 2, 24, 8); // 4/4
		for (const p of [60, 64, 67]) ev(0, 0x90, p, 80);
		track.push(0x83, 0x00, 0x80, 60, 0); // delta 384 = one bar
		for (const p of [64, 67]) ev(0, 0x80, p, 0);
		for (const p of [55, 59, 62, 65]) ev(0, 0x90, p, 80);
		track.push(0x83, 0x00, 0x80, 55, 0);
		for (const p of [59, 62, 65]) ev(0, 0x80, p, 0);
		ev(0, 0xff, 0x2f, 0);
		push(0x4d, 0x54, 0x72, 0x6b, 0, 0, (track.length >> 8) & 0xff, track.length & 0xff, ...track);
		return new Uint8Array(bytes);
	};
	test("parseMidi + midiBarChords labels the two bars", () => {
		const score = parseMidi(makeMidi());
		expect(score.ticksPerBeat).toBe(96);
		expect(score.timeSigs[0]).toEqual({ tick: 0, num: 4, den: 4 });
		expect(score.notes.length).toBe(7);
		const { bars, num } = midiBarChords(score);
		expect(num).toBe(4);
		expect(bars.map((b) => b.chords)).toEqual([["C"], ["G7"]]);
	});
	test("labelBar prefers the covering template and uses the bass tiebreak", () => {
		const mass = new Float32Array(12);
		for (const pc of [9, 0, 4]) mass[pc] = 1; // A C E
		expect(labelBar(mass, 9)).toBe("Am");
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
