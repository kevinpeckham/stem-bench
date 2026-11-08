/**
 * Study 32 constructions (docs/BRIEF-STUDY32.md): a mini-synth that
 * places chord pads, kicks, snares and count-in clicks at exact sample
 * times, so every item carries its true bar one by construction —
 * including anticipations an eighth early, which the fixture synth's
 * bar-granular renderer cannot place.
 */
import { highpass4 } from "../study29/backbeat.js";
import { lowpass4 } from "../study30/downbeat.js";

export const RATE32 = 22050;

const CHORDS: Record<string, number[]> = {
	C: [48, 60, 64, 67],
	F: [41, 53, 57, 60],
	G: [43, 55, 59, 62],
	Am: [45, 57, 60, 64],
	Dm: [38, 50, 53, 57],
	Em: [40, 52, 55, 59],
	D: [38, 50, 54, 57],
	Bb: [46, 58, 62, 65],
};
const freq = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** Sine-stack chord pad with 20 ms attack and a slow decay. */
export function addChord(samples: Float32Array, at: number, dur: number, chord: string, amp = 0.5): void {
	const notes = CHORDS[chord];
	if (!notes) throw new Error(`unknown chord ${chord}`);
	const from = Math.max(0, Math.floor(at * RATE32));
	const to = Math.min(samples.length, Math.floor((at + dur) * RATE32));
	const attack = 0.02 * RATE32;
	for (let i = from; i < to; i++) {
		const t = i / RATE32;
		const rel = (i - from) / Math.max(1, to - from);
		const env = Math.min(1, (i - from) / attack) * (1 - 0.6 * rel);
		let v = 0;
		for (const n of notes) v += Math.sin(2 * Math.PI * freq(n) * t) + 0.3 * Math.sin(4 * Math.PI * freq(n) * t);
		samples[i]! += (amp * env * v) / notes.length;
	}
}

/**
 * 65 Hz kick thump, 90 ms. `click` adds a 6 ms broadband beater tick
 * (Study 32b): a pure 65 Hz sine is nearly invisible to the spectral
 * flux onset envelope, which left Study 32's "correct base" renders
 * backbeat-dominant in flux.
 */
export function addKick(samples: Float32Array, at: number, amp = 1.0, click = false): void {
	const from = Math.max(0, Math.floor(at * RATE32));
	const n = Math.floor(0.09 * RATE32);
	for (let i = 0; i < n && from + i < samples.length; i++) {
		const t = i / RATE32;
		samples[from + i]! += amp * Math.exp(-t / 0.025) * Math.sin(2 * Math.PI * 65 * t);
	}
	if (click) {
		let seed = from + 7;
		const cn = Math.floor(0.006 * RATE32);
		for (let i = 0; i < cn && from + i < samples.length; i++) {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			samples[from + i]! += amp * 0.5 * (seed / 0x3fffffff - 1) * Math.exp(-i / RATE32 / 0.002);
		}
	}
}

/** Band-shaped snare noise burst, 80 ms. */
export function addSnare(samples: Float32Array, at: number, amp = 0.6): void {
	const n = Math.floor(0.08 * RATE32);
	const burst = new Float32Array(n);
	let seed = Math.floor(at * 1e4) + 1;
	for (let i = 0; i < n; i++) {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		burst[i] = (seed / 0x3fffffff - 1) * Math.exp(-i / RATE32 / 0.03);
	}
	const shaped = lowpass4(highpass4(burst, RATE32, 150), RATE32, 2000);
	const from = Math.max(0, Math.floor(at * RATE32));
	for (let i = 0; i < n && from + i < samples.length; i++) samples[from + i]! += amp * shaped[i]!;
}

/** 1.5 kHz count-in click, 15 ms. */
export function addClick(samples: Float32Array, at: number, amp = 0.8): void {
	const from = Math.max(0, Math.floor(at * RATE32));
	const n = Math.floor(0.015 * RATE32);
	for (let i = 0; i < n && from + i < samples.length; i++) {
		const t = i / RATE32;
		samples[from + i]! += amp * Math.exp(-t / 0.004) * Math.sin(2 * Math.PI * 1500 * t);
	}
}

export interface Item {
	name: string;
	samples: Float32Array;
	bpm: number;
	beats: number;
	/** Seconds per beat (dotted quarter in 6/8). */
	beatSec: number;
	truth: number;
	baseShouldBeCorrect: boolean;
}

export interface SongSpec {
	name: string;
	bpm: number;
	beats: number; // 4, 3, or 2 (6/8)
	bars: number;
	/** "bar" = one change per bar; "half" = two chords a bar; "double" = one chord per two bars; "vamp"; "anticipate" = change an eighth (half a beat) early. */
	harmonic: "bar" | "half" | "double" | "vamp" | "anticipate";
	kickAmp: number;
	snareAmp: number;
	/** Stretch factor applied to the last three bars' beats (1 = steady). */
	ritStretch?: number;
	/** Study 32b: give the kick a flux-visible beater click. */
	kickClick?: boolean;
	baseShouldBeCorrect: boolean;
}

const PALETTE_A = ["C", "F", "G", "C", "Am", "F", "C", "G"];
const PALETTE_B = ["Am", "Dm", "G", "C", "F", "Dm", "Em", "G"];

/** Render a song with bar one at t = 0. */
export function renderSong(spec: SongSpec): Item {
	const beatSec = 60 / spec.bpm;
	const period = spec.beats * beatSec;
	const rit = spec.ritStretch ?? 1;
	// Bar start times, with the last three bars stretched when asked.
	const barStarts: number[] = [];
	let at = 0;
	for (let b = 0; b < spec.bars; b++) {
		barStarts.push(at);
		const stretch = b >= spec.bars - 3 ? rit ** (b - (spec.bars - 4)) : 1;
		at += period * stretch;
	}
	const total = at + 1.5;
	const samples = new Float32Array(Math.ceil(total * RATE32));
	for (let b = 0; b < spec.bars; b++) {
		const t0 = barStarts[b]!;
		const stretch = b >= spec.bars - 3 ? rit ** (b - (spec.bars - 4)) : 1;
		const barDur = period * stretch;
		const bt = (k: number) => t0 + k * beatSec * stretch;
		const palette = Math.floor(b / 8) % 2 === 0 ? PALETTE_A : PALETTE_B;
		const chord = palette[b % 8]!;
		const next = palette[(b + 1) % 8]!;
		if (spec.harmonic === "bar") addChord(samples, t0, barDur, chord);
		else if (spec.harmonic === "half") {
			addChord(samples, t0, barDur / 2, chord);
			addChord(samples, t0 + barDur / 2, barDur / 2, chord === "C" ? "G" : "C");
		} else if (spec.harmonic === "double") {
			if (b % 2 === 0) addChord(samples, t0, 2 * barDur, chord);
		} else if (spec.harmonic === "vamp") addChord(samples, t0, barDur, "C");
		else {
			// anticipate: this bar's chord enters an eighth (half a beat) early.
			const lead = beatSec * stretch * 0.5;
			addChord(samples, Math.max(0, t0 - lead), barDur, chord);
			if (b === spec.bars - 1) addChord(samples, t0 + barDur - lead, 1.0, next);
		}
		addKick(samples, t0, spec.kickAmp, spec.kickClick ?? false);
		if (spec.beats === 4) {
			addSnare(samples, bt(1), spec.snareAmp);
			addSnare(samples, bt(3), spec.snareAmp);
		} else if (spec.beats === 3) addSnare(samples, bt(1), spec.snareAmp);
		else addSnare(samples, bt(1), spec.snareAmp); // 6/8: the second dotted quarter
	}
	let peak = 0;
	for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]!));
	if (peak > 0) for (let i = 0; i < samples.length; i++) samples[i]! /= peak;
	return {
		name: spec.name,
		samples,
		bpm: spec.bpm,
		beats: spec.beats,
		beatSec,
		truth: 0,
		baseShouldBeCorrect: spec.baseShouldBeCorrect,
	};
}

/** Prepend `sec` of silence; the truth moves right. */
export function padStart(item: Item, sec: number, name: string): Item {
	const pad = Math.floor(sec * RATE32);
	const samples = new Float32Array(item.samples.length + pad);
	samples.set(item.samples, pad);
	return { ...item, name, samples, truth: item.truth + pad / RATE32 };
}

/** Drop the first `sec`; the truth moves left. */
export function trimStart(item: Item, sec: number, name: string): Item {
	const cut = Math.floor(sec * RATE32);
	return { ...item, name, samples: item.samples.slice(cut), truth: item.truth - cut / RATE32 };
}

/** One-beat pickup: the first chord sounds one beat before bar one. */
export function withPickup(item: Item, name: string): Item {
	const out = padStart(item, item.beatSec, name);
	addChord(out.samples, 0, item.beatSec, "G", 0.4);
	return out;
}

/** Four count-in clicks at tempo before bar one. */
export function withCountIn(item: Item, name: string): Item {
	const out = padStart(item, 4 * item.beatSec, name);
	for (let k = 0; k < 4; k++) addClick(out.samples, k * item.beatSec);
	return out;
}

/**
 * The ASK's confidence rule for the chord witness: it decides only
 * when its top histogram bin leads the runner-up by `ratio`.
 */
export function applyRatioRule<T extends { cls: number | null; detail: Record<string, unknown> }>(
	vote: T,
	ratio = 1.2,
): T {
	if (vote.cls === null) return vote;
	const hist = vote.detail.hist as number[] | undefined;
	if (!hist) return vote;
	const sorted = [...hist].sort((a, b) => b - a);
	if (sorted[1]! > 0 && sorted[0]! / sorted[1]! < ratio)
		return { ...vote, cls: null, detail: { ...vote.detail, abstain: "ratio", ratio: sorted[0]! / sorted[1]! } };
	return vote;
}
