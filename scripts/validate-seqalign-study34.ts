/**
 * Study 34 instrument validation (docs/CORPUS-STUDY34.md): can the
 * sequence-to-time aligner (src/study34/seqalign.ts) recover chord
 * boundaries on real recordings whose per-bar truth is already known?
 * The Badverbs band charts give the truth: declared bpm grids on DAW
 * exports (bar one at 0:00). We hide the durations, hand the aligner
 * only the ordered chord list and the mix's chromagram, and measure
 * boundary error and label-at-time agreement against the chart grid.
 * The numbers go verbatim into BRIEF-STUDY34's instrument disclosure.
 */
import { readFileSync } from "node:fs";
import { chromagram } from "../src/study12/chroma.js";
import { barmarkChartBars } from "../src/study16/barmarkChartBars.js";
import { alignRigid, calibrateKeyGlobal, truthAtTime } from "../src/study34/seqalign.js";

const root = new URL("../", import.meta.url).pathname;
const declared = JSON.parse(readFileSync(`${root}corpus/badverbs-declared.json`, "utf8")) as {
	songs: { slug: string; chart: string; defaults: { tempo: number; meter: string } }[];
};

for (const slug of ["letter-lands", "peaceful-dreams", "eat-all-the-clocks"]) {
	const song = declared.songs.find((s) => s.slug === slug);
	if (!song) throw new Error(slug);
	const chartText = readFileSync(`${root}${song.chart}`, "utf8");
	const read = barmarkChartBars(chartText, song.defaults);
	if (!read) throw new Error(`${slug}: chart refused`);
	const truthBars = read.bars.map((b) => b.chords);
	const beatsPerBar = Number(song.defaults.meter.split("/")[0]);
	const barSec = (60 / song.defaults.tempo) * beatsPerBar;

	// truth segments from the chart grid (bar one at 0:00 for a DAW export),
	// at HALF-BAR resolution so two-chord bars keep both chords
	const truthSegs: { chord: string; from: number; to: number }[] = [];
	for (const [b, chords] of truthBars.entries()) {
		const named = chords.filter((c) => c !== "");
		if (named.length === 0) continue;
		const step = barSec / named.length;
		for (const [i, chord] of named.entries()) {
			const from = b * barSec + i * step;
			const last = truthSegs[truthSegs.length - 1];
			if (last && last.chord === chord && Math.abs(last.to - from) < 0.01) last.to = from + step;
			else truthSegs.push({ chord, from, to: from + step });
		}
	}
	const sequence = truthSegs.map((s) => s.chord);
	// RIGID mode (Tier 2): per-half-bar symbols, each exactly one grid unit —
	// the published sheet gives exact bar counts, only tempo and anchor are fit
	const rigid: string[] = [];
	for (const s of truthSegs) for (let u = 0; u < Math.round((s.to - s.from) / (barSec / 2)); u++) rigid.push(s.chord);

	const buf = readFileSync(`${root}corpus-mmkk/${slug}/mix.mp3.22050.f32le.raw`);
	const mono = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
	const { frames, hopSec } = chromagram(mono);
	// half-bar units so two-chord bars stay representable; declared bpm, offset hidden
	const { segments, score, contrast, offset, unitSec } = alignRigid(rigid, frames, hopSec, barSec / 2);
	console.log(
		`${slug}: rigid fit offset ${offset.toFixed(2)}s (truth 0.00) unit ${unitSec.toFixed(3)}s (truth ${(barSec / 2).toFixed(3)}) contrast ${contrast.toFixed(2)}`,
	);
	if (segments.length !== rigid.length) {
		console.log(`${slug}: FIT FAILED (${segments.length}/${rigid.length} segments)`);
		continue;
	}

	// label-at-time agreement sampled every quarter bar over the charted span
	let right = 0;
	let total = 0;
	const end = truthSegs[truthSegs.length - 1]!.to;
	for (let t = barSec / 8; t < end; t += barSec / 4) {
		total++;
		if (truthAtTime(segments, t) === truthAtTime(truthSegs, t)) right++;
	}
	console.log(
		`${slug}: ${sequence.length} chord segments | label-at-time ${right}/${total} = ${((100 * right) / total).toFixed(1)}% | fit score ${score.toFixed(3)}`,
	);
	const key = calibrateKeyGlobal(sequence, frames);
	console.log(
		`${slug}: key calibration transpose ${key.transpose} (truth 0) score ${key.score.toFixed(3)} runner-up ${key.runnerUp.toFixed(3)}`,
	);
}
