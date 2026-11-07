/**
 * Study 20's strict grade (docs/BRIEF-STUDY20.md G1): two chord symbols
 * are the same exactly when barmark (the notation the band's charts are
 * written in; the published package at 0.17.0, aliased as barmark-0-17
 * because Study 16 pins the bare "barmark" dependency at 0.5.0, the
 * version the app consumes) parses both and they agree on root pitch
 * class, bass pitch class and interval set. So
 * F#5 differs from F#, D7sus4 from Dsus4 and G/B from G, while enharmonic
 * spellings (C# and Db, G/B and G/Cb) are equal. A bar with two chart
 * chords is strict-right on either (the detector emits one chord per
 * bar); strict-first is reported beside it, as every grade since
 * Study 13 has.
 */
import { parseChord } from "barmark-0-17";

const NOTE_PC: Record<string, number> = {
	C: 0, "B#": 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, Fb: 4,
	F: 5, "E#": 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10,
	Bb: 10, B: 11, Cb: 11,
};

function pcOf(note: string | null): number | null {
	if (!note) return null;
	return NOTE_PC[note] ?? null;
}

function key(symbol: string): string | null {
	const token = symbol.trim();
	if (token === "" || /^n\.?c\.?$/i.test(token)) return "rest";
	const parsed = parseChord(token);
	if (!parsed.ok) return null;
	const r = parsed.value;
	const root = pcOf(r.root);
	if (root === null) return null;
	const bass = pcOf(r.bass || null);
	const intervals = r.intervals
		.map((i) => `${i.degree}${i.alter >= 0 ? "+" : ""}${i.alter}`)
		.sort()
		.join(",");
	return `${root}|${bass ?? "-"}|${intervals}`;
}

/** The registered strict equivalence; a symbol barmark cannot parse equals nothing. */
export function strictSame(a: string, b: string): boolean {
	const ka = key(a);
	const kb = key(b);
	return ka !== null && kb !== null && ka === kb;
}

export interface StrictGrade {
	bars: number;
	right: number;
	strictFirstRight: number;
}

export function gradeStrict(answers: string[], truth: string[][]): StrictGrade {
	let right = 0;
	let first = 0;
	for (const [b, truthChords] of truth.entries()) {
		const a = answers[b] ?? "";
		const nonEmpty = truthChords.filter((t) => t !== "");
		if (nonEmpty.length === 0) {
			if (strictSame(a, "N.C.")) {
				right++;
				first++;
			}
			continue;
		}
		if (nonEmpty.some((t) => strictSame(t, a))) right++;
		if (strictSame(nonEmpty[0]!, a)) first++;
	}
	return { bars: truth.length, right, strictFirstRight: first };
}
