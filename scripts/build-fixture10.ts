/**
 * Builds the committed Study 10 fixture (docs/BRIEF-STUDY10.md):
 * - Band items: the 17 Study 4/8 specs (seeds 4000+i, incl. the 2
 *   pulseless), the 6 Study 9 mislead specs (seeds 9000+i, mix = the
 *   parts' sum) and the 12 hard-set specs (corpus/mixes10.json, seeds
 *   10000+i, src/study10/synth10.ts). Per item: truth, bar grid, beat
 *   grid (the meter's beats: 4, 3 or 2 per bar), section truth, class.
 *   Audio is not committed — renders are deterministic from spec + seed.
 * - Chord songs: Study 1's 16 (truth and the v0.142 matcher baseline
 *   already in corpus/fixture.json) plus the 4 hard progressions
 *   (corpus/progressions10.json, seeds 1100+i), each rendered,
 *   transcribed with Basic Pitch exactly as Study 1, and scored by the
 *   v0.142 matcher port — D-prod's chord baseline.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fixture1 from "../corpus/fixture.json";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import mixes10 from "../corpus/mixes10.json";
import progressions10 from "../corpus/progressions10.json";
import { chordsPerBar, describeBars, type Note } from "../src/fixture/chords.js";
import { barStarts as songBarStarts, renderSong, type SongSpec } from "../src/fixture/synth.js";
import { sameChord } from "../src/grading/symbols.js";
import { barSeconds, truthOf, type MixSpec } from "../src/study4/synth4.js";
import { sectionTruth } from "../src/study8/sections.js";
import type { MixSpec9 } from "../src/study9/parts.js";
import type { MixSpec10 } from "../src/study10/synth10.js";

const MODEL_JSON = new URL("../src/fixture/model.json", import.meta.url).pathname;
const WEIGHTS_JSON = new URL("../src/fixture/weights.json", import.meta.url).pathname;
const CHILD = new URL("./transcribe-child.mjs", import.meta.url).pathname;

function gridOf(spec: MixSpec): { barStarts: number[]; beats: number[] } {
	const perBar = spec.meter === "4/4" ? 4 : spec.meter === "3/4" ? 3 : 2;
	let t = 0;
	const starts: number[] = [];
	const beats: number[] = [];
	for (const s of spec.sections) {
		const barSec = barSeconds(spec.meter, s.bpm);
		for (let b = 0; b < s.bars.length; b++) {
			starts.push(t);
			for (let k = 0; k < perBar; k++) beats.push(t + (k * barSec) / perBar);
			t += barSec;
		}
	}
	starts.push(t);
	return { barStarts: starts, beats };
}

function classOf(spec: MixSpec9 & MixSpec10, source: string): string {
	if (spec.pulseless) return "pulseless";
	if (source === "mixes9") return "mislead";
	if (source === "mixes10") {
		if (spec.swing !== undefined) return "hard-swing";
		if (spec.dense) return "hard-dense";
		if (spec.reverb) return "hard-reverb";
		if (spec.sections.length > 1) return "hard-mediantmod";
		return "hard-octave";
	}
	if (spec.sections.some((s) => s.name)) return "contrast";
	return spec.sections.length > 1 ? "change" : "loop";
}

const bandItems: unknown[] = [];
const add = (spec: MixSpec9 & MixSpec10, seed: number, renderer: string, source: string) => {
	const truth = truthOf(spec);
	const grid = gridOf(spec);
	bandItems.push({
		id: spec.id,
		class: classOf(spec, source),
		renderer,
		seed,
		truth,
		barStarts: grid.barStarts,
		beats: grid.beats,
		sections: sectionTruth(spec),
	});
};
for (const [i, spec] of (mixes.mixes as (MixSpec9 & MixSpec10)[]).entries()) {
	add(spec, 4000 + i, "synth4", "mixes");
}
for (const [i, spec] of (mixes9.mixes as (MixSpec9 & MixSpec10)[]).entries()) {
	add(spec, 9000 + i, "parts9", "mixes9");
}
for (const [i, spec] of (mixes10.mixes as (MixSpec9 & MixSpec10)[]).entries()) {
	add(spec, 10000 + i, "synth10", "mixes10");
}

/** The 4 hard progressions through Study 1's exact pipeline. */
const chordSongs: unknown[] = [];
for (const song of fixture1.songs) {
	chordSongs.push({
		id: song.id,
		source: "fixture1",
		bpm: song.bpm,
		key: song.key,
		truth: song.truth,
		matcherPerBar: song.matcher2PerBar,
	});
}
const dir = mkdtempSync(join(tmpdir(), "stem-bench10-"));
for (const [i, song] of (progressions10.songs as SongSpec[]).entries()) {
	const seed = 1100 + i;
	const audio = renderSong(song, seed);
	const raw = join(dir, `${song.id}.raw`);
	writeFileSync(raw, Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength));
	const t0 = Date.now();
	const proc = Bun.spawnSync(["node", CHILD, MODEL_JSON, WEIGHTS_JSON, raw], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (proc.exitCode !== 0) {
		console.error(proc.stderr.toString());
		throw new Error(`transcription failed for ${song.id}`);
	}
	const rows = JSON.parse(proc.stdout.toString()) as [number, number, number, number][];
	const notes: Note[] = rows.map(([start, duration, pitch, amplitude]) => ({
		start,
		end: start + duration,
		pitch,
		amplitude,
	}));
	const starts = songBarStarts(song);
	const segments = chordsPerBar(notes, starts);
	const matcherPerBar = new Array<string>(song.chords.length).fill("N.C.");
	for (const s of segments) {
		for (let k = 0; k < s.bars && s.bar - 1 + k < song.chords.length; k++) {
			matcherPerBar[s.bar - 1 + k] = s.chord;
		}
	}
	const hits = song.chords.filter((c, b) => sameChord(c, matcherPerBar[b]!)).length;
	console.log(
		`${song.id}: ${rows.length} notes in ${((Date.now() - t0) / 1000).toFixed(0)}s, matcher ${hits}/${song.chords.length}`,
	);
	chordSongs.push({
		id: song.id,
		source: "progressions10",
		seed,
		bpm: song.bpm,
		key: song.key,
		truth: song.chords,
		notes: rows,
		barNotes: describeBars(notes, starts),
		matcherPerBar,
	});
}
rmSync(dir, { recursive: true, force: true });

writeFileSync(
	new URL("../corpus/fixture10.json", import.meta.url).pathname,
	`${JSON.stringify(
		{
			version: 1,
			corpus: `${mixes.seed}+${mixes9.seed}+${mixes10.seed}+${progressions10.seed}`,
			models: {
				"small0.onnx": "c462b064a4033050ca6a5354bf866ff4610ab1fd8f1dec1e494b20b22d870aea",
				"linkseg_7c.onnx": "c1dac2e094d260678d0097b85da6f5189abfe87af4b9c6f7adebaf99f4896125",
				"chordnet.onnx": "1faee8e1cf168300afe0f47517e76836ac200c3841b0fb430fad7dfea5ad6394",
				"cqt-plan.bin": "c31f0a6fd2d582d753be6628b5daecdee58acba53cba93b2bc2b5c75dee2ba48",
				"chordmini-config.json": "1f26c11ebea51ec08f12e813eb213a729fa0ecc407ac7632dfdc7bad67e65aa4",
			},
			bandItems,
			chordSongs,
		},
		null,
		"\t",
	)}\n`,
);
console.log(`\nfixture10.json: ${bandItems.length} band items, ${chordSongs.length} chord songs`);
