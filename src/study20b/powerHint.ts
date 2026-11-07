/**
 * Study 20b instruments (docs/BRIEF-STUDY20B.md). Arm A is Study 20's
 * committed colorChord, called, not copied: a bar fires when the rule it
 * reports is "power". Arm B (the blind variant) recomputes only the
 * ABSENCE tests on a pitch-floored profile (notes at MIDI >= 45, the top
 * of the bass range, fixed blind before any held-out chart was seen);
 * the fifth test and all preconditions stay on the full profile.
 */
import type { Note } from "../fixture/chords.js";
import {
	type BarEvidence,
	type Reduced,
	SHIPPED20,
	barEvidence,
	colorChord,
} from "../study20/color20.js";

/** The blind floor: notes below A2 (110 Hz) carry the smear, not the color. */
export const VARIANT_PITCH_FLOOR = 45;

export interface HintFire {
	fires: boolean;
	/** The hint symbol when it fires: root + "5". */
	symbol: string | null;
}

const PC_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

/** Arm A: Study 20's power rule, verbatim via the committed instrument. */
export function frozenPowerHint(
	rootPc: number | null,
	quality: Reduced,
	ev: BarEvidence,
): HintFire {
	if (rootPc === null || (quality !== "maj" && quality !== "min"))
		return { fires: false, symbol: null };
	const colored = colorChord(rootPc, quality, ev, SHIPPED20);
	return colored.rule === "power"
		? { fires: true, symbol: `${PC_NAMES[rootPc]}5` }
		: { fires: false, symbol: null };
}

/**
 * Arm B: the same trigger with the third/fourth/second absence tested on
 * the floored profile. A bar with no floored evidence does not fire.
 */
export function variantPowerHint(
	rootPc: number | null,
	quality: Reduced,
	notes: Note[],
	from: number,
	to: number,
	ev: BarEvidence,
): HintFire {
	if (rootPc === null || (quality !== "maj" && quality !== "min"))
		return { fires: false, symbol: null };
	if (ev.total <= 0) return { fires: false, symbol: null };
	const high = new Float64Array(12);
	let highTotal = 0;
	for (const n of notes) {
		if (n.pitch < VARIANT_PITCH_FLOOR) continue;
		const overlap = Math.min(n.end, to) - Math.max(n.start, from);
		if (overlap <= 0) continue;
		const weight = overlap * (0.3 + n.amplitude);
		high[((n.pitch % 12) + 12) % 12]! += weight;
		highTotal += weight;
	}
	if (highTotal <= 0) return { fires: false, symbol: null };
	const absentHigh = (interval: number) =>
		high[(rootPc + interval) % 12]! < SHIPPED20.presentShare * highTotal;
	const presentFull = (interval: number) =>
		ev.profile[(rootPc + interval) % 12]! >= SHIPPED20.presentShare * ev.total;
	const fires =
		absentHigh(4) && absentHigh(3) && absentHigh(5) && absentHigh(2) && presentFull(7);
	return fires
		? { fires: true, symbol: `${PC_NAMES[rootPc]}5` }
		: { fires: false, symbol: null };
}

/** The bar evidence both arms read (the Study 20 arithmetic, re-exported for the runner). */
export function hintEvidence(notes: Note[], from: number, to: number): BarEvidence {
	return barEvidence(notes, from, to, 0.15);
}
