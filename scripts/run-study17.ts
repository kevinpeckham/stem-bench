/**
 * Study 17 arms A–D (docs/BRIEF-STUDY17.md): three zero-model
 * transcription successors against the real-recording cliff, beside
 * the Study 13 anchor. Arm A re-runs Study 13 arm 1 byte-for-byte
 * (the instrument proof); B transcribes each non-drum stem alone and
 * merges the notes; C feeds bar-pooled chroma to production's own
 * matcher; D is ChordMini on the mix (its native domain), with a
 * disclosed secondary read on the summed harmonic audio. One shared
 * bar grid per song (Study 12's alignment, recomputed as Study 13
 * did). Zero model spend; prints the registered arm-E trigger.
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
import { type BarGrade, gradeBars } from "../src/study13/grading13.js";
import { chromaChordsPerBar } from "../src/study17/chromaChords.js";
import type { Meter4 } from "../src/study4/synth4.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL_JSON = `${root}src/fixture/model.json`;
const WEIGHTS_JSON = `${root}src/fixture/weights.json`;
const CHILD = `${root}scripts/transcribe-child.mjs`;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function peakNormalize(x: Float32Array): Float32Array {
	let peak = 0;
	for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]!));
	if (peak > 0) for (let i = 0; i < x.length; i++) x[i]! /= peak;
	return x;
}

function transcribe(dir: string, tag: string, audio: Float32Array): Note[] {
	const rawFile = join(dir, `${tag}.raw`);
	writeFileSync(rawFile, Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength));
	const t0 = Date.now();
	const proc = Bun.spawnSync(["node", CHILD, MODEL_JSON, WEIGHTS_JSON, rawFile], {
		maxBuffer: 256 * 1024 * 1024,
	});
	if (proc.exitCode !== 0) {
		console.error(proc.stderr.toString());
		throw new Error(`transcription failed for ${tag}`);
	}
	const rows = JSON.parse(proc.stdout.toString()) as [number, number, number, number][];
	console.log(`  transcribe ${tag}: ${rows.length} notes in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
	return rows.map(([start, duration, pitch, amplitude]) => ({
		start,
		end: start + duration,
		pitch,
		amplitude,
	}));
}

function matcherPerBar(notes: Note[], barStarts: number[], bars: number): string[] {
	const perBar = new Array<string>(bars).fill("N.C.");
	for (const s of chordsPerBar(notes, barStarts)) {
		for (let k = 0; k < s.bars && s.bar - 1 + k < bars; k++) perBar[s.bar - 1 + k] = s.chord;
	}
	return perBar;
}

function chordMini(dir: string, tag: string, rawPath: string, barStarts: number[]): string[] {
	const barsFile = join(dir, `${tag}-bars.json`);
	const outFile = join(dir, `${tag}-nchord.json`);
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const t0 = Date.now();
	const proc = Bun.spawnSync([PY, NCHORD, "--raw", rawPath, "--out", outFile, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (proc.exitCode !== 0) {
		console.error(proc.stderr.toString());
		throw new Error(`nchord failed for ${tag}`);
	}
	console.log(`  nchord ${tag}: ${((Date.now() - t0) / 1000).toFixed(0)}s`);
	const parsed = JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] };
	return parsed.perBar.map((c) => (c === "" ? "N.C." : c));
}

const dir = mkdtempSync(join(tmpdir(), "stem-bench17-"));
const out: unknown[] = [];
for (const song of mmkkCharts.songs as {
	slug: string;
	gated: boolean;
	bpm: number;
	meter: string;
	sections: { name: string; bars: string[][] }[];
}[]) {
	console.log(`\n${song.slug}${song.gated ? " (GATED)" : " (exploratory)"}:`);
	const m = (manifestMmkk.songs as {
		slug: string;
		mix: { url: string } | null;
		stems: { name: string; url: string }[];
		declared: { key: { value: string }[] };
	}[]).find((x) => x.slug === song.slug)!;
	const harmonicStems = m.stems.filter((s) => !/drum/i.test(s.name));
	const stemAudio = harmonicStems.map((s) => ({
		name: s.name,
		samples: loadRaw(`${root}corpus-mmkk/${song.slug}/${s.url.split("/").pop()}.22050.f32le.raw`),
	}));

	// Arm A input: the sum of the non-drum stems, peak-normalized (Study 13).
	const len = Math.max(...stemAudio.map((s) => s.samples.length));
	const harmonic = new Float32Array(len);
	for (const s of stemAudio) for (let i = 0; i < s.samples.length; i++) harmonic[i]! += s.samples[i]!;
	peakNormalize(harmonic);

	// The shared bar grid: Study 12's alignment, recomputed exactly as Study 13.
	const mixRawPath = m.mix ? `${root}corpus-mmkk/${song.slug}/mix.mp3.22050.f32le.raw` : null;
	const mixAudio = mixRawPath ? loadRaw(mixRawPath) : harmonic;
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
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const barStarts = ref.barStarts.map((s) => aligned.mapSeconds(s));

	// Arm A — the anchor (Study 13 arm 1 verbatim).
	const notesA = transcribe(dir, `${song.slug}-A-sum`, harmonic);
	const perBarA = matcherPerBar(notesA, barStarts, truth.length);

	// Arm B — per-stem transcription, notes merged, same matcher.
	const notesB: Note[] = [];
	const stemNoteCounts: { name: string; notes: number }[] = [];
	for (const s of stemAudio) {
		const alone = peakNormalize(new Float32Array(s.samples));
		const notes = transcribe(dir, `${song.slug}-B-${s.name.replace(/\W+/g, "-")}`, alone);
		stemNoteCounts.push({ name: s.name, notes: notes.length });
		notesB.push(...notes);
	}
	const perBarB = matcherPerBar(notesB, barStarts, truth.length);

	// Arm C — bar-pooled chroma of the summed harmonic audio into chordOf.
	const recHarm = chromagram(harmonic);
	const perBarC = chromaChordsPerBar(recHarm.frames, recHarm.hopSec, barStarts);

	// Arm D — ChordMini on the mix (registered), harmonic sum (disclosed).
	const perBarDmix = mixRawPath
		? chordMini(dir, `${song.slug}-D-mix`, mixRawPath, barStarts)
		: null;
	const harmRawPath = join(dir, `${song.slug}-harm.raw`);
	writeFileSync(harmRawPath, Buffer.from(harmonic.buffer, harmonic.byteOffset, harmonic.byteLength));
	const perBarDharm = chordMini(dir, `${song.slug}-D-harm`, harmRawPath, barStarts);

	const grades: Record<string, BarGrade | null> = {
		A: gradeBars(perBarA, truth),
		B: gradeBars(perBarB, truth),
		C: gradeBars(perBarC, truth),
		Dmix: perBarDmix ? gradeBars(perBarDmix, truth) : null,
		DharmDisclosed: gradeBars(perBarDharm, truth),
	};
	for (const [arm, g] of Object.entries(grades)) {
		if (!g) continue;
		console.log(
			`  ${arm.padEnd(15)} ${g.right}/${g.bars} (${((100 * g.right) / g.bars).toFixed(1)}%) | strict-first ${g.strictFirstRight} | power ${g.powerAllowance}`,
		);
	}
	out.push({
		slug: song.slug,
		gated: song.gated,
		declaredKey: m.declared.key[0]?.value ?? null,
		barStarts: barStarts.map((s) => Math.round(s * 100) / 100),
		truth,
		stemNoteCounts,
		noteCountA: notesA.length,
		arms: {
			A: { perBar: perBarA, grade: grades.A },
			B: { perBar: perBarB, grade: grades.B },
			C: { perBar: perBarC, grade: grades.C },
			Dmix: perBarDmix ? { perBar: perBarDmix, grade: grades.Dmix } : null,
			DharmDisclosed: { perBar: perBarDharm, grade: grades.DharmDisclosed },
		},
		barNotesA: describeBars(notesA, barStarts),
		barNotesB: describeBars(notesB, barStarts),
	});
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(`${root}results/study17.json`, `${JSON.stringify({ version: 1, songs: out }, null, "\t")}\n`);

// Registered verdicts (docs/BRIEF-STUDY17.md).
const gatedSong = (out as {
	gated: boolean;
	arms: Record<string, { grade: BarGrade } | null>;
}[]).find((s) => s.gated)!;
const a = gatedSong.arms.A!.grade;
const g1 =
	a.right === 29 && a.bars === 76 && a.strictFirstRight === 20 && a.powerAllowance === 9;
console.log(`\nS17-G1 (anchor reproduces Study 13): ${g1 ? "PASS" : "FAIL — STOP, investigate"}`);
const candidates = (["B", "C", "Dmix"] as const)
	.map((k) => ({ arm: k, grade: gatedSong.arms[k]?.grade }))
	.filter((x): x is { arm: "B" | "C" | "Dmix"; grade: BarGrade } => !!x.grade)
	.sort((x, y) => y.grade.right - x.grade.right);
const best = candidates[0]!;
console.log(`Best successor arm: ${best.arm} at ${best.grade.right}/76`);
console.log(`S17-G2 (>= 37/76): ${best.grade.right >= 37 ? "PASS" : "FAIL"}`);
console.log(`S17-G3 (>= 44/76): ${best.grade.right >= 44 ? "PASS" : "FAIL"}`);
console.log(
	`Arm E trigger (runs iff G2 passes): ${best.grade.right >= 37 ? `RUNS on arm ${best.arm}` : "SKIPPED by rule"}`,
);
