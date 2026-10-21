/**
 * Deterministic chord-progression synthesis (docs/BRIEF-STUDY1.md, "The
 * fixture"): each song in corpus/progressions.json becomes 22050 Hz mono
 * float32 audio that Basic Pitch then transcribes, exactly as stem-shovel
 * transcribes real stems. The voicing is a band's comp: the root low
 * (octave 2, MIDI 36–47) on beats 1 and 3 so the matcher's bass rule sees
 * it, and the chord's tones as quarter-note block chords around octave 4
 * (MIDI 60–74). Additive synthesis, six harmonics, percussive envelope —
 * tonal enough for Basic Pitch, noisy enough that its transcription is the
 * realistic, imperfect input the production chart draft reads.
 */
import { INTERVALS, parseChord } from "../grading/symbols.js";

export const RATE = 22050;

export interface SongSpec {
	id: string;
	title: string;
	key: string;
	bpm: number;
	/** One chord per bar, 4/4 throughout; "N.C." is a silent bar. */
	chords: string[];
}

/** mulberry32: the seeded PRNG the other benches use. */
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const midiHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/**
 * One plucked tone added into `out`: 10 ms attack, exponential decay.
 * Harmonic rolloff matters more than realism here: a rich low note's 5th
 * and 6th harmonics land exactly on the chord's third and fifth two
 * octaves up, and Basic Pitch then attributes the whole spectrum to the
 * root (the first smoke test transcribed only root octaves), so the bass
 * keeps two quiet harmonics and the chord tones three.
 */
function addNote(
	out: Float32Array,
	startSec: number,
	durSec: number,
	midi: number,
	gain: number,
	detune: number,
	harmonics: number,
) {
	const f0 = midiHz(midi) * (1 + detune);
	const from = Math.max(0, Math.floor(startSec * RATE));
	const to = Math.min(out.length, Math.floor((startSec + durSec) * RATE));
	const attack = 0.01 * RATE;
	const tau = (durSec * 0.5) * RATE;
	for (let i = from; i < to; i++) {
		const n = i - from;
		const env = (n < attack ? n / attack : Math.exp(-(n - attack) / tau)) * gain;
		const t = i / RATE;
		let s = 0;
		for (let h = 1; h <= harmonics; h++) s += Math.sin(2 * Math.PI * f0 * h * t) / h ** 2;
		out[i]! += s * env;
	}
}

/** MIDI pitches for a chord symbol: the root in octave 2 and the tones around octave 4. */
export function voicing(chord: string): { bass: number; tones: number[] } | null {
	const p = parseChord(chord);
	if (!p.ok || p.pc === null) return null;
	const intervals = INTERVALS[p.quality] ?? INTERVALS[""]!;
	const bass = 36 + p.pc; // MIDI 36..47: octave 2, under the matcher's <60 bass rule
	return { bass, tones: intervals.map((i) => 60 + p.pc! + i) };
}

/** Renders a song to mono float32 at 22050 Hz. Deterministic per song id. */
export function renderSong(song: SongSpec, seed: number): Float32Array {
	const beat = 60 / song.bpm;
	const barSec = 4 * beat;
	const total = song.chords.length * barSec + 1;
	const out = new Float32Array(Math.ceil(total * RATE));
	const rand = mulberry32(seed);
	for (let bar = 0; bar < song.chords.length; bar++) {
		const v = voicing(song.chords[bar]!);
		if (!v) continue; // N.C.: a silent bar
		const at = bar * barSec;
		// The root, low, on beats 1 and 3, nearly pure (see addNote on masking).
		for (const b of [0, 2]) {
			addNote(out, at + b * beat, beat * 1.8, v.bass, 0.4, (rand() - 0.5) * 0.002, 2);
		}
		// The chord as quarter-note blocks on every beat, strummed ~18 ms
		// apart so the onset detector separates the tones.
		for (let b = 0; b < 4; b++) {
			for (const [k, tone] of v.tones.entries()) {
				addNote(out, at + b * beat + k * 0.018, beat * 0.95, tone, 0.4, (rand() - 0.5) * 0.002, 3);
			}
		}
	}
	let peak = 0;
	for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]!));
	if (peak > 0) for (let i = 0; i < out.length; i++) out[i]! /= peak;
	return out;
}

/** The bars' start times in seconds, plus the end of the last bar — `chordsPerBar`'s shape. */
export function barStarts(song: SongSpec): number[] {
	const barSec = (60 / song.bpm) * 4;
	return Array.from({ length: song.chords.length + 1 }, (_, i) => i * barSec);
}
