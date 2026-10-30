/**
 * Study 12 DTW (docs/BRIEF-STUDY12.md): classic dynamic time warping
 * over chroma sequences, cosine distance, steps (1,1), (1,2), (2,1) —
 * the reference axis is monotone and never stalls, so a bar cannot map
 * to zero time. `subsequence: true` frees the recording's start and end
 * (count-ins, tails — the real-recording case). Returns the path and a
 * mapper from reference seconds to recording seconds (linear between
 * path knots). Normalized path cost reported for the wrong-chart probe.
 */

function cosineDist(a: Float32Array, b: Float32Array): number {
	let dot = 0;
	for (let i = 0; i < 12; i++) dot += a[i]! * b[i]!;
	// Frames are L2-normalized (or zero); a zero frame is maximally far
	// from everything except another zero frame.
	let na = 0;
	let nb = 0;
	for (let i = 0; i < 12; i++) {
		na += a[i]! ** 2;
		nb += b[i]! ** 2;
	}
	if (na < 1e-12 && nb < 1e-12) return 0;
	if (na < 1e-12 || nb < 1e-12) return 1;
	return 1 - dot;
}

export interface DtwResult {
	/** Path as [refIndex, recIndex] pairs, start to end. */
	path: [number, number][];
	/** Mean per-step cost along the path. */
	normalizedCost: number;
	/** Reference seconds → recording seconds, linear between knots. */
	mapSeconds: (refSec: number) => number;
}

export function dtwAlign(
	ref: Float32Array[],
	rec: Float32Array[],
	hopSec: number,
	opts: { subsequence?: boolean } = {},
): DtwResult {
	const n = ref.length;
	const m = rec.length;
	const INF = Number.POSITIVE_INFINITY;
	// D[i][j]: cost of best path ending at ref i-1, rec j-1 (1-based pad).
	const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(INF));
	const steps = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
	for (let j = 0; j <= m; j++) D[0]![j] = opts.subsequence ? 0 : j === 0 ? 0 : INF;
	if (!opts.subsequence) D[0]![0] = 0;
	for (let i = 1; i <= n; i++) {
		for (let j = 1; j <= m; j++) {
			const c = cosineDist(ref[i - 1]!, rec[j - 1]!);
			// (1,1) diagonal; (1,2) reference slower; (2,1) reference faster.
			const d11 = D[i - 1]![j - 1]!;
			const d12 = j >= 2 ? D[i - 1]![j - 2]! : INF;
			const d21 = i >= 2 ? D[i - 2]![j - 1]! : INF;
			let best = d11;
			let step = 1;
			if (d12 < best) {
				best = d12;
				step = 2;
			}
			if (d21 < best) {
				best = d21;
				step = 3;
			}
			D[i]![j] = best + c;
			steps[i]![j] = step;
		}
	}
	// End: last reference frame against the best (subsequence) or last column.
	let endJ = m;
	if (opts.subsequence) {
		let best = INF;
		for (let j = 1; j <= m; j++) {
			if (D[n]![j]! < best) {
				best = D[n]![j]!;
				endJ = j;
			}
		}
	}
	// Backtrack.
	const path: [number, number][] = [];
	let i = n;
	let j = endJ;
	while (i >= 1 && j >= 1) {
		path.push([i - 1, j - 1]);
		const s = steps[i]![j]!;
		if (s === 2) {
			i -= 1;
			j -= 2;
		} else if (s === 3) {
			i -= 2;
			j -= 1;
		} else {
			i -= 1;
			j -= 1;
		}
		if (opts.subsequence && i === 0) break;
	}
	path.reverse();
	const normalizedCost = D[n]![endJ]! / Math.max(1, path.length);
	const knotsRef = path.map(([r]) => r * hopSec);
	const knotsRec = path.map(([, c]) => c * hopSec);
	const mapSeconds = (refSec: number): number => {
		if (path.length === 0) return refSec;
		if (refSec <= knotsRef[0]!) return knotsRec[0]! + (refSec - knotsRef[0]!);
		for (let k = 1; k < knotsRef.length; k++) {
			if (refSec <= knotsRef[k]!) {
				const span = knotsRef[k]! - knotsRef[k - 1]!;
				const t = span > 1e-9 ? (refSec - knotsRef[k - 1]!) / span : 0;
				return knotsRec[k - 1]! + t * (knotsRec[k]! - knotsRec[k - 1]!);
			}
		}
		return knotsRec[knotsRec.length - 1]! + (refSec - knotsRef[knotsRef.length - 1]!);
	};
	return { path, normalizedCost, mapSeconds };
}
