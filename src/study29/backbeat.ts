/**
 * Study 29 instruments (docs/BRIEF-STUDY29.md): synthetic beat-weight
 * envelopes for the catch map, the RBJ high-pass used to make real
 * mixes backbeat-heavy, and the grid classifier.
 */

export const FPS = 125;

/**
 * A 4/4 onset envelope: `downbeatW` on beats 1 and 3, 1.0 on beats 2
 * and 4, optional `hihatW` on every off-beat eighth and `pickupW` one
 * eighth before each downbeat. Anchor is bar one's downbeat time.
 */
export function beatEnvelope(
	bpm: number,
	nBars: number,
	anchor: number,
	downbeatW: number,
	opts: { hihatW?: number; pickupW?: number } = {},
): Float32Array {
	const beat = 60 / bpm;
	const period = 4 * beat;
	const env = new Float32Array(Math.ceil((anchor + nBars * period + 2) * FPS));
	const put = (t: number, w: number) => {
		const f = Math.round(t * FPS);
		if (f >= 0 && f < env.length) env[f] = Math.max(env[f]!, w);
	};
	for (let i = 0; i < nBars; i++) {
		const bar = anchor + i * period;
		put(bar, downbeatW);
		put(bar + beat, 1.0);
		put(bar + 2 * beat, downbeatW);
		put(bar + 3 * beat, 1.0);
		if (opts.hihatW) for (let k = 0; k < 8; k += 2) put(bar + (k + 1) * (beat / 2), opts.hihatW);
		if (opts.pickupW) put(bar - beat / 2, opts.pickupW);
	}
	return env;
}

/** Classify a slid grid against the true lattice: downbeat / backbeat / elsewhere. */
export function classifyGrid(
	barStart0: number,
	trueAnchor: number,
	bpm: number,
): "downbeat" | "backbeat" | "elsewhere" {
	const beat = 60 / bpm;
	const period = 4 * beat;
	const offBeats = (((barStart0 - trueAnchor) % period) + period) % period / beat; // 0..4
	const nearest = Math.round(offBeats) % 4;
	const dist = Math.min(Math.abs(offBeats - Math.round(offBeats)), Math.abs(offBeats - 4 - Math.round(offBeats - 4)));
	if (dist > 0.1) return "elsewhere";
	return nearest === 0 ? "downbeat" : "backbeat";
}

/** RBJ biquad high-pass (Q = 0.7071), applied in place-safe copy. */
export function highpass(x: Float32Array, rate: number, fc: number): Float32Array {
	const w0 = (2 * Math.PI * fc) / rate;
	const q = Math.SQRT1_2;
	const alpha = Math.sin(w0) / (2 * q);
	const cosw = Math.cos(w0);
	const b0 = (1 + cosw) / 2;
	const b1 = -(1 + cosw);
	const b2 = (1 + cosw) / 2;
	const a0 = 1 + alpha;
	const a1 = -2 * cosw;
	const a2 = 1 - alpha;
	const y = new Float32Array(x.length);
	let x1 = 0;
	let x2 = 0;
	let y1 = 0;
	let y2 = 0;
	for (let i = 0; i < x.length; i++) {
		const xi = x[i]!;
		const yi = (b0 / a0) * xi + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
		y[i] = yi;
		x2 = x1;
		x1 = xi;
		y2 = y1;
		y1 = yi;
	}
	return y;
}

/** The brief's 4th-order skirt: the biquad applied twice. */
export function highpass4(x: Float32Array, rate: number, fc: number): Float32Array {
	return highpass(highpass(x, rate, fc), rate, fc);
}
