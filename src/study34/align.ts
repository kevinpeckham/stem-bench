/**
 * Study 34 (docs/CORPUS-STUDY34.md): transfer alignment. A JAAH
 * annotation's beat times live on the annotated transfer's timeline;
 * our public-domain 78 transfer differs by playback speed (a scale,
 * about the ratio of durations, confirmed by the tuning offsets JAAH
 * records) and a start offset. Fit both by maximizing the mean onset
 * envelope at the mapped beat times — the same mechanical anchoring
 * the hand-charted slots get from their committed diagnostics.
 */

export interface Alignment {
	scale: number;
	offset: number;
	/** Mean envelope at mapped beats over the envelope's own mean: >1 means the grid lands on onsets. */
	gain: number;
	/**
	 * The fit's gain over the same fit shifted half a beat: the test of
	 * alignment itself. Raw gain is deflated on horn-era transfers whose
	 * surface noise lifts the whole envelope; contrast is not.
	 */
	contrast: number;
}

export function alignBeats(
	theirBeats: number[],
	env: Float32Array,
	fps: number,
	scale0: number,
): Alignment {
	let envMean = 0;
	for (let i = 0; i < env.length; i++) envMean += env[i]!;
	envMean /= env.length || 1;
	const at = (t: number): number => {
		const f = t * fps;
		const i = Math.floor(f);
		if (i < 0 || i + 1 >= env.length) return 0;
		return env[i]! + (env[i + 1]! - env[i]!) * (f - i);
	};
	let best: Alignment = { scale: scale0, offset: 0, gain: 0, contrast: 0 };
	for (let s = -20; s <= 20; s++) {
		const scale = scale0 * (1 + s * 0.001);
		for (let o = -500; o <= 500; o++) {
			const offset = o * 0.01;
			let sum = 0;
			for (const b of theirBeats) sum += at(b * scale + offset);
			const gain = sum / theirBeats.length / (envMean || 1);
			if (gain > best.gain) best = { scale, offset, gain, contrast: 0 };
		}
	}
	const medBeat =
		theirBeats.length > 1 ? (theirBeats[theirBeats.length - 1]! - theirBeats[0]!) / (theirBeats.length - 1) : 0.5;
	let offBeat = 0;
	for (const b of theirBeats) offBeat += at((b + medBeat / 2) * best.scale + best.offset);
	offBeat = offBeat / theirBeats.length / (envMean || 1);
	best.contrast = offBeat > 0 ? best.gain / offBeat : best.gain;
	return best;
}
