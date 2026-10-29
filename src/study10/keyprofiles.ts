/**
 * Study 10 N-key-profiles (docs/BRIEF-STUDY10.md): production's detectKey
 * with the Krumhansl–Kessler templates swapped for literature
 * alternatives — the cheapest possible candidate, isolating the profile
 * from the rest of the pipeline. detectKeyWith replicates the ported
 * detectKey (src/study9/analysis.ts) exactly, with the tables injected;
 * tests/study10.test.ts pins that the KK tables reproduce production's
 * answers on committed items. Pearson correlation is scale-invariant, so
 * the tables' different units do not matter.
 *
 * Sources for the tables (transcribed; the transcription is pinned by
 * the committed values themselves and disclosed in the brief):
 * - KK: Krumhansl & Kessler 1982, as production uses them (a99fb18).
 * - AS: Albrecht & Shanahan 2013 (Music Perception 31/1), corpus-derived.
 * - TP: Temperley 2007 (Music and Probability), Kostka–Payne profiles.
 */
import type { Detection } from "../study9/analysis.js";

export interface KeyProfiles {
	name: string;
	major: number[];
	minor: number[];
}

export const KK: KeyProfiles = {
	name: "krumhansl-kessler",
	major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
	minor: [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
};

export const AS: KeyProfiles = {
	name: "albrecht-shanahan",
	major: [0.238, 0.006, 0.111, 0.006, 0.137, 0.094, 0.016, 0.214, 0.009, 0.08, 0.008, 0.081],
	minor: [0.22, 0.006, 0.104, 0.123, 0.019, 0.103, 0.012, 0.214, 0.062, 0.022, 0.061, 0.052],
};

export const TP: KeyProfiles = {
	name: "temperley",
	major: [0.748, 0.06, 0.488, 0.082, 0.67, 0.46, 0.096, 0.715, 0.104, 0.366, 0.057, 0.4],
	minor: [0.712, 0.084, 0.474, 0.618, 0.049, 0.46, 0.105, 0.747, 0.404, 0.067, 0.133, 0.33],
};

const NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

function correlation(a: ArrayLike<number>, b: number[], rotate: number): number {
	const n = 12;
	let ma = 0;
	let mb = 0;
	for (let i = 0; i < n; i++) {
		ma += a[i]!;
		mb += b[i]!;
	}
	ma /= n;
	mb /= n;
	let num = 0;
	let da = 0;
	let db = 0;
	for (let i = 0; i < n; i++) {
		const x = a[(i + rotate) % n]! - ma;
		const y = b[i]! - mb;
		num += x * y;
		da += x * x;
		db += y * y;
	}
	return da && db ? num / Math.sqrt(da * db) : 0;
}

/** Production's detectKey verbatim, profiles injected (incl. the bass tiebreak). */
export function detectKeyWith(
	profiles: KeyProfiles,
	chroma: Float32Array,
	bassChroma?: Float32Array,
): Detection["key"] {
	const total = chroma.reduce((a, b) => a + b, 0);
	if (total <= 0) return { value: "", confidence: 0 };
	const scores: { value: string; tonic: number; r: number }[] = [];
	for (let tonic = 0; tonic < 12; tonic++) {
		scores.push({
			value: `${NOTE_NAMES[tonic]} major`,
			tonic,
			r: correlation(chroma, profiles.major, tonic),
		});
		scores.push({
			value: `${NOTE_NAMES[tonic]} minor`,
			tonic,
			r: correlation(chroma, profiles.minor, tonic),
		});
	}
	scores.sort((a, b) => b.r - a.r);
	let [first, second] = scores as [
		{ value: string; tonic: number; r: number },
		{ value: string; tonic: number; r: number },
	];
	const bassTotal = bassChroma?.reduce((a, b) => a + b, 0) ?? 0;
	if (bassChroma && bassTotal > 0 && first.tonic !== second.tonic && first.r - second.r < 0.15) {
		if (bassChroma[second.tonic]! > bassChroma[first.tonic]! * 1.1) [first, second] = [second, first];
	}
	return { value: first.value, confidence: Math.max(0, Math.min(1, (first.r - second.r) * 4)) };
}
