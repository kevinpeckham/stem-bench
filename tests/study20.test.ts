/**
 * Study 20 instrument proofs (docs/BRIEF-STUDY20.md): the barmark strict
 * grade, the vocabulary reduction, the color candidate's rules, and the
 * two pins to the Study 18 port — the bar evidence (plus the matcher's
 * bass boost) must reproduce the stored matcher3 fields over all 440
 * fixture bars, and the forced-root scorer with no filter must equal
 * chordOf231 exactly.
 */
import { describe, expect, test } from "bun:test";
import fixture from "../corpus/fixture.json";
import vocab from "../models/study10/chordmini-config.json";
import type { Note } from "../src/fixture/chords.js";
import { type SongSpec, barStarts as fixtureBarStarts } from "../src/fixture/synth.js";
import { SHIPPED, chordOf231, chordsPerBar231 } from "../src/study18/chords231.js";
import {
	type BarEvidence,
	type Reduced,
	barEvidence,
	colorChord,
	forcedRootChord,
	reduceLabel,
} from "../src/study20/color20.js";
import { gradeStrict, strictSame } from "../src/study20/strict20.js";

describe("strictSame (barmark 0.17.0)", () => {
	test("colors and basses differ; enharmonics do not", () => {
		expect(strictSame("F#5", "F#")).toBe(false);
		expect(strictSame("D7sus4", "Dsus4")).toBe(false);
		expect(strictSame("G/B", "G")).toBe(false);
		expect(strictSame("C#", "Db")).toBe(true);
		expect(strictSame("Gb/Bb", "F#/A#")).toBe(true);
		expect(strictSame("F#5", "F#5")).toBe(true);
		expect(strictSame("Am7", "Amin7")).toBe(true);
		expect(strictSame("N.C.", "N.C.")).toBe(true);
		expect(strictSame("N.C.", "C")).toBe(false);
	});
	test("gradeStrict: either chart chord counts, first reported beside", () => {
		const truth = [["F#5", "Esus4"], ["Dm", ""], ["", ""]];
		const g = gradeStrict(["Esus4", "Dm", "N.C."], truth);
		expect(g).toEqual({ bars: 3, right: 3, strictFirstRight: 2 });
	});
});

describe("reduceLabel", () => {
	test("covers the whole 170-label vocabulary", () => {
		const families = new Map<Reduced, number>();
		for (const raw of (vocab as { chordVocab: string[] }).chordVocab) {
			const { rootPc, quality } = reduceLabel(raw);
			families.set(quality, (families.get(quality) ?? 0) + 1);
			if (raw === "N" || raw === "X") expect(rootPc).toBeNull();
			else expect(rootPc).not.toBeNull();
		}
		// 12 roots x {maj(+maj6), min(+min6+minmaj7), 7, maj7, min7, dim(+dim7+hdim7), aug, sus4, sus2} + N + X
		expect(families.get("maj")).toBe(24);
		expect(families.get("min")).toBe(36);
		expect(families.get("dim")).toBe(36);
		expect(families.get("N")).toBe(2);
		expect(reduceLabel("F#:min7")).toEqual({ rootPc: 6, quality: "min7" });
		expect(reduceLabel("C")).toEqual({ rootPc: 0, quality: "maj" });
	});
});

function ev(profile: number[], bass: number | null = null): BarEvidence {
	const p = new Float64Array(profile);
	let total = 0;
	for (const x of profile) total += x;
	return { profile: p, total, bass, bassWeight: 0 };
}

describe("colorChord rules", () => {
	const F_SHARP = 6;
	test("no third, fifth present: power chord", () => {
		const p = new Array(12).fill(0);
		p[6] = 10;
		p[1] = 6; // C#, the fifth
		expect(colorChord(F_SHARP, "maj", ev(p)).chord).toBe("F#5");
	});
	test("no third, fourth present: sus4 beats power", () => {
		const p = new Array(12).fill(0);
		p[6] = 10;
		p[11] = 4; // B, the fourth
		p[1] = 6;
		expect(colorChord(F_SHARP, "maj", ev(p)).chord).toBe("F#sus4");
	});
	test("no third or fourth, second present: sus2", () => {
		const p = new Array(12).fill(0);
		p[6] = 10;
		p[8] = 4; // G#, the second
		p[1] = 6;
		expect(colorChord(F_SHARP, "maj", ev(p)).chord).toBe("F#sus2");
	});
	test("the ninth-harmonic leak stays under the line", () => {
		const p = new Array(12).fill(0);
		p[6] = 10;
		p[1] = 6;
		p[8] = 1.7; // ~10% of 17: the leak, under 12% by design
		expect(colorChord(F_SHARP, "maj", ev(p)).chord).toBe("F#5");
	});
	test("the conservative flip needs twice the line", () => {
		const base = new Array(12).fill(0);
		base[6] = 10;
		base[1] = 5;
		const weak = [...base];
		weak[9] = 3; // minor third at ~16%: present, but not 2 x 12%
		const strong = [...base];
		strong[9] = 5; // ~25%: past twice the line
		expect(colorChord(F_SHARP, "maj", ev(weak)).flipped).toBe(false);
		expect(colorChord(F_SHARP, "maj", ev(weak)).chord).toBe("F#");
		const flipped = colorChord(F_SHARP, "maj", ev(strong));
		expect(flipped.flipped).toBe(true);
		expect(flipped.chord).toBe("F#m");
	});
	test("a model third present stands, both thirds present stands", () => {
		const p = new Array(12).fill(0);
		p[6] = 10;
		p[10] = 4; // A#, the major third
		p[1] = 5;
		expect(colorChord(F_SHARP, "maj", ev(p)).chord).toBe("F#");
		p[9] = 4; // A, the minor third too
		expect(colorChord(F_SHARP, "maj", ev(p)).chord).toBe("F#");
	});
	test("sevenths are the model's: 7 may become 7sus4, min7 stands", () => {
		const p = new Array(12).fill(0);
		p[2] = 10; // D
		p[7] = 4; // G, the fourth
		p[9] = 6; // A, the fifth
		expect(colorChord(2, "7", ev(p)).chord).toBe("D7sus4");
		expect(colorChord(2, "min7", ev(p)).chord).toBe("Dm7");
	});
	test("slash: a chord-tone bass with enough share, never a passing bass", () => {
		const p = new Array(12).fill(0);
		p[7] = 10; // G
		p[11] = 5; // B, the third
		p[2] = 5; // D, the fifth
		expect(colorChord(7, "maj", ev(p, 11)).chord).toBe("G/B");
		expect(colorChord(7, "maj", ev(p, 9)).chord).toBe("G"); // A is not a chord tone
		const thin = [...p];
		thin[11] = 3; // ~17%: present (over 12%), but under the 20% slash line
		expect(colorChord(7, "maj", ev(thin, 11)).chord).toBe("G");
	});
	test("N stays no chord; an empty profile leaves the model alone", () => {
		expect(colorChord(0, "N", ev(new Array(12).fill(0))).chord).toBe("N.C.");
		expect(colorChord(6, "min", ev(new Array(12).fill(0))).chord).toBe("F#m");
	});
});

interface FixtureSong {
	bpm: number;
	truth: string[];
	notes: [number, number, number, number][];
	matcher3PerBar: string[];
}

/** The fixture stores notes as [start, duration, pitch, amplitude] tuples. */
function notesOf(song: FixtureSong): Note[] {
	return song.notes.map(([start, duration, pitch, amplitude]) => ({
		start,
		end: start + duration,
		pitch,
		amplitude,
	}));
}

describe("pins to the Study 18 port", () => {
	test("barEvidence + the bass boost reproduces matcher3PerBar over all 440 bars", () => {
		let bars = 0;
		for (const song of (fixture as unknown as { songs: FixtureSong[] }).songs) {
			const starts = fixtureBarStarts({ bpm: song.bpm, chords: song.truth } as SongSpec);
			const notes = notesOf(song);
			let previous: string | undefined;
			for (let b = 0; b + 1 < starts.length; b++) {
				const e = barEvidence(notes, starts[b]!, starts[b + 1]!, SHIPPED.bassMinShare);
				const boosted = new Float64Array(e.profile);
				if (e.bass !== null) boosted[e.bass]! += e.bassWeight * 0.5;
				const { chord } = chordOf231(boosted, e.bass, previous, SHIPPED);
				previous = chord;
				expect(chord).toBe(song.matcher3PerBar[b]!);
				bars++;
			}
		}
		expect(bars).toBe(440);
	});
	test("forcedRootChord with no filter equals chordOf231 on every fixture bar", () => {
		for (const song of (fixture as unknown as { songs: FixtureSong[] }).songs) {
			const starts = fixtureBarStarts({ bpm: song.bpm, chords: song.truth } as SongSpec);
			const notes = notesOf(song);
			for (let b = 0; b + 1 < starts.length; b++) {
				const e = barEvidence(notes, starts[b]!, starts[b + 1]!, SHIPPED.bassMinShare);
				const boosted = new Float64Array(e.profile);
				if (e.bass !== null) boosted[e.bass]! += e.bassWeight * 0.5;
				const mine = forcedRootChord(boosted, e.bass, SHIPPED);
				const theirs = chordOf231(boosted, e.bass, undefined, SHIPPED);
				expect(mine).toEqual(theirs);
			}
		}
	});
	test("chordsPerBar231 agrees with the evidence chain (the segment expansion)", () => {
		const song = (fixture as unknown as { songs: FixtureSong[] }).songs[0]!;
		const starts = fixtureBarStarts({ bpm: song.bpm, chords: song.truth } as SongSpec);
		const perBar = new Array<string>(starts.length - 1).fill("N.C.");
		for (const s of chordsPerBar231(notesOf(song), starts, SHIPPED))
			for (let k = 0; k < s.bars && s.bar - 1 + k < perBar.length; k++) perBar[s.bar - 1 + k] = s.chord;
		expect(perBar).toEqual(song.matcher3PerBar);
	});
});
