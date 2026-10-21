/**
 * Chord symbols: parsing, enharmonic normalization and the registered
 * equivalence rule for grading (docs/BRIEF-STUDY1.md, "Grading").
 *
 * A symbol is graded as (pitch class of the root, canonical quality).
 * Enharmonic spellings are equal (C# = Db). A slash bass is ignored
 * (G/B grades as G: the synthesis plays root position, so the bass note
 * carries no information the root does not). Quality aliases map to the
 * template vocabulary stem-shovel's matcher emits; a quality outside it
 * (add9, 13, m7b5…) is kept verbatim and will simply not match a truth
 * label, which never uses one.
 */

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Canonical qualities: stem-shovel's template suffixes. */
export const QUALITIES = ["", "m", "7", "maj7", "m7", "sus4", "7sus4", "sus2", "dim", "aug", "5"];

const QUALITY_ALIASES: Record<string, string> = {
	"": "",
	maj: "",
	major: "",
	m: "m",
	min: "m",
	minor: "m",
	"-": "m",
	"7": "7",
	dom7: "7",
	maj7: "maj7",
	M7: "maj7",
	ma7: "maj7",
	"Δ7": "maj7",
	"Δ": "maj7",
	m7: "m7",
	min7: "m7",
	"-7": "m7",
	sus4: "sus4",
	sus: "sus4",
	"7sus4": "7sus4",
	"7sus": "7sus4",
	sus2: "sus2",
	dim: "dim",
	"°": "dim",
	o: "dim",
	aug: "aug",
	"+": "aug",
	"5": "5",
};

export interface ParsedChord {
	/** 0..11, C = 0; null for N.C. */
	pc: number | null;
	/** Canonical quality, or the verbatim suffix when unknown. */
	quality: string;
	/** False when the token could not be read as a chord at all. */
	ok: boolean;
}

const NC = /^n\.?c\.?$/i;

/** Parses one chord token. Unicode accidentals (♯/♭) read as #/b. */
export function parseChord(raw: string): ParsedChord {
	const token = raw.trim().replace(/♯/g, "#").replace(/♭/g, "b");
	if (NC.test(token)) return { pc: null, quality: "", ok: true };
	const m = token.match(/^([A-Ga-g])([#b]?)([^/]*)(?:\/.*)?$/);
	if (!m) return { pc: null, quality: "", ok: false };
	const letter = m[1]!.toUpperCase();
	let pc = LETTER_PC[letter]!;
	if (m[2] === "#") pc = (pc + 1) % 12;
	if (m[2] === "b") pc = (pc + 11) % 12;
	const suffix = m[3] ?? "";
	const quality = QUALITY_ALIASES[suffix] ?? QUALITY_ALIASES[suffix.toLowerCase()] ?? suffix;
	return { pc, quality, ok: true };
}

/** The registered equivalence: same root pitch class, same canonical quality. */
export function sameChord(a: string, b: string): boolean {
	const pa = parseChord(a);
	const pb = parseChord(b);
	if (!pa.ok || !pb.ok) return false;
	return pa.pc === pb.pc && pa.quality === pb.quality;
}

/** Template intervals per canonical quality (stem-shovel's TEMPLATES). */
export const INTERVALS: Record<string, number[]> = {
	"": [0, 4, 7],
	m: [0, 3, 7],
	"7": [0, 4, 7, 10],
	maj7: [0, 4, 7, 11],
	m7: [0, 3, 7, 10],
	sus4: [0, 5, 7],
	"7sus4": [0, 5, 7, 10],
	sus2: [0, 2, 7],
	dim: [0, 3, 6],
	aug: [0, 4, 8],
	"5": [0, 7],
};

/** ASCII spellings, stem-shovel's NAMES (mixed sharps and flats). */
export const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

/** Renders (pc, quality) in the house spelling. */
export function renderChord(pc: number, quality: string): string {
	return `${NAMES[pc]}${quality}`;
}

/**
 * The registered wrong-hint transform (docs/BRIEF-STUDY1.md): the root up a
 * perfect fourth, the quality kept — a diatonically plausible neighbor
 * (I→IV, V→I, vi→ii) that the bar's notes contradict. N.C. stays N.C.
 */
export function wrongHint(chord: string): string {
	const p = parseChord(chord);
	if (!p.ok || p.pc === null) return "N.C.";
	return renderChord((p.pc + 5) % 12, p.quality);
}
