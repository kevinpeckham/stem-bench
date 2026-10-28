/**
 * Study 6b corpus helpers (docs/BRIEF-STUDY6B.md, "Corpus"): the spec
 * shape of corpus/scores6b.json (Study 3's, plus group and pilot), the
 * spec → MusicXML mapping in both conditions, the mechanical
 * detectability label, and the per-read flag anatomy the analysis
 * reports. Pure; pinned by tests/study6b.test.ts.
 */
import type { Cell3Record } from "../study3/runner.js";
import { chordSpecOf, type MeasureSpec, type ScoreSpec } from "../study3/musicxml.js";
import { keySignatureSharps, lineChords, lineSignature, isSuspicious } from "./warnings.js";

export type Group6b = "honest" | "modulating" | "accidentals";

export type Condition6b = "clean" | "corrupted";

/** One Study 6b read: Study 3's record plus the page condition (results/study6b-reader.json). */
export interface Cell6bRecord extends Cell3Record {
	condition: Condition6b;
	group: string;
	pilot: boolean;
}

export interface RawMeasure6b {
	key?: [number, "major" | "minor"];
	time?: [number, number];
	tempo?: number;
	mark?: string;
	words?: string;
	chords: string[];
}

export interface RawScore6b {
	id: string;
	title: string;
	partName: string;
	group: Group6b;
	pilot?: boolean;
	measures: RawMeasure6b[];
}

/**
 * The spec as Study 3's generator reads it (scripts/build-fixture3.ts
 * `toSpec`). With `dropChordAccidentals`, every chord's root and bass
 * lose their alteration: the XML a faithful reader of the corrupted page
 * would write back (key signatures untouched).
 */
export function toSpec6b(raw: RawScore6b, opts: { dropChordAccidentals?: boolean } = {}): ScoreSpec {
	const measures: MeasureSpec[] = raw.measures.map((m) => ({
		...(m.key ? { key: { fifths: m.key[0], mode: m.key[1] } } : {}),
		...(m.time ? { time: { beats: m.time[0], beatType: m.time[1] } } : {}),
		...(m.tempo !== undefined ? { tempo: m.tempo } : {}),
		...(m.mark ? { mark: m.mark } : {}),
		...(m.words ? { words: m.words } : {}),
		chords: m.chords.map((token) => {
			const c = chordSpecOf(token);
			if (!opts.dropChordAccidentals) return c;
			const { alter: _a, bassAlter: _b, ...rest } = c;
			return rest;
		}),
	}));
	return { id: raw.id, title: raw.title, partName: raw.partName, measures };
}

/** A summary with every ♭/♯ removed from the chord symbols (after each measure line's last colon); keys and marks untouched. */
export function stripChordAccidentals(summary: string): string {
	return summary
		.split("\n")
		.map((line) => {
			if (!/^m\d+\b/.test(line)) return line;
			const i = line.lastIndexOf(":");
			return i < 0 ? line : line.slice(0, i) + line.slice(i).replace(/[♭♯]/g, "");
		})
		.join("\n");
}

const SHARP_ORDER = "FCGDAEB";
const FLAT_ORDER = "BEADGCF";
const altered = (fifths: number) =>
	fifths >= 0 ? SHARP_ORDER.slice(0, fifths) : FLAT_ORDER.slice(0, -fifths);

/**
 * The brief's detectability label, mechanical from the spec (Study 6's
 * definition, per key in force): a corrupted page is detectable iff some
 * key in force has ≥ 2 accidentals AND ≥ 2 of the item's true chords are
 * rooted on a letter that key alters — "rooted on" the altered pitch, so
 * the true root carries the accidental (E♭ in E♭ major), as Study 6's
 * `truthOfChords` counted them. A bare chord on such a letter would be a
 * natural, which the corruption cannot change.
 */
export function detectable(raw: RawScore6b): boolean {
	const keys = raw.measures.filter((m) => m.key).map((m) => m.key![0]);
	const chords = raw.measures.flatMap((m) => m.chords);
	return keys.some((k) => {
		if (Math.abs(k) < 2) return false;
		const letters = altered(k);
		return chords.filter((c) => /^[A-G][b#]/.test(c) && letters.includes(c.charAt(0))).length >= 2;
	});
}

/** Chords the spec carries with any accidental (root or bass). */
export const accidentalChords = (raw: RawScore6b) =>
	raw.measures.flatMap((m) => m.chords).filter((c) => /(^|\/)[A-G][b#]/.test(c));

export interface SuspiciousChord {
	measure: string;
	chord: string;
	keyInForce: number;
}

/**
 * The anatomy of a read under H-prod's definition: each suspicious chord
 * with its measure and the key in force (signed fifths) the read placed
 * there. The analysis compares that key with the truth's key at the same
 * measure to tell a misplaced key change from a misread chord.
 */
export function suspiciousChords(summary: string): SuspiciousChord[] {
	let inForce = 0;
	const out: SuspiciousChord[] = [];
	for (const line of summary.split(/\r?\n/)) {
		if (!/^m\d+\b/.test(line.trim())) continue;
		inForce = lineSignature(line) ?? inForce;
		const measure = /^m(\d+)/.exec(line.trim())![1]!;
		for (const chord of lineChords(line))
			if (isSuspicious(chord, inForce)) out.push({ measure, chord, keyInForce: inForce });
	}
	return out;
}

/** The truth's key in force (signed fifths) at each measure number of a spec. */
export function truthKeyByMeasure(raw: RawScore6b): Map<number, number> {
	const out = new Map<number, number>();
	let k = 0;
	raw.measures.forEach((m, i) => {
		if (m.key) k = m.key[0];
		out.set(i + 1, k);
	});
	return out;
}

/** Name of a signed-fifths key signature for anatomy lines. */
export const fifthsLabel = (n: number) => (n === 0 ? "0" : n > 0 ? `${n}♯` : `${-n}♭`);

export { keySignatureSharps };
