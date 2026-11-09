/**
 * Study 33 (docs/BRIEF-STUDY33.md): the synthetic separation sweep's
 * fixture and its mechanical grader. One 16-bar 4/4 song from the
 * Study 32 primitives — drums centered, the chord instrument constant-
 * power panned at a declared width — and chord-tone purity: transcribed
 * note-seconds whose pitch class belongs to the bar's chord, over all
 * transcribed note-seconds.
 */
import { addChord, addKick, addSnare, RATE32 } from "../study32/corpus32.js";

/** Pitch classes per chord symbol used in the sweep (midi % 12). */
export const CHORD_PCS: Record<string, number[]> = {
	C: [0, 4, 7],
	F: [5, 9, 0],
	G: [7, 11, 2],
	Am: [9, 0, 4],
};

export interface PannedSong {
	l: Float32Array;
	r: Float32Array;
	/** The chord instrument alone (mono, unpanned) — the purity ceiling's input. */
	chordsOnly: Float32Array;
	barStarts: number[];
	chords: string[];
	beatSec: number;
}

/**
 * Drums dead center (kick with beater click on 1 and 3, snare on 2 and 4),
 * one chord per bar C–F–G–Am rotating, the chord instrument constant-power
 * panned: width 0 is center (L = R), width 1 is hard right.
 */
export function renderPanned(width: number, bpm = 120, bars = 16): PannedSong {
	const beatSec = 60 / bpm;
	const barSec = 4 * beatSec;
	const total = Math.ceil((bars * barSec + 1.0) * RATE32);
	const drums = new Float32Array(total);
	const chords = new Float32Array(total);
	const names = ["C", "F", "G", "Am"];
	const chordPerBar: string[] = [];
	const barStarts: number[] = [];
	for (let b = 0; b < bars; b++) {
		const t0 = b * barSec;
		barStarts.push(t0);
		const chord = names[b % names.length]!;
		chordPerBar.push(chord);
		addChord(chords, t0, barSec, chord);
		addKick(drums, t0, 1.0, true);
		addKick(drums, t0 + 2 * beatSec, 1.0, true);
		addSnare(drums, t0 + beatSec, 0.6);
		addSnare(drums, t0 + 3 * beatSec, 0.6);
	}
	barStarts.push(bars * barSec);
	const theta = (Math.PI / 4) * (1 + width);
	const gl = Math.cos(theta);
	const gr = Math.sin(theta);
	const center = Math.SQRT1_2;
	const l = new Float32Array(total);
	const r = new Float32Array(total);
	for (let i = 0; i < total; i++) {
		l[i] = center * drums[i]! + gl * chords[i]!;
		r[i] = center * drums[i]! + gr * chords[i]!;
	}
	return { l, r, chordsOnly: chords, barStarts, chords: chordPerBar, beatSec };
}

export interface PurityNote {
	start: number;
	end: number;
	pitch: number;
}

/**
 * Chord-tone purity of a transcription against the per-bar chords:
 * duration-weighted, each note's overlap clipped to the bars it crosses.
 */
export function chordTonePurity(
	notes: PurityNote[],
	barStarts: number[],
	chords: string[],
): { tonal: number; total: number; purity: number } {
	let tonal = 0;
	let total = 0;
	for (const n of notes) {
		const pc = ((n.pitch % 12) + 12) % 12;
		for (let b = 0; b + 1 < barStarts.length && b < chords.length; b++) {
			const overlap = Math.min(n.end, barStarts[b + 1]!) - Math.max(n.start, barStarts[b]!);
			if (overlap <= 0) continue;
			total += overlap;
			if (CHORD_PCS[chords[b]!]!.includes(pc)) tonal += overlap;
		}
	}
	return { tonal, total, purity: total > 0 ? tonal / total : 0 };
}
