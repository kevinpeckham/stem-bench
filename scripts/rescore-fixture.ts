/**
 * Amendment 2 (docs/BRIEF-STUDY1.md): stem-shovel v0.142.0 changed the
 * matcher's scoring (the missing-tone penalty, adopted from Study 1's
 * finding), so this re-runs `chordsPerBar` — now the v0.142.0 port — over
 * the fixture's STORED notes and writes the result as new fields
 * (`matcher2Segments`, `matcher2PerBar`) beside the originals. Nothing is
 * re-transcribed and nothing existing is rewritten: Study 1's prompts and
 * baseline stay reproducible from the v0.141 fields. Prints both baselines
 * and the per-song deltas for the REPORT addendum.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chordsPerBar, type Note } from "../src/fixture/chords.js";
import { barStarts, type SongSpec } from "../src/fixture/synth.js";
import { sameChord } from "../src/grading/symbols.js";

const path = new URL("../corpus/fixture.json", import.meta.url).pathname;
const fixture = JSON.parse(readFileSync(path, "utf8"));

function perBar(segments: { bar: number; bars: number; chord: string }[], total: number): string[] {
	const out = new Array<string>(total).fill("N.C.");
	for (const s of segments) {
		for (let i = 0; i < s.bars && s.bar - 1 + i < total; i++) out[s.bar - 1 + i] = s.chord;
	}
	return out;
}

let oldHits = 0;
let newHits = 0;
let total = 0;
for (const song of fixture.songs) {
	const notes: Note[] = (song.notes as [number, number, number, number][]).map(
		([start, duration, pitch, amplitude]) => ({ start, end: start + duration, pitch, amplitude }),
	);
	const starts = barStarts({ bpm: song.bpm, chords: song.truth } as SongSpec);
	const segments = chordsPerBar(notes, starts).map(({ bar, bars, chord }) => ({
		bar,
		bars,
		chord,
	}));
	song.matcher2Segments = segments;
	song.matcher2PerBar = perBar(segments, song.truth.length);
	const o = song.truth.filter((c: string, b: number) => sameChord(c, song.matcherPerBar[b])).length;
	const n = song.truth.filter((c: string, b: number) => sameChord(c, song.matcher2PerBar[b])).length;
	oldHits += o;
	newHits += n;
	total += song.truth.length;
	if (o !== n) console.log(`${song.id}: ${o} → ${n} of ${song.truth.length}`);
}
writeFileSync(path, `${JSON.stringify(fixture, null, "\t")}\n`);
console.log(
	`\nmatcher baseline: v0.141 ${oldHits}/${total} (${((100 * oldHits) / total).toFixed(1)}%) → v0.142 ${newHits}/${total} (${((100 * newHits) / total).toFixed(1)}%)`,
);
