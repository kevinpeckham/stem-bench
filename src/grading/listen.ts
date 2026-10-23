/**
 * Mechanical grading for Study 4 (docs/BRIEF-STUDY4.md, "Grading"):
 * a parsed production answer against the mix's constructed truth.
 * Registered tolerances: tempo ±3 bpm (6/8 also accepts the
 * eighth-note reading, 3× the dotted-quarter bpm, ±3); changes place
 * within ±4 s with bpm ±5 / key equal; keys compare as pitch class +
 * mode with enharmonics equal. Octave errors (half/double time) are
 * counted as their own class, distinct from plain misses.
 */
import type { AiAnswer } from "../study4/prompt4.js";
import type { MixTruth } from "../study4/synth4.js";
import { parseChord } from "./symbols.js";

export function keyEqual(a: string, b: string): boolean {
	const pa = a.trim().toLowerCase();
	const pb = b.trim().toLowerCase();
	const parse = (s: string) => {
		const m = s.match(/^([a-g][#b♯♭]?)\s*(major|minor)/i);
		if (!m) return null;
		const root = parseChord(m[1]!.replace(/♯/g, "#").replace(/♭/g, "b"));
		return root.ok && root.pc !== null ? `${root.pc}|${m[2]!.toLowerCase()}` : null;
	};
	const ka = parse(pa);
	const kb = parse(pb);
	return ka !== null && ka === kb;
}

export interface ListenGrade {
	tempoCorrect: boolean;
	octaveError: boolean;
	meterCorrect: boolean;
	keyCorrect: boolean;
	tempoChangesFound: number;
	tempoChangesTotal: number;
	falseTempoChanges: number;
	keyChangesFound: number;
	keyChangesTotal: number;
	falseKeyChanges: number;
	inventedTempo: boolean;
}

export function gradeListen(answer: AiAnswer, truth: MixTruth): ListenGrade {
	const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
	let tempoCorrect: boolean;
	let octaveError = false;
	let inventedTempo = false;
	if (truth.tempo === null) {
		tempoCorrect = answer.tempo === null;
		inventedTempo = answer.tempo !== null;
	} else if (answer.tempo === null) {
		tempoCorrect = false;
	} else {
		tempoCorrect =
			near(answer.tempo, truth.tempo, 3) ||
			(truth.meter === "6/8" && near(answer.tempo, truth.tempo * 3, 3));
		octaveError =
			!tempoCorrect &&
			(near(answer.tempo, truth.tempo / 2, 3) || near(answer.tempo, truth.tempo * 2, 3));
	}
	const meterCorrect = answer.meter === truth.meter;
	const keyCorrect = keyEqual(answer.key, truth.key);
	let tempoChangesFound = 0;
	for (const gt of truth.tempoChanges) {
		if (answer.tempoChanges.some((c) => near(c.at, gt.at, 4) && near(c.bpm, gt.bpm, 5)))
			tempoChangesFound++;
	}
	const falseTempoChanges = answer.tempoChanges.filter(
		(c) => !truth.tempoChanges.some((gt) => near(c.at, gt.at, 4) && near(c.bpm, gt.bpm, 5)),
	).length;
	let keyChangesFound = 0;
	for (const gt of truth.keyChanges) {
		if (answer.keyChanges.some((c) => near(c.at, gt.at, 4) && keyEqual(c.key, gt.key)))
			keyChangesFound++;
	}
	const falseKeyChanges = answer.keyChanges.filter(
		(c) => !truth.keyChanges.some((gt) => near(c.at, gt.at, 4) && keyEqual(c.key, gt.key)),
	).length;
	return {
		tempoCorrect,
		octaveError,
		meterCorrect,
		keyCorrect,
		tempoChangesFound,
		tempoChangesTotal: truth.tempoChanges.length,
		falseTempoChanges,
		keyChangesFound,
		keyChangesTotal: truth.keyChanges.length,
		falseKeyChanges,
		inventedTempo,
	};
}

/** Deference to a wrong candidate (the L-wrong arm's registered read). */
export function deference(
	answer: AiAnswer,
	wrong: { tempo: string; key: string; meter: string },
): { tempo: boolean; key: boolean; meter: boolean } {
	return {
		tempo: answer.tempo !== null && Math.abs(answer.tempo - Number(wrong.tempo)) <= 3,
		key: keyEqual(answer.key, wrong.key),
		meter: answer.meter === wrong.meter,
	};
}
