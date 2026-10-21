/**
 * Builds the committed Study 1 fixture (docs/BRIEF-STUDY1.md): synthesizes
 * each corpus song, transcribes it with Basic Pitch exactly as stem-shovel's
 * server does, and writes corpus/fixture.json — per song, the transcribed
 * notes, the production bar-notes lines (`describeBars`) and the template
 * matcher's per-bar chords (`chordsPerBar`). Also prints fixture health:
 * the matcher's accuracy against ground truth, which is the free baseline
 * every model arm is compared to. Deterministic per corpus seed; the WAV
 * intermediates never leave the temp dir.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import progressions from "../corpus/progressions.json";
import { chordsPerBar, describeBars, type Note } from "../src/fixture/chords.js";
import { barStarts, renderSong, type SongSpec } from "../src/fixture/synth.js";
import { sameChord } from "../src/grading/symbols.js";

const MODEL_JSON = new URL("../src/fixture/model.json", import.meta.url).pathname;
const WEIGHTS_JSON = new URL("../src/fixture/weights.json", import.meta.url).pathname;
const CHILD = new URL("./transcribe-child.mjs", import.meta.url).pathname;

/** Expands matcher segments to one chord per bar. */
function perBar(segments: { bar: number; bars: number; chord: string }[], total: number): string[] {
	const out = new Array<string>(total).fill("N.C.");
	for (const s of segments) {
		for (let i = 0; i < s.bars && s.bar - 1 + i < total; i++) out[s.bar - 1 + i] = s.chord;
	}
	return out;
}

const dir = mkdtempSync(join(tmpdir(), "stem-bench-"));
const songs = progressions.songs as SongSpec[];
const fixture: {
	id: string;
	title: string;
	key: string;
	bpm: number;
	truth: string[];
	notes: [number, number, number, number][];
	barNotes: { bar: number; notes: string }[];
	matcherSegments: { bar: number; bars: number; chord: string }[];
	matcherPerBar: string[];
}[] = [];

let matcherHits = 0;
let totalBars = 0;
for (const [i, song] of songs.entries()) {
	const audio = renderSong(song, 1000 + i);
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
	const starts = barStarts(song);
	const barNotes = describeBars(notes, starts);
	const segments = chordsPerBar(notes, starts).map(({ bar, bars, chord }) => ({
		bar,
		bars,
		chord,
	}));
	const matcherPerBar = perBar(segments, song.chords.length);
	const hits = song.chords.filter((c, b) => sameChord(c, matcherPerBar[b]!)).length;
	matcherHits += hits;
	totalBars += song.chords.length;
	console.log(
		`${song.id}: ${rows.length} notes in ${((Date.now() - t0) / 1000).toFixed(0)}s, matcher ${hits}/${song.chords.length}`,
	);
	fixture.push({
		id: song.id,
		title: song.title,
		key: song.key,
		bpm: song.bpm,
		truth: song.chords,
		notes: rows,
		barNotes,
		matcherSegments: segments,
		matcherPerBar,
	});
}
rmSync(dir, { recursive: true, force: true });

writeFileSync(
	new URL("../corpus/fixture.json", import.meta.url).pathname,
	`${JSON.stringify({ version: 1, corpus: progressions.seed, songs: fixture }, null, "\t")}\n`,
);
console.log(
	`\nfixture.json written: ${songs.length} songs, ${totalBars} bars, matcher baseline ${matcherHits}/${totalBars} (${((100 * matcherHits) / totalBars).toFixed(1)}%)`,
);
