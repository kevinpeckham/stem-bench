/**
 * Study 34 (docs/CORPUS-STUDY34.md): sequence-to-time truth alignment.
 * Several corpus slots carry PUBLISHED chord sequences without
 * durations (the artist's own section charts, a PD sheet, a hymnal).
 * The harmony stays the publication's; this instrument only places the
 * boundaries: a monotonic Viterbi over the committed Study 12
 * chromagram, each chord mapped to its template (grading/symbols
 * INTERVALS), each state lasting at least `minSec`. A 12-way global
 * transposition search handles capos and 78 rpm transfer pitch. It is
 * validated against the Badverbs songs whose per-bar truth is known
 * (scripts/validate-seqalign-study34.ts) before any scored run.
 */
import { INTERVALS, parseChord } from "../grading/symbols.js";

/** Unit-norm 12-bin template for a chart symbol; null for N.C. */
export function chordTemplate(symbol: string, transpose = 0): Float32Array | null {
	const p = parseChord(symbol);
	if (!p.ok || p.pc === null) return null;
	const intervals = INTERVALS[p.quality] ?? INTERVALS[""]!;
	const t = new Float32Array(12);
	for (const i of intervals) t[(p.pc + i + transpose) % 12] = 1;
	let norm = 0;
	for (let c = 0; c < 12; c++) norm += t[c]! * t[c]!;
	norm = Math.sqrt(norm) || 1;
	for (let c = 0; c < 12; c++) t[c]! /= norm;
	return t;
}

export interface Segment {
	chord: string;
	from: number;
	to: number;
}

function dot(a: Float32Array, b: Float32Array): number {
	let s = 0;
	for (let i = 0; i < 12; i++) s += a[i]! * b[i]!;
	return s;
}

/**
 * Monotonic alignment of the whole sequence onto the frames: every
 * chord appears once, in order, each at least minSec long, the first
 * starting at the first sounding frame and the last ending at the last.
 * Returns the segments and the mean per-frame score of the fit.
 */
export function alignSequenceToTime(
	sequence: string[],
	frames: Float32Array[],
	hopSec: number,
	minSec = 1.0,
	transpose = 0,
): { segments: Segment[]; score: number } {
	const n = frames.length;
	const k = sequence.length;
	if (n === 0 || k === 0) return { segments: [], score: 0 };
	const minFrames = Math.max(1, Math.round(minSec / hopSec));
	const templates = sequence.map((c) => chordTemplate(c, transpose));
	// emission[j][t]: how frame t supports chord j (N.C. scores a flat 0.3)
	const emit = (j: number, t: number): number => {
		const tpl = templates[j];
		return tpl ? dot(frames[t]!, tpl) : 0.3;
	};
	// dp[j][t]: best cumulative score with chord j active at frame t
	const NEG = -1e18;
	const dp: Float64Array[] = Array.from({ length: k }, () => new Float64Array(n).fill(NEG));
	const from: Int32Array[] = Array.from({ length: k }, () => new Int32Array(n).fill(-1));
	for (let t = 0; t < n; t++) dp[0]![t] = (t > 0 ? dp[0]![t - 1]! : 0) + emit(0, t);
	for (let j = 1; j < k; j++) {
		for (let t = j * minFrames; t < n; t++) {
			const stay = dp[j]![t - 1] ?? NEG;
			// switching into j at t requires chord j-1 to have lasted minFrames ending at t-1
			const enter = t - minFrames >= 0 ? dp[j - 1]![t - 1]! : NEG;
			if (enter > stay) {
				dp[j]![t] = enter + emit(j, t);
				from[j]![t] = t; // chord j started here
			} else {
				dp[j]![t] = stay + emit(j, t);
				from[j]![t] = t > 0 ? from[j]![t - 1]! : 0;
			}
		}
	}
	// backtrack: last chord must be active at the final frame
	const segments: Segment[] = [];
	let end = n - 1;
	for (let j = k - 1; j >= 0; j--) {
		const start = j === 0 ? 0 : Math.max(0, from[j]![end]!);
		segments.unshift({ chord: sequence[j]!, from: start * hopSec, to: (end + 1) * hopSec });
		end = start - 1;
		if (end < 0 && j > 0) return { segments: [], score: NEG }; // could not fit
	}
	return { segments, score: dp[k - 1]![n - 1]! / n };
}

/**
 * Bar-grid-constrained alignment: chord changes may only happen on bar
 * lines, each chord lasts an integer 1..maxBars bars, and the bar grid
 * itself is searched (anchor over one bar, tempo ±2% around the
 * declared bpm). This is the mode validation kept: the free-boundary
 * Viterbi above drifts on repetitive progressions (any phase shift of
 * a two-chord vamp scores the same), while the bar grid pins it.
 */
export function alignSequenceToGrid(
	sequence: string[],
	frames: Float32Array[],
	hopSec: number,
	barSecDeclared: number,
	maxBars = 8,
	transpose = 0,
): { segments: Segment[]; score: number; barSec: number; anchor: number } {
	const templates = sequence.map((c) => chordTemplate(c, transpose));
	const n = frames.length;
	const k = sequence.length;
	let best: { segments: Segment[]; score: number; barSec: number; anchor: number } = {
		segments: [],
		score: -Infinity,
		barSec: barSecDeclared,
		anchor: 0,
	};
	if (n === 0 || k === 0) return best;
	for (let s = -4; s <= 4; s++) {
		const barSec = barSecDeclared * (1 + s * 0.005);
		const framesPerBar = barSec / hopSec;
		for (let a = 0; a < 8; a++) {
			const anchor = (a / 8) * barSec;
			// mean chroma per bar, then per-(chord, bar) emission by template dot
			const nBars = Math.floor((n * hopSec - anchor) / barSec);
			if (nBars < k) continue;
			const barChroma: Float32Array[] = [];
			for (let bar = 0; bar < nBars; bar++) {
				const f0 = Math.max(0, Math.round((anchor + bar * barSec) / hopSec));
				const f1 = Math.min(n, Math.round((anchor + bar * barSec) / hopSec + framesPerBar));
				const m = new Float32Array(12);
				for (let t = f0; t < f1; t++) for (let c = 0; c < 12; c++) m[c]! += frames[t]![c]!;
				const cnt = Math.max(1, f1 - f0);
				for (let c = 0; c < 12; c++) m[c]! /= cnt;
				barChroma.push(m);
			}
			const barScore = (j: number, bar: number): number =>
				templates[j] ? dot(barChroma[bar]!, templates[j]!) : 0.3;
			// dp[j][b]: best cumulative score with chord j ENDING at bar b (inclusive)
			const NEG = -1e18;
			const dp: Float64Array[] = Array.from({ length: k }, () => new Float64Array(nBars).fill(NEG));
			const started: Int32Array[] = Array.from({ length: k }, () => new Int32Array(nBars).fill(-1));
			for (let j = 0; j < k; j++) {
				for (let b = j; b < nBars; b++) {
					let run = 0; // sum of barScore(j, x) over x in [startBar..b], grown as len extends
					for (let len = 1; len <= maxBars && b - len + 1 >= j; len++) {
						const startBar = b - len + 1;
						run += barScore(j, startBar);
						const prev = j === 0 ? (startBar === 0 ? 0 : NEG) : startBar > 0 ? dp[j - 1]![startBar - 1]! : NEG;
						if (prev <= NEG / 2) continue;
						const sum = prev + run;
						if (sum > dp[j]![b]!) {
							dp[j]![b] = sum;
							started[j]![b] = startBar;
						}
					}
				}
			}
			// the last chord must end at the last whole bar
			const endBar = nBars - 1;
			if (dp[k - 1]![endBar]! <= -1e17) continue;
			const score = dp[k - 1]![endBar]! / nBars;
			if (score > best.score) {
				const segments: Segment[] = [];
				let b = endBar;
				for (let j = k - 1; j >= 0; j--) {
					const startBar = started[j]![b]!;
					segments.unshift({ chord: sequence[j]!, from: anchor + startBar * barSec, to: anchor + (b + 1) * barSec });
					b = startBar - 1;
				}
				best = { segments, score, barSec, anchor };
			}
		}
	}
	return best;
}

/**
 * Rigid alignment (Tier 2 truth): the publication gives exact bar
 * counts, so the chord chain is a fixed template — only tempo (±2.5%
 * around declared) and start offset are fit, scanned like the JAAH
 * beat aligner. `contrast` compares the fit against itself shifted
 * half a unit; it is the per-song validation gate.
 */
export function alignRigid(
	perUnit: string[],
	frames: Float32Array[],
	hopSec: number,
	unitSecDeclared: number,
	searchSpanSec = 4,
	transpose = 0,
): { segments: Segment[]; unitSec: number; offset: number; score: number; contrast: number } {
	const templates = perUnit.map((c) => chordTemplate(c, transpose));
	const n = frames.length;
	const k = perUnit.length;
	const meanAt = (center: number, half: number): Float32Array => {
		const f0 = Math.max(0, Math.round((center - half) / hopSec));
		const f1 = Math.min(n, Math.round((center + half) / hopSec));
		const m = new Float32Array(12);
		for (let t = f0; t < f1; t++) for (let c = 0; c < 12; c++) m[c]! += frames[t]![c]!;
		const cnt = Math.max(1, f1 - f0);
		for (let c = 0; c < 12; c++) m[c]! /= cnt;
		return m;
	};
	const chainScore = (unitSec: number, offset: number, shift: number): number => {
		let sum = 0;
		for (let u = 0; u < k; u++) {
			const tpl = templates[u];
			if (!tpl) {
				sum += 0.3;
				continue;
			}
			sum += dot(meanAt(offset + (u + 0.5 + shift) * unitSec, unitSec / 2), tpl);
		}
		return sum / k;
	};
	let best = { unitSec: unitSecDeclared, offset: 0, score: -Infinity };
	for (let s = -10; s <= 10; s++) {
		const unitSec = unitSecDeclared * (1 + s * 0.0025);
		const maxOffset = Math.min(searchSpanSec, Math.max(0, n * hopSec - k * unitSec));
		for (let offset = 0; offset <= maxOffset; offset += hopSec) {
			const score = chainScore(unitSec, offset, 0);
			if (score > best.score) best = { unitSec, offset, score };
		}
	}
	const off = chainScore(best.unitSec, best.offset, 0.5);
	const segments: Segment[] = perUnit.map((chord, u) => ({
		chord,
		from: best.offset + u * best.unitSec,
		to: best.offset + (u + 1) * best.unitSec,
	}));
	return { segments, ...best, contrast: off > 0 ? best.score / off : best.score };
}

/** The transposition (0..11 semitones up) that best fits the whole sequence; ties keep 0. */
export function calibrateTransposition(
	sequence: string[],
	frames: Float32Array[],
	hopSec: number,
	minSec = 1.0,
): { transpose: number; score: number } {
	let best = { transpose: 0, score: -Infinity };
	for (let tr = 0; tr < 12; tr++) {
		const { score } = alignSequenceToTime(sequence, frames, hopSec, minSec, tr);
		if (score > best.score) best = { transpose: tr, score };
	}
	return best;
}

/**
 * Global key calibration: the one chroma inference the Badverbs
 * validation DID support. The whole recording's mean chroma is
 * correlated against the truth chart's mean chord template over all 12
 * transpositions; a sheet in C played from a fast 78 transfer in C#
 * calibrates to +1. One categorical choice, no timeline fitting.
 */
export function calibrateKeyGlobal(
	truthChords: string[],
	frames: Float32Array[],
): { transpose: number; score: number; runnerUp: number } {
	const mean = new Float32Array(12);
	for (const f of frames) for (let c = 0; c < 12; c++) mean[c]! += f[c]!;
	let norm = 0;
	for (let c = 0; c < 12; c++) norm += mean[c]! * mean[c]!;
	norm = Math.sqrt(norm) || 1;
	for (let c = 0; c < 12; c++) mean[c]! /= norm;
	const scores: number[] = [];
	for (let tr = 0; tr < 12; tr++) {
		let sum = 0;
		let count = 0;
		for (const chord of truthChords) {
			const tpl = chordTemplate(chord, tr);
			if (!tpl) continue;
			sum += dot(mean, tpl);
			count++;
		}
		scores.push(count > 0 ? sum / count : 0);
	}
	const order = scores.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]);
	return { transpose: order[0]![1], score: order[0]![0], runnerUp: order[1]![0] };
}

/** The truth chord sounding at time t, or "" outside every segment. */
export function truthAtTime(segments: Segment[], t: number): string {
	for (const s of segments) if (t >= s.from && t < s.to) return s.chord;
	return "";
}

/** Transpose a chart symbol up `semis` semitones, keeping quality and slash bass. */
export function transposeSymbol(symbol: string, semis: number): string {
	if (semis === 0) return symbol;
	const [main, bass] = symbol.split("/");
	const p = parseChord(main!);
	if (!p.ok || p.pc === null) return symbol;
	const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
	const root = `${NAMES[(p.pc + semis) % 12]}${p.quality}`;
	if (!bass) return root;
	const pb = parseChord(bass);
	return pb.ok && pb.pc !== null ? `${root}/${NAMES[(pb.pc + semis) % 12]}` : root;
}
