/**
 * Study 10 registered graders (docs/BRIEF-STUDY10.md, "Registered
 * measures"), unit-tested in tests/study10.test.ts. Tempo: ±1 bpm of
 * any section's tempo, with 6/8 also accepting the eighth-note (3×)
 * reading — the program's Study 4 convention at DSP precision; octave
 * errors (±1 of double or half a truth tempo) a class apart. Keys as
 * Study 9 (any section's key). Chords: the full-vocabulary grade is
 * sameChord; the maj-min grade reduces both sides to root + third
 * class (major/minor/suspended-or-power/none) before comparing.
 */
import { keyEqual } from "../grading/listen.js";
import { parseChord } from "../grading/symbols.js";

export interface Truths {
	tempos: number[];
	meter: string;
	keys: string[];
}

export function tempoExact(bpm: number | null, t: Truths): boolean {
	if (bpm === null) return false;
	return t.tempos.some(
		(x) => Math.abs(bpm - x) <= 1 || (t.meter === "6/8" && Math.abs(bpm - 3 * x) <= 1),
	);
}

export function tempoOctave(bpm: number | null, t: Truths): boolean {
	if (bpm === null) return false;
	return t.tempos.some((x) => Math.abs(bpm - 2 * x) <= 1 || Math.abs(bpm - x / 2) <= 1);
}

export function keyRight(name: string, t: Truths): boolean {
	return t.keys.some((k) => keyEqual(name, k));
}

/** Root + third class: "", 7, maj7, aug → maj; m, m7, dim → min; sus/5 → sus. */
export function triadClass(chord: string): string {
	const p = parseChord(chord);
	if (!p.ok || p.pc === null) return "nc";
	if (["m", "m7", "dim"].includes(p.quality)) return `${p.pc}:min`;
	if (["sus2", "sus4", "7sus4", "5"].includes(p.quality)) return `${p.pc}:sus`;
	return `${p.pc}:maj`;
}

/** F-measure with greedy one-to-one matching at ±tol seconds. */
export function fMeasure(pred: number[], truth: number[], tol: number): number {
	let hits = 0;
	const used = new Set<number>();
	for (const p of pred) {
		const i = truth.findIndex((t, k) => !used.has(k) && Math.abs(t - p) <= tol);
		if (i >= 0) {
			used.add(i);
			hits++;
		}
	}
	const prec = pred.length ? hits / pred.length : 0;
	const rec = truth.length ? hits / truth.length : 0;
	return prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
}
