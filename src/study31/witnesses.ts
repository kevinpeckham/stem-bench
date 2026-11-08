/**
 * Study 31 instruments (docs/BRIEF-STUDY31.md): seven downbeat
 * witnesses, each voting for a BEAT CLASS (lattice beat index mod
 * beats-per-bar, origin at the Study 28 base anchor, so the base is
 * class 0), plus the registered weighted vote with the humility rule.
 */

export const mod = (j: number, m: number) => ((j % m) + m) % m;

export function classOf(t: number, anchor: number, beat: number, beats: number): number {
	return mod(Math.round((t - anchor) / beat), beats);
}

export function median(xs: number[]): number {
	const s = [...xs].sort((a, b) => a - b);
	return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
}

/** Local maxima above `thresh`, at least `minSepSec` apart (keep the taller). */
export function peaks(env: Float32Array, fps: number, minSepSec: number, thresh: number): number[] {
	const out: number[] = [];
	const minSep = Math.max(1, Math.round(minSepSec * fps));
	let lastIdx = -minSep;
	let lastVal = Number.NEGATIVE_INFINITY;
	for (let i = 1; i < env.length - 1; i++) {
		const v = env[i]!;
		if (v <= thresh || v < env[i - 1]! || v < env[i + 1]!) continue;
		if (i - lastIdx < minSep) {
			if (v > lastVal) {
				out[out.length - 1] = i / fps;
				lastIdx = i;
				lastVal = v;
			}
			continue;
		}
		out.push(i / fps);
		lastIdx = i;
		lastVal = v;
	}
	return out;
}

/** RMS amplitude envelope (window 50 ms, hop 10 ms -> fps 100). */
export function rmsEnvelope(x: Float32Array, rate: number): { env: Float32Array; fps: number } {
	const win = Math.round(0.05 * rate);
	const hop = Math.round(0.01 * rate);
	const n = Math.max(0, Math.floor((x.length - win) / hop) + 1);
	const env = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		let s = 0;
		const o = i * hop;
		for (let k = 0; k < win; k++) s += x[o + k]! * x[o + k]!;
		env[i] = Math.sqrt(s / win);
	}
	return { env, fps: rate / hop };
}

export interface Vote {
	cls: number | null;
	detail: Record<string, unknown>;
}

/** W1: time zero. */
export function w1TimeZero(anchor: number, beat: number, beats: number): Vote {
	const j = Math.round((0 - anchor) / beat);
	const distBeats = Math.abs(0 - (anchor + j * beat)) / beat;
	const phaseBeats = mod((0 - anchor) / beat, beats);
	return {
		cls: distBeats <= 0.25 ? mod(j, beats) : null,
		detail: { phaseBeats: Number(phaseBeats.toFixed(3)), distBeats: Number(distBeats.toFixed(3)) },
	};
}

/** Strong onset-envelope peaks (above the span's median), within the span. */
export function strongOnsets(
	onset: Float32Array,
	fps: number,
	beat: number,
	span: { first: number; last: number },
): number[] {
	const lo = Math.max(0, Math.floor(span.first * fps));
	const hi = Math.min(onset.length, Math.ceil(span.last * fps));
	const th = median(Array.from(onset.slice(lo, hi)));
	return peaks(onset, fps, 0.4 * beat, th).filter((t) => t >= span.first && t <= span.last);
}

/** W2: the last strong onset, with fade and ritardando abstentions. */
export function w2LastOnset(
	pk: number[],
	anchor: number,
	beat: number,
	beats: number,
	span: { first: number; last: number },
): Vote {
	if (pk.length === 0) return { cls: null, detail: { abstain: "no strong onsets" } };
	const last = pk[pk.length - 1]!;
	if (last < span.last - 4 * beats * beat) return { cls: null, detail: { abstain: "fade", last } };
	const windowPk = pk.filter((t) => t >= last - 8 * beat);
	if (windowPk.length < 3) return { cls: null, detail: { abstain: "too few end onsets", last } };
	const locals: number[] = [];
	for (let i = 1; i < windowPk.length; i++) {
		const d = windowPk[i]! - windowPk[i - 1]!;
		const m = Math.round(d / beat);
		if (m >= 1) locals.push(d / m);
	}
	if (locals.length === 0) return { cls: null, detail: { abstain: "too few end onsets", last } };
	const localBeat = median(locals);
	if (Math.abs(localBeat - beat) / beat > 0.03)
		return {
			cls: null,
			detail: { abstain: "ritardando", localBeat: Number(localBeat.toFixed(4)), beat },
		};
	const snapBeats = Math.abs(last - (anchor + Math.round((last - anchor) / beat) * beat)) / beat;
	return {
		cls: classOf(last, anchor, beat, beats),
		detail: { last: Number(last.toFixed(3)), snapBeats: Number(snapBeats.toFixed(3)) },
	};
}

/** W3: both ends together. */
export function w3BothEnds(pk: number[], anchor: number, beat: number, beats: number): Vote {
	if (pk.length < 2) return { cls: null, detail: { abstain: "too few onsets" } };
	const first = pk[0]!;
	const last = pk[pk.length - 1]!;
	const r = mod(Math.round((last - first) / beat), beats);
	if (r !== 0) return { cls: null, detail: { abstain: "remainder", remainder: r } };
	return { cls: classOf(first, anchor, beat, beats), detail: { remainder: 0, first: Number(first.toFixed(3)) } };
}

/** W4: harmonic rhythm from per-beat chord labels on the lattice. */
export function w4Harmonic(labels: string[], beats: number): Vote {
	const hist = new Array(beats).fill(0) as number[];
	let changes = 0;
	for (let j = 1; j < labels.length; j++) {
		const a = labels[j - 1]!;
		const b = labels[j]!;
		if (a !== b && a !== "" && b !== "" && a !== "N.C." && b !== "N.C.") {
			hist[mod(j, beats)]!++;
			changes++;
		}
	}
	if (changes < beats) return { cls: null, detail: { abstain: "too few changes", changes } };
	const order = hist.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v);
	return {
		cls: order[0]!.i,
		detail: { hist, margin: order[0]!.v - order[1]!.v, changes },
	};
}

/** W5: crashes — high-band peaks whose decay to a quarter of peak outlasts a beat. */
export function w5Crashes(
	hpEnv: Float32Array,
	fps: number,
	anchor: number,
	beat: number,
	beats: number,
): Vote {
	const mean = hpEnv.reduce((a, b) => a + b, 0) / hpEnv.length;
	const sd = Math.sqrt(hpEnv.reduce((a, b) => a + (b - mean) ** 2, 0) / hpEnv.length);
	const pk = peaks(hpEnv, fps, 0.9 * beat, mean + 2 * sd);
	const crashes: number[] = [];
	for (const t of pk) {
		const i0 = Math.round(t * fps);
		const quarter = hpEnv[i0]! * 0.25;
		let i = i0;
		while (i < hpEnv.length && hpEnv[i]! > quarter) i++;
		if ((i - i0) / fps > beat) crashes.push(t);
	}
	if (crashes.length < 3) return { cls: null, detail: { abstain: "too few crashes", crashes: crashes.length } };
	const hist = new Array(beats).fill(0) as number[];
	for (const t of crashes) hist[classOf(t, anchor, beat, beats)]!++;
	const order = hist.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v);
	return { cls: order[0]!.i, detail: { hist, crashes: crashes.length } };
}

/** W6 decision core: snare pair + kick, bass confirms or vetoes. */
export function w6Decide(
	snareHist: number[] | null,
	kickHist: number[] | null,
	bassCls: number | null,
	beats: number,
): Vote {
	let cls: number | null = null;
	let modeUsed = "none";
	if (kickHist) {
		if (beats === 4 && snareHist) {
			const order = snareHist.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v);
			const [a, b] = [order[0]!.i, order[1]!.i];
			if (mod(a + 2, 4) === b) {
				const c1 = mod(a + 1, 4);
				const c2 = mod(a + 3, 4);
				cls = kickHist[c1]! >= kickHist[c2]! ? c1 : c2;
				modeUsed = "snare+kick";
			} else {
				cls = kickHist.indexOf(Math.max(...kickHist));
				modeUsed = "kick-only (snare bins not opposite)";
			}
		} else {
			cls = kickHist.indexOf(Math.max(...kickHist));
			modeUsed = beats === 3 ? "kick (3/4)" : "kick-only";
		}
	}
	if (bassCls !== null && cls !== null && bassCls !== cls)
		return { cls: null, detail: { abstain: "bass veto", drums: cls, bass: bassCls, modeUsed } };
	if (cls === null && bassCls !== null) {
		cls = bassCls;
		modeUsed = "bass-only";
	}
	if (cls === null) return { cls: null, detail: { abstain: "no stems" } };
	return { cls, detail: { modeUsed, bass: bassCls, snareHist, kickHist } };
}

/** Checkerboard novelty over beat-synchronous chroma at half-size L. */
export function checkerboardNovelty(beatChroma: Float32Array[], L: number): Float32Array {
	const n = beatChroma.length;
	const sim = (a: number, b: number) => {
		if (a < 0 || b < 0 || a >= n || b >= n) return 0;
		const x = beatChroma[a]!;
		const y = beatChroma[b]!;
		let d = 0;
		for (let k = 0; k < x.length; k++) d += x[k]! * y[k]!;
		return d;
	};
	const g = (i: number) => Math.exp(-((i / L) ** 2) * 2);
	const nov = new Float32Array(n);
	for (let b = 0; b < n; b++) {
		let s = 0;
		for (let i = -L; i < L; i++)
			for (let j = -L; j < L; j++) {
				const sameSide = (i < 0 && j < 0) || (i >= 0 && j >= 0);
				s += (sameSide ? 1 : -1) * g(i + 0.5) * g(j + 0.5) * sim(b + i, b + j);
			}
		nov[b] = s;
	}
	return nov;
}

/** W7: section boundaries' classes. */
export function w7Section(beatChroma: Float32Array[], beats: number): Vote {
	const all: number[] = [];
	for (const L of [8, 16]) {
		const nov = checkerboardNovelty(beatChroma, L);
		const mean = nov.reduce((a, b) => a + b, 0) / nov.length;
		const sd = Math.sqrt(nov.reduce((a, b) => a + (b - mean) ** 2, 0) / nov.length);
		all.push(...peaks(nov, 1, L / 2, mean + sd));
	}
	if (all.length < 2) return { cls: null, detail: { abstain: "too few boundaries", peaks: all.length } };
	const hist = new Array(beats).fill(0) as number[];
	for (const b of all) hist[mod(Math.round(b), beats)]!++;
	const order = hist.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v);
	return { cls: order[0]!.i, detail: { hist, peaks: all.length } };
}

export interface VoteResult {
	scores: number[];
	winner: number;
	decided: number;
	undecided: boolean;
}

/** The registered vote: humility rule guards any move off the base class (0). */
export function weightedVote(votes: { cls: number | null; weight: number }[], beats: number): VoteResult {
	const scores = new Array(beats).fill(0) as number[];
	for (const v of votes) if (v.cls !== null) scores[v.cls]! += v.weight;
	let winner = 0;
	for (let i = 1; i < beats; i++) if (scores[i]! > scores[winner]!) winner = i;
	if (winner === 0) return { scores, winner, decided: 0, undecided: false };
	const runnerUp = Math.max(...scores.filter((_, i) => i !== winner));
	const moves = scores[winner]! >= scores[0]! + 2 && scores[winner]! >= runnerUp + 1;
	return { scores, winner, decided: moves ? winner : 0, undecided: !moves };
}
