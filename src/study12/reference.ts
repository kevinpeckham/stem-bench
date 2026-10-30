/**
 * Study 12 reference renderer (docs/BRIEF-STUDY12.md): the chart as
 * audio, badly-but-in-time. Each bar's chords (one or two per bar)
 * render as sustained chord-tone pads at the DECLARED tempo and meter —
 * no drums, no dynamics, nothing the chart does not state. The point is
 * chroma, not realism: DTW aligns this against the real recording and
 * every reference bar start is known by construction.
 */
import { INTERVALS, parseChord } from "../grading/symbols.js";
import { barSeconds, RATE4, type Meter4 } from "../study4/synth4.js";

export interface RefBar {
	/** One or two chord symbols; two split the bar in half. "" is silence. */
	chords: string[];
	/** The declared tempo in force for this bar. */
	bpm: number;
}

const midiHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function addPad(out: Float32Array, startSec: number, durSec: number, chord: string) {
	const p = parseChord(chord);
	if (!p.ok || p.pc === null) return;
	const intervals = INTERVALS[p.quality] ?? INTERVALS[""]!;
	const tones = [36 + p.pc, ...intervals.map((i) => 60 + p.pc! + i)];
	const from = Math.max(0, Math.floor(startSec * RATE4));
	const to = Math.min(out.length, Math.floor((startSec + durSec) * RATE4));
	const attack = Math.max(1, 0.02 * RATE4);
	for (const midi of tones) {
		const f0 = midiHz(midi);
		for (let i = from; i < to; i++) {
			const n = i - from;
			const env = (n < attack ? n / attack : 1) * 0.25;
			const t = i / RATE4;
			out[i]! += (Math.sin(2 * Math.PI * f0 * t) + 0.25 * Math.sin(4 * Math.PI * f0 * t)) * env;
		}
	}
}

export function renderReference(
	bars: RefBar[],
	meter: Meter4,
): { samples: Float32Array; barStarts: number[] } {
	let total = 0;
	for (const bar of bars) total += barSeconds(meter, bar.bpm);
	const samples = new Float32Array(Math.ceil(total * RATE4));
	const barStarts: number[] = [];
	let at = 0;
	for (const bar of bars) {
		barStarts.push(at);
		const barSec = barSeconds(meter, bar.bpm);
		const chords = bar.chords.filter(Boolean);
		const slot = chords.length > 0 ? barSec / chords.length : barSec;
		for (const [k, chord] of chords.entries()) addPad(samples, at + k * slot, slot, chord);
		at += barSec;
	}
	barStarts.push(at);
	let peak = 0;
	for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]!));
	if (peak > 0) for (let i = 0; i < samples.length; i++) samples[i]! /= peak;
	return { samples, barStarts };
}
