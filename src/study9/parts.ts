/**
 * Study 9 per-part rendering (docs/BRIEF-STUDY9.md, "Fixture"): the
 * SAME synthesis calls as `renderMix`, in the same order on the same
 * seeded stream, routed into separate part buffers — drums, bass, comp,
 * and the optional misleading `extra` part. `renderMix` itself is
 * untouched (the committed fixtures stay byte-identical); the tested
 * contract is that the parts' float sum matches `renderMix` within
 * 1e-6 per sample for every committed spec. Parts are normalized by the
 * MIX's peak, so stems sum to the mix exactly as a band's stems do.
 *
 * The misleading extras (new specs only): a rubato lead (free-time
 * melody, no grid), a slow pad with off-grid entries, a seeded noise
 * room track, and a double-time comp (subdivision twice the drums').
 * Their writes go ONLY to the extra part; the mix for extra-carrying
 * items is parts' sum (these items are new, so no byte-identity
 * concern).
 */
import { INTERVALS, parseChord } from "../grading/symbols.js";
import { mulberry32 } from "../fixture/synth.js";
import { barSeconds, RATE4, truthOf, type MixSpec } from "../study4/synth4.js";

export type ExtraKind = "rubato-lead" | "pad" | "noise" | "double-comp";
export interface MixSpec9 extends MixSpec {
	extra?: ExtraKind;
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

export interface RenderedParts {
	/** In a FIXED internal order; callers shuffle via stemOrder(). */
	parts: { role: "drums" | "bass" | "comp" | "extra"; samples: Float32Array }[];
	mix: Float32Array;
}

export function renderParts(spec: MixSpec9, seed: number): RenderedParts {
	const truth = truthOf(spec);
	const extraLen = Math.ceil(truth.durationSec * RATE4);
	const drums = new Float32Array(extraLen);
	const bass = new Float32Array(extraLen);
	const comp = new Float32Array(extraLen);
	const extra = new Float32Array(extraLen);
	const rand = mulberry32(seed);
	let at = 0;
	for (const section of spec.sections) {
		const barSec = barSeconds(spec.meter, section.bpm);
		for (const chord of section.bars) {
			const v = chordTones(chord);
			if (v) {
				if ((section as { sparse?: boolean }).sparse) {
					addTone(comp, at, barSec * 1.1, v.bass, 0.3, 2, 0.04);
					for (const tone of v.tones) addTone(comp, at + 0.02, barSec * 1.05, tone, 0.22, 2, 0.05);
				} else if (spec.pulseless) {
					for (const tone of [v.bass + 12, ...v.tones]) {
						const enter = rand() * barSec * 0.5;
						addTone(comp, at + enter, barSec * 1.4, tone, 0.3, 2, 0.8);
					}
				} else if (spec.meter === "6/8") {
					const eighth = barSec / 6;
					addKick(drums, at, 0.9);
					addKick(drums, at + 3 * eighth, 0.7);
					addNoise(drums, at + 3 * eighth, 0.06, 0.45, rand);
					for (let b = 0; b < 6; b++) addNoise(drums, at + b * eighth, 0.015, 0.22, rand);
					addTone(bass, at, barSec * 0.9, v.bass, 0.42, 2, 0.01);
					addTone(bass, at + 3 * eighth, barSec * 0.45, v.bass, 0.38, 2, 0.01);
					for (let b = 0; b < 6; b++) {
						const accent = b === 0 || b === 3 ? 0.4 : 0.22;
						for (const [k, tone] of v.tones.entries()) {
							addTone(comp, at + b * eighth + k * 0.015, eighth * 0.9, tone, accent, 3, 0.01);
						}
					}
				} else {
					const beats = spec.meter === "4/4" ? 4 : 3;
					const beat = barSec / beats;
					addKick(drums, at, 0.9);
					if (beats === 4) {
						addKick(drums, at + 2 * beat, 0.7);
						addNoise(drums, at + 1 * beat, 0.06, 0.5, rand);
						addNoise(drums, at + 3 * beat, 0.06, 0.5, rand);
					} else {
						addNoise(drums, at + 2 * beat, 0.06, 0.45, rand);
					}
					for (let b = 0; b < beats; b++) addNoise(drums, at + b * beat, 0.015, 0.22, rand);
					addTone(bass, at, beat * 1.8, v.bass, 0.42, 2, 0.01);
					if (beats === 4) addTone(bass, at + 2 * beat, beat * 1.8, v.bass, 0.38, 2, 0.01);
					for (let b = 0; b < beats; b++) {
						const accent = b === 0 ? 0.42 : 0.28;
						for (const [k, tone] of v.tones.entries()) {
							addTone(comp, at + b * beat + k * 0.018, beat * 0.92, tone, accent, 3, 0.01);
						}
					}
				}
			}
			at += barSec;
		}
	}
	// The misleading extra, after the main stream (its own derived seed so
	// it cannot perturb the main parts' rand sequence).
	if (spec.extra) {
		const xrand = mulberry32(seed * 7 + 13);
		const truthSec = truth.durationSec;
		if (spec.extra === "rubato-lead") {
			// A free-time melody: chord tones an octave up, durations drawn
			// 0.4–1.6 s, never on the grid.
			let t = 0.3;
			let step = 0;
			const flat = spec.sections.flatMap((s) => s.bars);
			while (t < truthSec - 1) {
				const chord = flat[Math.floor((t / truthSec) * flat.length)] ?? flat[0]!;
				const v = chordTones(chord);
				if (v) {
					const tone = v.tones[step % v.tones.length]! + 12;
					const dur = 0.4 + xrand() * 1.2;
					addTone(extra, t, dur, tone, 0.3, 3, 0.03);
					t += dur * (0.7 + xrand() * 0.6);
					step++;
				} else t += 0.5;
			}
		} else if (spec.extra === "pad") {
			let t = 0;
			const flat = spec.sections.flatMap((s) => s.bars);
			while (t < truthSec - 2) {
				const chord = flat[Math.floor((t / truthSec) * flat.length)] ?? flat[0]!;
				const v = chordTones(chord);
				if (v) for (const tone of v.tones) addTone(extra, t + xrand() * 0.8, 3.2, tone + 12, 0.16, 2, 1.0);
				t += 2.4 + xrand() * 1.2;
			}
		} else if (spec.extra === "noise") {
			// A room track: continuous low-level noise with slow swells.
			for (let i = 0; i < extra.length; i++) {
				const sw = 0.5 + 0.5 * Math.sin((2 * Math.PI * i) / (RATE4 * 7));
				extra[i] = (xrand() * 2 - 1) * 0.06 * sw;
			}
		} else if (spec.extra === "double-comp") {
			// A comp at TWICE the drums' subdivision: suggests double time.
			let t2 = 0;
			for (const section of spec.sections) {
				const barSec = barSeconds(spec.meter, section.bpm);
				const beats = spec.meter === "4/4" ? 8 : spec.meter === "3/4" ? 6 : 12;
				const beat = barSec / beats;
				for (const chord of section.bars) {
					const v = chordTones(chord);
					if (v)
						for (let b = 0; b < beats; b++)
							addTone(extra, t2 + b * beat, beat * 0.85, v.tones[0]! + 12, 0.26, 3, 0.008);
					t2 += barSec;
				}
			}
		}
	}
	// One normalization, by the SUM's peak, applied to every part.
	const mix = new Float32Array(extraLen);
	for (let i = 0; i < extraLen; i++) mix[i] = drums[i]! + bass[i]! + comp[i]! + extra[i]!;
	let peak = 0;
	for (let i = 0; i < extraLen; i++) peak = Math.max(peak, Math.abs(mix[i]!));
	if (peak > 0) {
		for (const buf of [drums, bass, comp, extra, mix]) {
			for (let i = 0; i < extraLen; i++) buf[i]! /= peak;
		}
	}
	const parts: RenderedParts["parts"] = [
		{ role: "drums", samples: drums },
		{ role: "bass", samples: bass },
		{ role: "comp", samples: comp },
	];
	if (spec.extra) parts.push({ role: "extra", samples: extra });
	return { parts, mix };
}

/** A seeded shuffle of stem indices, so instruments see s1…sN with hidden roles. */
export function stemOrder(n: number, seed: number): number[] {
	const rand = mulberry32(seed ^ 0x9e3779b9);
	const order = Array.from({ length: n }, (_, i) => i);
	for (let i = n - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[order[i], order[j]] = [order[j]!, order[i]!];
	}
	return order;
}
