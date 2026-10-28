/**
 * Study 6 instruments (docs/BRIEF-STUDY6.md). `chartReadWarnings` and
 * `keySignatureSharps` are VERBATIM ports of stem-shovel
 * src/lib/utils/chartReadWarnings.ts (Apache-2.0, at v0.192.0) — the
 * shipped heuristic under validation, pinned by tests/study6.test.ts.
 * `chartReadWarningsLetters` is the registered refinement under test
 * beside it: same floors, but the accidental-less chords must sit on
 * the key signature's OWN altered letters to count.
 */

const SHARPS_OF_MAJOR: Record<string, number> = {
	C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F♯": 6, "C♯": 7,
	F: -1, "B♭": -2, "E♭": -3, "A♭": -4, "D♭": -5, "G♭": -6, "C♭": -7,
};
const SHARPS_OF_MINOR: Record<string, number> = {
	A: 0, E: 1, B: 2, "F♯": 3, "C♯": 4, "G♯": 5, "D♯": 6, "A♯": 7,
	D: -1, G: -2, C: -3, F: -4, "B♭": -5, "E♭": -6, "A♭": -7,
};
const normalizeRoot = (root: string) => root.replace("b", "♭").replace("#", "♯");

export function keySignatureSharps(key: string): number | null {
	const m = /^([A-G][♭♯b#]?)\s+(major|minor)$/i.exec(key.trim());
	if (!m) return null;
	const root = normalizeRoot(m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1));
	const table = m[2]!.toLowerCase() === "minor" ? SHARPS_OF_MINOR : SHARPS_OF_MAJOR;
	return table[root] ?? null;
}

export function chartReadWarnings(summary: string): string[] {
	const warnings: string[] = [];
	const lines = summary.split(/\r?\n/);
	for (const line of lines) {
		const note = /^note:\s*(.+)$/i.exec(line.trim());
		if (note) warnings.push(`The reader notes: ${note[1]!.trim()}`);
	}
	let sharps = 0;
	let flats = 0;
	const chords: string[] = [];
	for (const line of lines) {
		if (!/^m\d+\b/.test(line.trim())) continue;
		for (const k of line.matchAll(/\bkey\s+([A-G][♭♯b#]?)\s+(major|minor)\b/gi)) {
			const n = keySignatureSharps(`${k[1]} ${k[2]}`);
			if (n === null) continue;
			sharps = Math.max(sharps, n);
			flats = Math.max(flats, -n);
		}
		const after = /:\s*([^:]*)$/.exec(line);
		if (!after) continue;
		for (const token of after[1]!.split(/\s+/))
			if (/^[A-G]/.test(token) && token !== "N.C.") chords.push(token);
	}
	const most = Math.max(sharps, flats);
	if (most >= 2 && chords.length >= 8) {
		const withAccidental = chords.filter((c) => /(^|\/)[A-G][♭♯b#]/.test(c)).length;
		if (withAccidental === 0)
			warnings.push(
				`The chart's key signature calls for ${most} ${sharps > flats ? "sharps" : "flats"}, yet none of its ${chords.length} chord symbols carries one: the file may have lost its accidentals when it was made (a PDF without music glyphs does this). Check the chart before using this answer.`,
			);
	}
	return warnings;
}

/** The first n altered letters of a signature: sharps F C G D A E B, flats B E A D G C F. */
export function alteredLetters(sharps: number, flats: number): Set<string> {
	const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
	const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];
	const out = new Set<string>();
	for (let i = 0; i < Math.min(7, sharps); i++) out.add(SHARP_ORDER[i]!);
	for (let i = 0; i < Math.min(7, flats); i++) out.add(FLAT_ORDER[i]!);
	return out;
}

/** The registered refinement: accidental-less chords only count on the signature's own altered letters. */
export function chartReadWarningsLetters(summary: string): string[] {
	const lines = summary.split(/\r?\n/);
	let sharps = 0;
	let flats = 0;
	const chords: string[] = [];
	for (const line of lines) {
		if (!/^m\d+\b/.test(line.trim())) continue;
		for (const k of line.matchAll(/\bkey\s+([A-G][♭♯b#]?)\s+(major|minor)\b/gi)) {
			const n = keySignatureSharps(`${k[1]} ${k[2]}`);
			if (n === null) continue;
			sharps = Math.max(sharps, n);
			flats = Math.max(flats, -n);
		}
		const after = /:\s*([^:]*)$/.exec(line);
		if (!after) continue;
		for (const token of after[1]!.split(/\s+/))
			if (/^[A-G]/.test(token) && token !== "N.C.") chords.push(token);
	}
	const most = Math.max(sharps, flats);
	if (most < 2 || chords.length < 8) return [];
	const letters = alteredLetters(sharps, flats);
	const suspicious = chords.filter(
		(c) => letters.has(c.charAt(0)) && !/^[A-G][♭♯b#]/.test(c),
	).length;
	if (suspicious >= 2)
		return [
			`${suspicious} chord symbols sit on the key signature's own altered letters without an accidental: the file may have lost its accidentals when it was made. Check the chart before using this answer.`,
		];
	return [];
}

/**
 * EXPLORATORY (post-hoc, not registered — disclosed as such in the
 * brief and REPORT): the key-IN-FORCE variant the mod-c anatomy
 * suggests. Chords are judged against the signature active at their
 * measure, so a modulating chart's sections each carry their own
 * altered letters; same ≥2-suspicious and ≥8-chords floors.
 */
export function chartReadWarningsScoped(summary: string): string[] {
	const lines = summary.split(/\r?\n/);
	let current = { sharps: 0, flats: 0 };
	let anyKey = false;
	let maxAccidentals = 0;
	let total = 0;
	let suspicious = 0;
	for (const line of lines) {
		if (!/^m\d+\b/.test(line.trim())) continue;
		for (const k of line.matchAll(/\bkey\s+([A-G][♭♯b#]?)\s+(major|minor)\b/gi)) {
			const n = keySignatureSharps(`${k[1]} ${k[2]}`);
			if (n === null) continue;
			anyKey = true;
			current = { sharps: Math.max(0, n), flats: Math.max(0, -n) };
			maxAccidentals = Math.max(maxAccidentals, Math.abs(n));
		}
		const after = /:\s*([^:]*)$/.exec(line);
		if (!after) continue;
		const letters = alteredLetters(current.sharps, current.flats);
		for (const token of after[1]!.split(/\s+/)) {
			if (!/^[A-G]/.test(token) || token === "N.C.") continue;
			total++;
			if (letters.has(token.charAt(0)) && !/^[A-G][♭♯b#]/.test(token)) suspicious++;
		}
	}
	if (!anyKey || maxAccidentals < 2 || total < 8 || suspicious < 2) return [];
	return [
		`${suspicious} chord symbols sit on their key's own altered letters without an accidental: the file may have lost its accidentals when it was made. Check the chart before using this answer.`,
	];
}
