/**
 * Study 34b truth instrument (docs/BRIEF-STUDY34B.md): declared tempos
 * for the two Tier 2 slots, which have bar truth but no time truth.
 * The publication fixes each repeat's length in beats; the recording's
 * chroma self-similarity fixes the repeat's period in seconds; tempo
 * follows with no reference to the production detector or its onset
 * comb. Run once before registration; output committed to
 * corpus/study34b-declared.json.
 *
 * - roll-called-up-yonder: the engraved verse+refrain form is 16 bars
 *   of 4/4 = 64 beats per cycle. The verse lag is refined over its
 *   first three multiples (they must agree if the peak is the form).
 * - three-oclock-waltz: the extraction's exact repeat (bars 13-45
 *   recur at 77-109) fixes a 64-bar = 192-beat lag between strain A
 *   and its reprise.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromagram } from "../src/study12/chroma.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { peakNorm } from "../src/study33/stereo.js";

const root = new URL("../", import.meta.url).pathname;

function loadRaw(path: string): Float32Array {
	const buf = readFileSync(path);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

interface Lagged {
	lagSec: number;
	r: number;
	mean: number;
}

/** Best chroma self-correlation lag in [loSec, hiSec], with the range mean for contrast. */
function bestLag(frames: Float32Array[], hopSec: number, loSec: number, hiSec: number): Lagged {
	const F = frames.length;
	const lo = Math.floor(loSec / hopSec);
	const hi = Math.min(F - 10, Math.ceil(hiSec / hopSec));
	let best = -1;
	let bestR = -1;
	let sum = 0;
	let n = 0;
	for (let lag = lo; lag <= hi; lag++) {
		let dot = 0;
		let m = 0;
		for (let f = 0; f + lag < F; f++) {
			const a = frames[f]!;
			const b = frames[f + lag]!;
			let d = 0;
			for (let k = 0; k < 12; k++) d += a[k]! * b[k]!;
			dot += d;
			m++;
		}
		const r = dot / m;
		sum += r;
		n++;
		if (r > bestR) {
			bestR = r;
			best = lag;
		}
	}
	return { lagSec: best * hopSec, r: bestR, mean: sum / n };
}

const out: Record<string, unknown> = {};

{
	const mono = peakNorm(loadRaw(`${root}corpus-study34/roll-called-up-yonder.mp3.22050.f32le.raw`));
	const span = audibleSpan(mono, 22050);
	const ch = chromagram(mono);
	const p1 = bestLag(ch.frames, ch.hopSec, 30, 50);
	const p2 = bestLag(ch.frames, ch.hopSec, p1.lagSec * 2 - 4, p1.lagSec * 2 + 4);
	const p3 = bestLag(ch.frames, ch.hopSec, p1.lagSec * 3 - 4, p1.lagSec * 3 + 4);
	const period = (p1.lagSec + p2.lagSec / 2 + p3.lagSec / 3) / 3;
	const bpm = (64 * 60) / period;
	out["roll-called-up-yonder"] = {
		beatsPerCycle: 64,
		multiples: [p1, p2, p3],
		versePeriodSec: period,
		bpm,
		declared: Math.round(bpm),
		spanSec: span.last - span.first,
		cycles: (span.last - span.first) / period,
	};
	console.log(
		`hymn: P1 ${p1.lagSec.toFixed(3)} P2/2 ${(p2.lagSec / 2).toFixed(3)} P3/3 ${(p3.lagSec / 3).toFixed(3)} -> ${bpm.toFixed(1)} bpm, ${((span.last - span.first) / period).toFixed(2)} cycles`,
	);
}

{
	const mono = peakNorm(loadRaw(`${root}corpus-study34/three-oclock-waltz.mp3.22050.f32le.raw`));
	const span = audibleSpan(mono, 22050);
	const ch = chromagram(mono);
	const p = bestLag(ch.frames, ch.hopSec, 75, 110);
	const bpm = (192 * 60) / p.lagSec;
	const spanSec = span.last - span.first;
	const barsAtBpm = (spanSec / 60) * (bpm / 3);
	out["three-oclock-waltz"] = {
		beatsPerLag: 192,
		strainLag: p,
		bpm,
		declared: Math.round(bpm),
		spanSec,
		barsAtBpm,
		formIdentity: "118 published bars + one repeated 31-bar strain = 149",
	};
	console.log(`waltz: strain lag ${p.lagSec.toFixed(3)}s -> ${bpm.toFixed(1)} bpm, ${barsAtBpm.toFixed(1)} bars in span`);
}

writeFileSync(`${root}corpus/study34b-declared.json`, `${JSON.stringify(out, null, "\t")}\n`);
console.log("corpus/study34b-declared.json written");
