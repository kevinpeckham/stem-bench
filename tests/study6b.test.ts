import { describe, expect, test } from "bun:test";
import scores6b from "../corpus/scores6b.json";
import fixture6b from "../corpus/fixture6b.json";
import { scoreXml } from "../src/study3/musicxml.js";
import { musicXmlSummary } from "../src/study3/musicXmlSummary.js";
import {
	accidentalChords,
	detectable,
	stripChordAccidentals,
	suspiciousChords,
	toSpec6b,
	type RawScore6b,
} from "../src/study6b/corpus.js";
import {
	chartReadWarningsProd as chartReadWarnings,
	chartReadWarningsScoped,
	DROP_FLAG,
	keySignatureSharps,
} from "../src/study6b/warnings.js";

const raws = scores6b.scores as RawScore6b[];
const items = fixture6b.items as {
	id: string;
	group: string;
	pilot: boolean;
	detectable: boolean;
	summary: string;
	corruptSummary: string;
	pdf: string;
	pdfCorrupt: string;
}[];
const fires = (fn: (s: string) => string[], s: string) => fn(s).some((w) => DROP_FLAG.test(w));

// ── H-prod pinned by stem-shovel's own cases (src/lib/utils/chartReadWarnings.test.ts at b2452d6), ported one for one.
const clean = `Title: Exiles
Part: Lead sheet
m1 key E♭ major 4/4 tempo 96 [A Verse]: E♭ B♭/D Cm7 A♭
m5: E♭ Gm7 A♭ B♭7
m9 [B Chorus]: A♭maj7 B♭ Gm Cm
m13: Fm7 B♭sus4 B♭ E♭`;

describe("chartReadWarningsProd (H-prod, stem-shovel b2452d6, pinned by production's own cases)", () => {
	test("a key's signature: sharps positive, flats negative, minors by their relative major, unknown null", () => {
		expect(keySignatureSharps("D major")).toBe(2);
		expect(keySignatureSharps("Ab major")).toBe(-4);
		expect(keySignatureSharps("F# minor")).toBe(3);
		expect(keySignatureSharps("d minor")).toBe(-1);
		expect(keySignatureSharps("atonal")).toBeNull();
	});

	test("a clean read raises nothing", () => {
		expect(chartReadWarnings(clean)).toEqual([]);
	});

	test("a signature of flats with every chord printed natural is the dropped-accidentals signature", () => {
		const corrupt = clean
			.split("\n")
			.map((line) => {
				const i = line.lastIndexOf(":");
				return i < 0 ? line : line.slice(0, i) + line.slice(i).replaceAll("♭", "");
			})
			.join("\n");
		const warnings = chartReadWarnings(corrupt);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toMatch(
			/calls for sharps or flats, yet none of its 16 chord symbols carries one where the key would/,
		);
		expect(warnings[0]).toMatch(/or the reader misread them/);
		expect(chartReadWarnings("m1 key E major 4/4: E A B E\nm5: E A B")).toEqual([]);
		expect(chartReadWarnings(`m1 key G major 4/4: G C D Em\nm5: G C D G\nm9: C D G Em`)).toEqual([]);
		expect(chartReadWarnings(`m1 key Bb major 4/4: F C Dm C/Bb\nm5: F C Dm C\nm9: F C Dm C`)).toEqual([]);
	});

	test("an honest D-major chart of natural chords raises nothing (stem-bench Study 6's false-alarm class)", () => {
		const dMajor = `m1 key D major 4/4 tempo 100: D G A D
m5: Bm G Em A
m9: D A Bm G
m13: Em A D D`;
		expect(chartReadWarnings(dMajor)).toEqual([]);
	});

	test("a modulating chart is judged section by section, against the key in force", () => {
		const modulating = `m1 key G major 4/4: G C D G
m5: Em C D G
m9 key D major: D G A D
m13: Bm G A D`;
		expect(chartReadWarnings(modulating)).toEqual([]);
		const misplaced = `m1 key D major 4/4: G C D G
m5: Em C D G
m9: D G A D
m13: Bm G A D`;
		expect(chartReadWarnings(misplaced)).toHaveLength(1);
	});

	test("an A♭-major read with every chord printed natural is flagged", () => {
		const lostFlats = `m1 key A♭ major 4/4 tempo 88: A D E A
m5: Fm D E A
m9: B Cm D E
m13: A Fm B E`;
		expect(chartReadWarnings(lostFlats)).toHaveLength(1);
		expect(chartReadWarnings(`m1 key A♭ major 4/4: A Fm Cm Fm\nm5: Cm Fm Cm Fm`)).toEqual([]);
	});

	test("the reader's Note lines come through as warnings", () => {
		expect(chartReadWarnings(`${clean}\nNote: page 3 is too blurred to read.`)).toEqual([
			"The reader notes: page 3 is too blurred to read.",
		]);
	});
});

describe("H-prod against H-scoped (the comparison instrument)", () => {
	test("the extra condition: one accidental anywhere silences H-prod, not H-scoped", () => {
		const restored = `m1 key E♭ major 4/4: E A B7 E\nm5: Cm A♭ B7 E\nm9: A B E E`;
		expect(fires(chartReadWarningsScoped, restored)).toBe(true);
		expect(fires(chartReadWarnings, restored)).toBe(false);
	});

	test("H-prod never flags a read H-scoped leaves quiet, over every corpus summary and its variants", () => {
		const texts: string[] = [];
		for (const it of items) {
			texts.push(it.summary, it.corruptSummary, stripChordAccidentals(it.summary));
			// The misplaced-modulation shape: every key mark moved to measure 1's line.
			const lines = it.summary.split("\n");
			const keys = lines.flatMap((l) => [...l.matchAll(/key \S+ (?:major|minor)/g)].map((m) => m[0]));
			const moved = lines.map((l) => l.replace(/ key \S+ (?:major|minor)/g, ""));
			const m1 = moved.findIndex((l) => l.startsWith("m1"));
			if (m1 >= 0 && keys.length) moved[m1] = moved[m1]!.replace(/^m1/, `m1 ${keys.at(-1)}`);
			texts.push(moved.join("\n"), stripChordAccidentals(moved.join("\n")));
		}
		for (const t of texts) if (fires(chartReadWarnings, t)) expect(fires(chartReadWarningsScoped, t)).toBe(true);
	});
});

describe("the Study 6b corpus", () => {
	test("24 items, 8 per group, 2 pilot items per group, ids unique, fixture in spec order", () => {
		expect(raws).toHaveLength(24);
		expect(new Set(raws.map((r) => r.id)).size).toBe(24);
		for (const g of ["honest", "modulating", "accidentals"]) {
			expect(raws.filter((r) => r.group === g)).toHaveLength(8);
			expect(raws.filter((r) => r.group === g && r.pilot)).toHaveLength(2);
		}
		expect(items.map((i) => i.id)).toEqual(raws.map((r) => r.id));
		expect(items.map((i) => `${i.group}|${i.pilot}`)).toEqual(raws.map((r) => `${r.group}|${r.pilot ?? false}`));
	});

	test("every item has ≥ 8 chords, a time signature and key on m1, and a rehearsal mark", () => {
		for (const r of raws) {
			expect(r.measures.flatMap((m) => m.chords).length).toBeGreaterThanOrEqual(8);
			expect(r.measures[0]!.time).toBeDefined();
			expect(r.measures[0]!.key).toBeDefined();
			expect(r.measures.some((m) => m.mark)).toBe(true);
		}
		expect(raws.some((r) => r.measures.some((m) => m.tempo !== undefined))).toBe(true);
	});

	test("the groups are what the brief lays out", () => {
		const altered = (k: number) => (k >= 0 ? "FCGDAEB".slice(0, k) : "BEADGCF".slice(0, -k));
		for (const r of raws) {
			const keys = r.measures.filter((m) => m.key).map((m) => m.key![0]);
			// No chord anywhere sits bare on a letter its key in force alters (honest pages, whatever the group).
			let k = 0;
			for (const m of r.measures) {
				if (m.key) k = m.key[0];
				for (const c of m.chords) if (!/^[A-G][b#]/.test(c)) expect(altered(k)).not.toContain(c.charAt(0));
			}
			if (r.group === "honest") {
				expect(new Set(keys).size).toBe(1);
				expect(Math.abs(keys[0]!)).toBeGreaterThanOrEqual(2);
				expect(accidentalChords(r)).toEqual([]);
			}
			if (r.group === "modulating") {
				expect(keys.length).toBeGreaterThanOrEqual(2);
				expect(keys.length).toBeLessThanOrEqual(3);
				expect(keys.some((x) => Math.abs(x) >= 2)).toBe(true);
				expect(r.measures.length).toBeGreaterThanOrEqual(10);
				expect(r.measures.length).toBeLessThanOrEqual(16);
				expect(accidentalChords(r)).toEqual([]);
			}
			if (r.group === "accidentals") {
				expect(Math.abs(keys[0]!)).toBeGreaterThanOrEqual(2);
				expect(accidentalChords(r).length).toBeGreaterThanOrEqual(2);
			}
		}
	});

	test("detectability labels follow the brief's definition: the third group's corrupted pages and only those", () => {
		for (const r of raws) expect(detectable(r)).toBe(r.group === "accidentals");
		for (const it of items) expect(it.detectable).toBe(it.group === "accidentals");
		// The definition itself, on hand-made specs.
		const spec = (key: number, chords: string[]): RawScore6b => ({
			id: "t",
			title: "T",
			partName: "P",
			group: "honest",
			measures: chords.map((c, i) => ({ ...(i === 0 ? { key: [key, "major"] as [number, "major"] } : {}), chords: [c] })),
		});
		expect(detectable(spec(-3, ["Eb", "Ab", "Cm", "Fm"]))).toBe(true);
		expect(detectable(spec(-3, ["Eb", "Cm", "Fm", "Gm"]))).toBe(false); // one altered-letter chord
		expect(detectable(spec(-1, ["F", "Bb", "Bb", "C"]))).toBe(false); // one-flat key
		expect(detectable(spec(2, ["D", "G", "A", "Bm"]))).toBe(false); // bare chords only
		expect(detectable(spec(3, ["A", "F#m", "C#m", "E"]))).toBe(true);
	});

	test("the fixture's clean summaries are production's summary of the clean XML", () => {
		for (const [i, r] of raws.entries()) expect(items[i]!.summary).toBe(musicXmlSummary(scoreXml(toSpec6b(r))));
	});

	test("the corrupted summary of every item equals the clean one with the chord accidentals removed", () => {
		for (const it of items) {
			expect(it.corruptSummary).toBe(stripChordAccidentals(it.summary));
			// Keys survive the corruption.
			expect(it.corruptSummary.match(/key \S+ (?:major|minor)/g)).toEqual(it.summary.match(/key \S+ (?:major|minor)/g));
		}
	});

	test("the truth texts sit where the brief predicts: clean truths quiet, detectable corrupted truths flagged by both instruments", () => {
		for (const it of items) {
			expect(fires(chartReadWarnings, it.summary)).toBe(false);
			expect(fires(chartReadWarningsScoped, it.summary)).toBe(false);
			expect(fires(chartReadWarnings, it.corruptSummary)).toBe(it.detectable);
			expect(fires(chartReadWarningsScoped, it.corruptSummary)).toBe(it.detectable);
		}
	});

	test("suspiciousChords names H-prod's suspicious chords with their measure and key in force", () => {
		expect(suspiciousChords("m1 key D major 4/4: G\nm2: C\nm3: F\nm4 key G major: C\nm5: F")).toEqual([
			{ measure: "2", chord: "C", keyInForce: 2 },
			{ measure: "3", chord: "F", keyInForce: 2 },
		]);
	});
});
