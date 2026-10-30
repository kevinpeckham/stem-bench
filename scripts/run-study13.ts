/**
 * Study 13 arm 1 (docs/BRIEF-STUDY13.md): production's chord path on
 * real recordings, for the first time. The song's non-drum stems are
 * summed (production's chord evidence is harmonic; drums are excluded
 * by label, disclosed), transcribed by the committed Basic Pitch
 * pipeline exactly as Study 1, matched by the v0.142 matcher, and the
 * bar grid comes from Study 12's alignment of the transcribed chart —
 * so every piece is code or data. Scored against the chart
 * transcription. Zero model spend; prints the registered arm-2 trigger.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { chordsPerBar, describeBars, type Note } from "../src/fixture/chords.js";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { renderReference, type RefBar } from "../src/study12/reference.js";
import { gradeBars } from "../src/study13/grading13.js";
import type { Meter4 } from "../src/study4/synth4.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL_JSON = `${root}src/fixture/model.json`;
const WEIGHTS_JSON = `${root}src/fixture/weights.json`;
const CHILD = `${root}scripts/transcribe-child.mjs`;

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

const dir = mkdtempSync(join(tmpdir(), "stem-bench13-"));
const out: unknown[] = [];
for (const song of mmkkCharts.songs as {
	slug: string;
	gated: boolean;
	bpm: number;
	meter: string;
	sections: { name: string; bars: string[][] }[];
}[]) {
	const m = (manifestMmkk.songs as {
		slug: string;
		mix: { url: string } | null;
		stems: { name: string; url: string }[];
		declared: { key: { value: string }[] };
	}[]).find((x) => x.slug === song.slug)!;
	// The harmonic evidence: every stem whose label is not drums.
	const harmonicStems = m.stems.filter((s) => !/drum/i.test(s.name));
	const stems = harmonicStems.map((s) =>
		loadRaw(`${root}corpus-mmkk/${song.slug}/${s.url.split("/").pop()}.22050.f32le.raw`),
	);
	const len = Math.max(...stems.map((s) => s.length));
	const harmonic = new Float32Array(len);
	for (const s of stems) for (let i = 0; i < s.length; i++) harmonic[i]! += s[i]!;
	let peak = 0;
	for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(harmonic[i]!));
	if (peak > 0) for (let i = 0; i < len; i++) harmonic[i]! /= peak;

	// Transcribe exactly as Study 1 (Basic Pitch via the committed child).
	const rawFile = join(dir, `${song.slug}.raw`);
	writeFileSync(rawFile, Buffer.from(harmonic.buffer, harmonic.byteOffset, harmonic.byteLength));
	const t0 = Date.now();
	const proc = Bun.spawnSync(["node", CHILD, MODEL_JSON, WEIGHTS_JSON, rawFile], {
		maxBuffer: 256 * 1024 * 1024,
	});
	if (proc.exitCode !== 0) {
		console.error(proc.stderr.toString());
		throw new Error(`transcription failed for ${song.slug}`);
	}
	const rows = JSON.parse(proc.stdout.toString()) as [number, number, number, number][];
	const notes: Note[] = rows.map(([start, duration, pitch, amplitude]) => ({
		start,
		end: start + duration,
		pitch,
		amplitude,
	}));
	console.log(`${song.slug}: ${rows.length} notes in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

	// The bar grid in recording seconds: Study 12's alignment, recomputed.
	const mixAudio = m.mix
		? loadRaw(`${root}corpus-mmkk/${song.slug}/mix.mp3.22050.f32le.raw`)
		: harmonic;
	const bars: RefBar[] = [];
	const truth: string[][] = [];
	for (const s of song.sections) {
		for (const chords of s.bars) {
			bars.push({ chords, bpm: song.bpm });
			truth.push(chords);
		}
	}
	const ref = renderReference(bars, song.meter as Meter4);
	const rec = chromagram(mixAudio);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, { subsequence: true });
	const barStarts = ref.barStarts.map((s) => aligned.mapSeconds(s));

	const segments = chordsPerBar(notes, barStarts);
	const perBar = new Array<string>(truth.length).fill("N.C.");
	for (const s of segments) {
		for (let k = 0; k < s.bars && s.bar - 1 + k < truth.length; k++) perBar[s.bar - 1 + k] = s.chord;
	}
	const grade = gradeBars(perBar, truth);
	out.push({
		slug: song.slug,
		gated: song.gated,
		declaredKey: m.declared.key[0]?.value ?? null,
		noteCount: rows.length,
		barStarts: barStarts.map((s) => Math.round(s * 100) / 100),
		perBar,
		barNotes: describeBars(notes, barStarts),
		truth,
		grade,
	});
	console.log(
		`${song.slug}${song.gated ? " (GATED)" : " (exploratory)"}: matcher ${grade.right}/${grade.bars} (${((100 * grade.right) / grade.bars).toFixed(1)}%) | strict-first ${grade.strictFirstRight}/${grade.bars} | power allowance used ${grade.powerAllowance}`,
	);
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(`${root}results/study13-arm1.json`, `${JSON.stringify({ version: 1, songs: out }, null, "\t")}\n`);
const gatedGrade = (out as { gated: boolean; grade: { right: number; bars: number } }[]).find((s) => s.gated)!.grade;
const pct = (100 * gatedGrade.right) / gatedGrade.bars;
console.log(
	`\nRegistered trigger (arm 2 runs iff gated accuracy < 90%): ${pct.toFixed(1)}% → arm 2 ${pct < 90 ? "RUNS" : "SKIPPED by rule"}`,
);
