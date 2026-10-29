/**
 * Study 9 instruments (docs/BRIEF-STUDY9.md): D-prod wrappers over the
 * verbatim port, and the three stem-aware variants. All zero-model.
 * Registered constants are named here and fixed before the first run:
 * ACTIVE_FRACTION 0.2 (a stem is active in a bar when its bar RMS is
 * above 0.2 of its own peak bar RMS), HOLD_BARS 2, OCTAVE_FLAG ratio
 * within 6% of 2.0 between the two sharpest stems' tempos.
 */
import {
	analyse,
	combineFeatures,
	detectKey,
	extractFeatures,
	type Detection,
	type Features,
} from "./analysis.js";
import { RATE4 } from "../study4/synth4.js";

/** The AudioBuffer-shaped shim production's own jobs function uses (notes.ts). */
export const asBuffer = (data: Float32Array, sampleRate = RATE4) =>
	({
		sampleRate,
		length: data.length,
		numberOfChannels: 1,
		getChannelData: () => data,
		duration: data.length / sampleRate,
	}) as unknown as AudioBuffer;

export const featuresOf = (samples: Float32Array): Features =>
	extractFeatures(asBuffer(samples));

/** D-prod: production's path — per-stem features, combined, analysed. */
export function dProd(stems: Float32Array[]): Detection {
	const combined = combineFeatures(stems.map((s) => featuresOf(s)));
	if (!combined) throw new Error("no features");
	return analyse(combined);
}

/** D-stem-tempo: each stem's own tempo; the answer is the sharpest stem's. */
export function dStemTempo(stems: Float32Array[]): {
	tempo: Detection["tempo"];
	perStem: { bpm: number | null; strength: number }[];
	octaveFlag: boolean;
} {
	const perStem = stems.map((s) => {
		const d = analyse(featuresOf(s));
		return { bpm: d.tempo.bpm, strength: d.tempo.confidence ?? 0, detection: d };
	});
	const ranked = [...perStem].sort((a, b) => b.strength - a.strength);
	const top = ranked[0]!;
	const second = ranked[1];
	let octaveFlag = false;
	if (top.bpm && second?.bpm) {
		const ratio = Math.max(top.bpm, second.bpm) / Math.min(top.bpm, second.bpm);
		octaveFlag = Math.abs(ratio - 2) / 2 <= 0.06;
	}
	return {
		tempo: top.detection.tempo,
		perStem: perStem.map(({ bpm, strength }) => ({ bpm, strength })),
		octaveFlag,
	};
}

export const ACTIVE_FRACTION = 0.2;
export const HOLD_BARS = 2;

/**
 * D-activity: per-bar RMS per stem on a bar grid; a boundary where the
 * active-stem set changes and the new set holds ≥ HOLD_BARS bars.
 * `barStartsSec` is the grid — the truth grid in the primary read, the
 * detected-tempo grid in the registered secondary.
 */
export function dActivity(
	stems: Float32Array[],
	barStartsSec: number[],
): { boundaries: number[]; activeSets: string[] } {
	const bars = barStartsSec.length - 1;
	const rms: number[][] = stems.map(() => []);
	for (const [s, stem] of stems.entries()) {
		for (let b = 0; b < bars; b++) {
			const from = Math.floor(barStartsSec[b]! * RATE4);
			const to = Math.min(stem.length, Math.floor(barStartsSec[b + 1]! * RATE4));
			let acc = 0;
			for (let i = from; i < to; i++) acc += stem[i]! * stem[i]!;
			rms[s]!.push(Math.sqrt(acc / Math.max(1, to - from)));
		}
	}
	const peaks = rms.map((r) => Math.max(...r, 1e-9));
	const activeSets: string[] = [];
	for (let b = 0; b < bars; b++) {
		activeSets.push(
			stems.map((_, s) => (rms[s]![b]! >= ACTIVE_FRACTION * peaks[s]! ? "1" : "0")).join(""),
		);
	}
	const boundaries: number[] = [];
	for (let b = 1; b < bars; b++) {
		if (activeSets[b] === activeSets[b - 1]) continue;
		let holds = true;
		for (let k = 1; k < HOLD_BARS; k++) {
			if (b + k >= bars || activeSets[b + k] !== activeSets[b]) {
				holds = false;
				break;
			}
		}
		if (holds) boundaries.push(barStartsSec[b]!);
	}
	return { boundaries, activeSets };
}

/**
 * D-key-agree: production's answer, plus the agreement of tonal stems
 * (a stem is tonal when its features' tonality clears production's own
 * reuse threshold, 0.35 of the max as in notes.ts); agreement counts a
 * stem whose own key is the answer or its relative.
 */
export function dKeyAgree(stems: Float32Array[]): {
	key: Detection["key"];
	agreement: number;
	tonalStems: number;
} {
	const features = stems.map((s) => featuresOf(s));
	const combined = combineFeatures(features);
	if (!combined) throw new Error("no features");
	const answer = analyse(combined).key;
	const top = Math.max(...features.map((f) => f.tonal), 1e-9);
	const tonal = features.filter((f) => f.tonal >= 0.35 * top);
	let agree = 0;
	for (const f of tonal) {
		const k = detectKey(f.chroma, f.bassChroma);
		if (!k.value || !answer.value) continue;
		if (k.value === answer.value || isRelative(k.value, answer.value)) agree++;
	}
	return {
		key: answer,
		agreement: tonal.length ? agree / tonal.length : 0,
		tonalStems: tonal.length,
	};
}

const PC: Record<string, number> = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
function parseKeyName(name: string): { pc: number; minor: boolean } | null {
	const m = name.match(/^([A-G][#b]?)\s*(minor|major)?$/i) ?? name.match(/^([A-G][#b]?)(m)?$/);
	if (!m) return null;
	const pc = PC[m[1]!];
	if (pc === undefined) return null;
	const mode = (m[2] ?? "").toLowerCase();
	const minor = mode === "m" || mode === "minor";
	return { pc, minor };
}
export function isRelative(a: string, b: string): boolean {
	const ka = parseKeyName(a);
	const kb = parseKeyName(b);
	if (!ka || !kb || ka.minor === kb.minor) return false;
	const [maj, min] = ka.minor ? [kb, ka] : [ka, kb];
	return (maj.pc + 9) % 12 === min.pc;
}
