/**
 * Study 10 hard-set synthesis (docs/BRIEF-STUDY10.md, "Corpus"): the
 * cases the landscape review names as where templates and
 * autocorrelation fail — swing eighths, octave-boundary tempi, a reverb
 * tail, a dense arrangement — rendered by this renderer's OWN code path.
 * src/study4/synth4.ts and src/study9/parts.ts are untouched, so every
 * committed fixture stays byte-identical; truth still comes from
 * truthOf/sectionTruth on the same spec shape. Deterministic per seed.
 */
import { INTERVALS, parseChord } from "../grading/symbols.js";
import { mulberry32 } from "../fixture/synth.js";
import { barSeconds, RATE4, truthOf, type MixSpec } from "../study4/synth4.js";

export interface MixSpec10 extends MixSpec {
	/** Offbeat eighth placement as a fraction of the beat: 0.5 straight, ~0.67 triplet swing. */
	swing?: number;
	/** A feedback-delay tail over the whole mix (the review's smeared-onset case). */
	reverb?: boolean;
	/** Octave doublings, richer partials, eighth-note bass: the crowded-spectrum case. */
	dense?: boolean;
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
function addKick(out: Float32Array, atSec: number, gain: number) {
	const from = Math.max(0, Math.floor(atSec * RATE4));
	const to = Math.min(out.length, from + Math.floor(0.12 * RATE4));
	for (let i = from; i < to; i++) {
		const n = (i - from) / RATE4;
		out[i]! += Math.sin(2 * Math.PI * (52 + 60 * Math.exp(-n * 35)) * n) * Math.exp(-n * 22) * gain;
	}
}
function addNoise(out: Float32Array, atSec: number, durSec: number, gain: number, rand: () => number) {
	const from = Math.max(0, Math.floor(atSec * RATE4));
	const to = Math.min(out.length, from + Math.floor(durSec * RATE4));
	for (let i = from; i < to; i++) {
		const n = (i - from) / RATE4;
		out[i]! += (rand() * 2 - 1) * Math.exp(-n * (3 / durSec)) * gain;
	}
}
function chordTones(chord: string): { bass: number; tones: number[] } | null {
	const p = parseChord(chord);
	if (!p.ok || p.pc === null) return null;
	const intervals = INTERVALS[p.quality] ?? INTERVALS[""]!;
	return { bass: 36 + p.pc, tones: intervals.map((i) => 60 + p.pc! + i) };
}

/** Three Schroeder-style feedback combs plus a tail second: a registered, mild room. */
function applyReverb(dry: Float32Array): Float32Array {
	const tail = Math.floor(1.5 * RATE4);
	const out = new Float32Array(dry.length + tail);
	out.set(dry);
	for (const [delayMs, fb, mix] of [
		[79, 0.62, 0.22],
		[113, 0.55, 0.18],
		[167, 0.48, 0.14],
	] as const) {
		const d = Math.floor((delayMs / 1000) * RATE4);
		const buf = new Float32Array(d);
		for (let i = 0; i < out.length; i++) {
			const j = i % d;
			const y = buf[j]!;
			buf[j] = out[i]! + y * fb;
			out[i]! += y * mix;
		}
	}
	return out;
}

export function renderMix10(spec: MixSpec10, seed: number): Float32Array {
	const truth = truthOf(spec);
	const len = Math.ceil(truth.durationSec * RATE4);
	const mix = new Float32Array(len);
	const rand = mulberry32(seed);
	const swing = spec.swing ?? 0.5;
	let at = 0;
	for (const section of spec.sections) {
		const barSec = barSeconds(spec.meter, section.bpm);
		for (const chord of section.bars) {
			const v = chordTones(chord);
			if (v) {
				if (spec.meter === "6/8") {
					const eighth = barSec / 6;
					addKick(mix, at, 0.9);
					addKick(mix, at + 3 * eighth, 0.7);
					addNoise(mix, at + 3 * eighth, 0.06, 0.45, rand);
					for (let b = 0; b < 6; b++) addNoise(mix, at + b * eighth, 0.015, 0.22, rand);
					addTone(mix, at, barSec * 0.9, v.bass, 0.42, 2, 0.01);
					addTone(mix, at + 3 * eighth, barSec * 0.45, v.bass, 0.38, 2, 0.01);
					for (let b = 0; b < 6; b++) {
						const accent = b === 0 || b === 3 ? 0.4 : 0.22;
						for (const [k, tone] of v.tones.entries()) {
							addTone(mix, at + b * eighth + k * 0.015, eighth * 0.9, tone, accent, 3, 0.01);
						}
					}
				} else {
					const beats = spec.meter === "4/4" ? 4 : 3;
					const beat = barSec / beats;
					addKick(mix, at, 0.9);
					if (beats === 4) {
						addKick(mix, at + 2 * beat, 0.7);
						addNoise(mix, at + 1 * beat, 0.06, 0.5, rand);
						addNoise(mix, at + 3 * beat, 0.06, 0.5, rand);
					} else {
						addNoise(mix, at + 2 * beat, 0.06, 0.45, rand);
					}
					for (let b = 0; b < beats; b++) addNoise(mix, at + b * beat, 0.015, 0.22, rand);
					addTone(mix, at, beat * 1.8, v.bass, 0.42, 2, 0.01);
					if (beats === 4) addTone(mix, at + 2 * beat, beat * 1.8, v.bass, 0.38, 2, 0.01);
					if (spec.dense) {
						for (let b = 0; b < beats * 2; b++) {
							addTone(mix, at + b * (beat / 2), beat * 0.4, v.bass + (b % 2) * 12, 0.2, 3, 0.008);
						}
					}
					for (let b = 0; b < beats; b++) {
						const accent = b === 0 ? 0.42 : 0.28;
						const harmonics = spec.dense ? 5 : 3;
						for (const [k, tone] of v.tones.entries()) {
							addTone(mix, at + b * beat + k * 0.018, beat * 0.92, tone, accent, harmonics, 0.01);
							if (spec.dense) {
								addTone(mix, at + b * beat + k * 0.018, beat * 0.92, tone + 12, accent * 0.5, 4, 0.01);
							}
						}
						// Swing eighths: the offbeat strum at `swing` of the beat, hats with it.
						if (spec.swing !== undefined) {
							const off = at + b * beat + beat * swing;
							addNoise(mix, off, 0.012, 0.18, rand);
							addTone(mix, off, beat * (1 - swing) * 0.8, v.tones[0]!, 0.2, 3, 0.008);
							addTone(mix, off + 0.014, beat * (1 - swing) * 0.8, v.tones[1] ?? v.tones[0]!, 0.16, 3, 0.008);
						}
					}
					if (spec.dense) {
						addTone(mix, at, barSec * 0.95, v.tones[v.tones.length - 1]! + 24, 0.14, 2, 0.05);
					}
				}
			}
			at += barSec;
		}
	}
	const wet = spec.reverb ? applyReverb(mix) : mix;
	let peak = 0;
	for (let i = 0; i < wet.length; i++) peak = Math.max(peak, Math.abs(wet[i]!));
	if (peak > 0) for (let i = 0; i < wet.length; i++) wet[i]! /= peak;
	return wet;
}
