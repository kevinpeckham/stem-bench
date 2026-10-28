/**
 * Study 4 mix synthesis (docs/BRIEF-STUDY4.md, "The fixture"): each song
 * spec renders to a mono 22050 Hz mix with its tempo, meter and key known
 * by construction. The comp is meter-distinctive (bass on the meter's
 * strong beats, strummed chords on the subdivision, beat 1 accented);
 * sections may change tempo or key at a bar boundary; pulseless items
 * render as slow-attack pads with no rhythmic onsets (the registered
 * correct tempo answer is null). Deterministic per song seed.
 */
import { INTERVALS, parseChord } from "../grading/symbols.js";
import { mulberry32 } from "../fixture/synth.js";

export const RATE4 = 22050;

export type Meter4 = "4/4" | "3/4" | "6/8";

export interface Section4 {
	/** Beats per minute; for 6/8 the dotted-quarter pulse. */
	bpm: number;
	/** "D major", "C minor" — the ground-truth key name. */
	key: string;
	/** One chord per bar. */
	bars: string[];
	/** Study 8: a sparse section renders as soft whole-bar chords, no drums. */
	sparse?: boolean;
	/** Study 8: the section's name for section-detection ground truth. */
	name?: string;
}

export interface MixSpec {
	id: string;
	title: string;
	meter: Meter4;
	pulseless?: boolean;
	sections: Section4[];
}

/** Seconds per bar for a section. */
export function barSeconds(meter: Meter4, bpm: number): number {
	if (meter === "4/4") return (4 * 60) / bpm;
	if (meter === "3/4") return (3 * 60) / bpm;
	return (2 * 60) / bpm; // 6/8: two dotted-quarter beats
}

export interface MixTruth {
	tempo: number | null;
	meter: Meter4 | "free";
	key: string;
	tempoChanges: { at: number; bpm: number }[];
	keyChanges: { at: number; key: string }[];
	durationSec: number;
}

export function truthOf(spec: MixSpec): MixTruth {
	let t = 0;
	const tempoChanges: { at: number; bpm: number }[] = [];
	const keyChanges: { at: number; key: string }[] = [];
	for (const [i, s] of spec.sections.entries()) {
		if (i > 0) {
			const prev = spec.sections[i - 1]!;
			if (s.bpm !== prev.bpm) tempoChanges.push({ at: t, bpm: s.bpm });
			if (s.key !== prev.key) keyChanges.push({ at: t, key: s.key });
		}
		t += s.bars.length * barSeconds(spec.meter, s.bpm);
	}
	return {
		tempo: spec.pulseless ? null : spec.sections[0]!.bpm,
		meter: spec.pulseless ? "free" : spec.meter,
		key: spec.sections[0]!.key,
		tempoChanges: spec.pulseless ? [] : tempoChanges,
		keyChanges,
		durationSec: t + 1,
	};
}

const midiHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function addTone(
	out: Float32Array,
	startSec: number,
	durSec: number,
	midi: number,
	gain: number,
	harmonics: number,
	attackSec: number,
) {
	const f0 = midiHz(midi);
	const from = Math.max(0, Math.floor(startSec * RATE4));
	const to = Math.min(out.length, Math.floor((startSec + durSec) * RATE4));
	const attack = Math.max(1, attackSec * RATE4);
	const tau = durSec * 0.5 * RATE4;
	for (let i = from; i < to; i++) {
		const n = i - from;
		const env = (n < attack ? n / attack : Math.exp(-(n - attack) / tau)) * gain;
		const t = i / RATE4;
		let s = 0;
		for (let h = 1; h <= harmonics; h++) s += Math.sin(2 * Math.PI * f0 * h * t) / h ** 2;
		out[i]! += s * env;
	}
}

function chordTones(chord: string): { bass: number; tones: number[] } | null {
	const p = parseChord(chord);
	if (!p.ok || p.pc === null) return null;
	const intervals = INTERVALS[p.quality] ?? INTERVALS[""]!;
	return { bass: 36 + p.pc, tones: intervals.map((i) => 60 + p.pc! + i) };
}

/** A kick: a fast-decaying low sine. */
function addKick(out: Float32Array, atSec: number, gain: number) {
	const from = Math.max(0, Math.floor(atSec * RATE4));
	const to = Math.min(out.length, from + Math.floor(0.12 * RATE4));
	for (let i = from; i < to; i++) {
		const n = (i - from) / RATE4;
		out[i]! += Math.sin(2 * Math.PI * (52 + 60 * Math.exp(-n * 35)) * n) * Math.exp(-n * 22) * gain;
	}
}

/** A snare/hat: a seeded noise burst. */
function addNoise(out: Float32Array, atSec: number, durSec: number, gain: number, rand: () => number) {
	const from = Math.max(0, Math.floor(atSec * RATE4));
	const to = Math.min(out.length, from + Math.floor(durSec * RATE4));
	for (let i = from; i < to; i++) {
		const n = (i - from) / RATE4;
		out[i]! += (rand() * 2 - 1) * Math.exp(-n * (3 / durSec)) * gain;
	}
}

export function renderMix(spec: MixSpec, seed: number): Float32Array {
	const truth = truthOf(spec);
	const out = new Float32Array(Math.ceil(truth.durationSec * RATE4));
	const rand = mulberry32(seed);
	let at = 0;
	for (const section of spec.sections) {
		const barSec = barSeconds(spec.meter, section.bpm);
		for (const chord of section.bars) {
			const v = chordTones(chord);
			if (v) {
				if (section.sparse) {
					// Study 8 contrast sections: one soft sustained chord per
					// bar, no drums, no strummed subdivision.
					addTone(out, at, barSec * 1.1, v.bass, 0.3, 2, 0.04);
					for (const tone of v.tones) addTone(out, at + 0.02, barSec * 1.05, tone, 0.22, 2, 0.05);
				} else if (spec.pulseless) {
					// A pad: every tone enters within the first half of the bar
					// with a slow attack; no rhythmic grid.
					for (const tone of [v.bass + 12, ...v.tones]) {
						const enter = rand() * barSec * 0.5;
						addTone(out, at + enter, barSec * 1.4, tone, 0.3, 2, 0.8);
					}
				} else if (spec.meter === "6/8") {
					// Amendment 1: a drum layer makes the pulse unambiguous —
					// kick on the dotted-quarter beats, hat ticks on the eighths.
					const eighth = barSec / 6;
					addKick(out, at, 0.9);
					addKick(out, at + 3 * eighth, 0.7);
					addNoise(out, at + 3 * eighth, 0.06, 0.45, rand);
					for (let b = 0; b < 6; b++) addNoise(out, at + b * eighth, 0.015, 0.22, rand);
					addTone(out, at, barSec * 0.9, v.bass, 0.42, 2, 0.01);
					addTone(out, at + 3 * eighth, barSec * 0.45, v.bass, 0.38, 2, 0.01);
					for (let b = 0; b < 6; b++) {
						const accent = b === 0 || b === 3 ? 0.4 : 0.22;
						for (const [k, tone] of v.tones.entries()) {
							addTone(out, at + b * eighth + k * 0.015, eighth * 0.9, tone, accent, 3, 0.01);
						}
					}
				} else {
					const beats = spec.meter === "4/4" ? 4 : 3;
					const beat = barSec / beats;
					// Amendment 1 drums: 4/4 gets kick 1 and 3 with a backbeat
					// snare on 2 and 4; 3/4 gets kick 1 with snare on 3; hat
					// ticks on every beat.
					addKick(out, at, 0.9);
					if (beats === 4) {
						addKick(out, at + 2 * beat, 0.7);
						addNoise(out, at + 1 * beat, 0.06, 0.5, rand);
						addNoise(out, at + 3 * beat, 0.06, 0.5, rand);
					} else {
						addNoise(out, at + 2 * beat, 0.06, 0.45, rand);
					}
					for (let b = 0; b < beats; b++) addNoise(out, at + b * beat, 0.015, 0.22, rand);
					addTone(out, at, beat * 1.8, v.bass, 0.42, 2, 0.01);
					if (beats === 4) addTone(out, at + 2 * beat, beat * 1.8, v.bass, 0.38, 2, 0.01);
					for (let b = 0; b < beats; b++) {
						const accent = b === 0 ? 0.42 : 0.28;
						for (const [k, tone] of v.tones.entries()) {
							addTone(out, at + b * beat + k * 0.018, beat * 0.92, tone, accent, 3, 0.01);
						}
					}
				}
			}
			at += barSec;
		}
	}
	let peak = 0;
	for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]!));
	if (peak > 0) for (let i = 0; i < out.length; i++) out[i]! /= peak;
	return out;
}
