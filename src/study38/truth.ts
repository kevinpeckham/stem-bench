/**
 * Study 38 (docs/BRIEF-STUDY38.md): truth adapters for the free-tempo
 * arm. Harte chord labels (GuitarSet JAMS, Schubert Winterreise
 * annotations) become the house symbols src/grading/symbols.ts parses,
 * and a timed chord sequence becomes the ordered list of sounding chords
 * the sequence graders compare against. Mechanical, unit-tested
 * (tests/study38.test.ts), no model.
 */

/** Harte shorthand → house quality suffix. Unknown shorthands keep their text (familyOf then says "other"). */
const HARTE_QUALITY: Record<string, string> = {
	maj: "",
	min: "m",
	"7": "7",
	maj7: "maj7",
	min7: "m7",
	dim: "dim",
	dim7: "dim7",
	hdim7: "m7b5",
	aug: "aug",
	sus4: "sus4",
	sus2: "sus2",
	maj6: "6",
	min6: "m6",
	"9": "9",
	maj9: "maj9",
	min9: "m9",
	"11": "11",
	"13": "13",
	minmaj7: "mMaj7",
	"5": "5",
	"1": "",
};

/** Scale degree → semitones above the root, for Harte bass intervals like "/3" or "/b7". */
const DEGREE_SEMITONES: Record<string, number> = { "1": 0, "2": 2, "3": 4, "4": 5, "5": 7, "6": 9, "7": 11 };
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

/**
 * "G:maj" → "G", "A:min7" → "Am7", "D:7/3" → "D7/F#", "E:min/b3" → "Em/G",
 * "C" → "C" (bare root is major in Harte), "N" and "X" → "N.C.".
 * Explicit interval lists "(1,3,5)" are not interpreted: the shorthand
 * before them decides, and a label that is only an interval list is kept
 * as its root with an empty quality.
 */
export function harteToSymbol(label: string): string {
	const t = label.trim();
	if (t === "N" || t === "X" || t === "") return "N.C.";
	const m = t.match(/^([A-G])([#b]*)(?::([a-z0-9]*))?(?:\(([^)]*)\))?(?:\/(.+))?$/);
	if (!m) return t;
	const root = m[1]!;
	const acc = m[2] ?? "";
	let pc = LETTER_PC[root]!;
	for (const a of acc) pc = (pc + (a === "#" ? 1 : 11)) % 12;
	const short = m[3] ?? "";
	const quality = short in HARTE_QUALITY ? HARTE_QUALITY[short]! : short;
	let out = `${NAMES[pc]}${quality}`;
	const bass = m[5];
	if (bass) {
		const bm = bass.match(/^([#b]*)([1-7])$/);
		if (bm) {
			let semis = DEGREE_SEMITONES[bm[2]!]!;
			for (const a of bm[1]!) semis += a === "#" ? 1 : -1;
			out += `/${NAMES[(pc + semis + 120) % 12]}`;
		}
	}
	return out;
}

export interface TimedChord {
	start: number;
	end: number;
	label: string;
}

/**
 * The ordered chord sequence a chart would print: house symbols in time
 * order with no-chord dropped and identical neighbours merged. This is
 * the "published" list for sequenceScore / sequenceScoreTransposed.
 */
export function chordSequence(timed: TimedChord[], from = -Infinity, to = Infinity): string[] {
	const out: string[] = [];
	for (const c of [...timed].sort((a, b) => a.start - b.start)) {
		if (c.end <= from || c.start >= to) continue;
		const s = harteToSymbol(c.label);
		if (s === "N.C.") continue;
		if (out[out.length - 1] !== s) out.push(s);
	}
	return out;
}

/** The chord sounding at each bar start (house symbol, "N.C." when none), for the per-bar view. */
export function chordAtBars(timed: TimedChord[], barStarts: number[]): string[] {
	const sorted = [...timed].sort((a, b) => a.start - b.start);
	return barStarts.map((t) => {
		const hit = sorted.find((c) => c.start <= t + 1e-6 && t < c.end);
		return hit ? harteToSymbol(hit.label) : "N.C.";
	});
}
