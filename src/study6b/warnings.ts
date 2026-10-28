/**
 * Study 6b instruments (docs/BRIEF-STUDY6B.md).
 *
 * - `chartReadWarningsProd` (H-prod) and `keySignatureSharps` are VERBATIM
 *   ports of stem-shovel src/lib/utils/chartReadWarnings.ts (Apache-2.0,
 *   Lightning Jar) at commit b2452d6 (2026-10-28), the rule production
 *   shipped: each chord is judged against the key IN FORCE at its measure
 *   (the latest `key <K> major|minor` at or before the line; a line's own
 *   mark applies to its chords, the last known mark on a line counts). A
 *   chord is suspicious when that key has ≥ 2 accidentals, its root letter
 *   is one the key alters (first n of F C G D A E B for sharps, of
 *   B E A D G C F for flats) and the root carries none; a slash bass is
 *   not judged. The warning wants ≥ 8 chords, ≥ 2 suspicious, and no
 *   accidental anywhere (root or bass). Pinned by tests/study6b.test.ts
 *   with stem-shovel's own test cases. Logic and text are unchanged; the
 *   only edits are the export name (`chartReadWarnings` →
 *   `chartReadWarningsProd`, so it can sit beside Study 6's instruments)
 *   and `export` on the private helpers, which the anatomy reuses.
 * - `chartReadWarningsScoped` (H-scoped) is Study 6's exploratory variant,
 *   re-exported unchanged from src/study6/warnings.ts as the comparison.
 *
 * Where they differ. The brief's "Instruments" names the one condition
 * that separates them: H-prod also requires that no chord in the chart
 * carries an accidental on its root or bass. Reading the two sources side
 * by side shows a second, smaller difference the brief does not name:
 * H-scoped judges a chord against its key in force whatever that key's
 * size (a bare F under G major counts as suspicious once the chart has a
 * ≥ 2-accidental key anywhere), while H-prod judges only under a key in
 * force of ≥ 2 accidentals. Both differences point the same way: H-prod's
 * suspicious set is a subset of H-scoped's and its firing condition is
 * stricter, so H-prod never flags a read H-scoped leaves quiet (tested as
 * a property). The Study 6b corpus puts no bare chord on a one-accidental
 * key's altered letter, so on clean pages the second difference cannot
 * act; on reads it is reported with the first, labeled.
 */
export { chartReadWarningsScoped } from "../study6/warnings.js";

const SHARPS_OF_MAJOR: Record<string, number> = {
	C: 0,
	G: 1,
	D: 2,
	A: 3,
	E: 4,
	B: 5,
	"F♯": 6,
	"C♯": 7,
	F: -1,
	"B♭": -2,
	"E♭": -3,
	"A♭": -4,
	"D♭": -5,
	"G♭": -6,
	"C♭": -7,
};
const SHARPS_OF_MINOR: Record<string, number> = {
	A: 0,
	E: 1,
	B: 2,
	"F♯": 3,
	"C♯": 4,
	"G♯": 5,
	"D♯": 6,
	"A♯": 7,
	D: -1,
	G: -2,
	C: -3,
	F: -4,
	"B♭": -5,
	"E♭": -6,
	"A♭": -7,
};
const normalizeRoot = (root: string) => root.replace("b", "♭").replace("#", "♯");

/** The signature's count of sharps (positive) or flats (negative) for a key such as "A♭ major" or "F# minor"; null when unknown. */
export function keySignatureSharps(key: string): number | null {
	const m = /^([A-G][♭♯b#]?)\s+(major|minor)$/i.exec(key.trim());
	if (!m) return null;
	const root = normalizeRoot(m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1));
	const table = m[2]!.toLowerCase() === "minor" ? SHARPS_OF_MINOR : SHARPS_OF_MAJOR;
	return table[root] ?? null;
}

const SHARP_ORDER = "FCGDAEB";
const FLAT_ORDER = "BEADGCF";

/** The letters a signature alters: the first n of F C G D A E B for n sharps, of B E A D G C F for n flats. */
export function alteredLetters(sharps: number): string {
	return sharps >= 0 ? SHARP_ORDER.slice(0, sharps) : FLAT_ORDER.slice(0, -sharps);
}

const KEY_MARK = /\bkey\s+([A-G][♭♯b#]?)\s+(major|minor)\b/gi;

/** The last known key signature a measure line marks, or null when it marks none. */
export function lineSignature(line: string): number | null {
	let found: number | null = null;
	for (const k of line.matchAll(KEY_MARK)) found = keySignatureSharps(`${k[1]} ${k[2]}`) ?? found;
	return found;
}

/** The chord symbols after a measure line's last colon (N.C. left out). */
export function lineChords(line: string): string[] {
	const after = /:\s*([^:]*)$/.exec(line);
	if (!after) return [];
	return after[1]!.split(/\s+/).filter((t) => /^[A-G]/.test(t) && t !== "N.C.");
}

/** A chord rooted on a letter the key in force alters, printed without an accidental. */
export function isSuspicious(chord: string, sharps: number): boolean {
	if (Math.abs(sharps) < 2) return false;
	return alteredLetters(sharps).includes(chord.charAt(0)) && !/^[A-G][♭♯b#]/.test(chord);
}

/** The chords and how many of them look suspicious against the key in force at their measure. */
function scanChords(lines: string[]): { chords: string[]; suspicious: number } {
	let inForce = 0;
	let suspicious = 0;
	const chords: string[] = [];
	for (const line of lines) {
		if (!/^m\d+\b/.test(line.trim())) continue;
		inForce = lineSignature(line) ?? inForce;
		for (const chord of lineChords(line)) {
			chords.push(chord);
			if (isSuspicious(chord, inForce)) suspicious++;
		}
	}
	return { chords, suspicious };
}

export function chartReadWarningsProd(summary: string): string[] {
	const lines = summary.split(/\r?\n/);
	const warnings: string[] = [];
	for (const line of lines) {
		const note = /^note:\s*(.+)$/i.exec(line.trim());
		if (note) warnings.push(`The reader notes: ${note[1]!.trim()}`);
	}
	const { chords, suspicious } = scanChords(lines);
	const anyAccidental = chords.some((c) => /(^|\/)[A-G][♭♯b#]/.test(c));
	if (chords.length >= 8 && suspicious >= 2 && !anyAccidental)
		warnings.push(
			`The chart's key signature calls for sharps or flats, yet none of its ${chords.length} chord symbols carries one where the key would: the file may have lost its accidentals when it was made (a PDF without music glyphs does this), or the reader misread them. Check the chart before using this answer.`,
		);
	return warnings;
}

/** Which of an instrument's warnings is the dropped-accidentals flag (not a Note line). */
export const DROP_FLAG = /lost its accidentals|without an accidental/;
export const firesProd = (summary: string) => chartReadWarningsProd(summary).some((w) => DROP_FLAG.test(w));
