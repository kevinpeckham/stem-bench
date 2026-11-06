/**
 * Study 18 (docs/BRIEF-STUDY18.md): the v0.231.0 matcher rules, fixture
 * arm and real arm, all through the registered parameterized port.
 * Zero model calls. Writes results/study18.json; on a 439/440 shipped
 * fixture read, adds matcher3Segments/matcher3PerBar to
 * corpus/fixture.json beside the existing fields (handoff follow-up 1).
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import type { Note } from "../src/fixture/chords.js";
import { type SongSpec, barStarts as fixtureBarStarts } from "../src/fixture/synth.js";
import { sameChord } from "../src/grading/symbols.js";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import { type BarGrade, gradeBars } from "../src/study13/grading13.js";
import { type MatcherConfig, SHIPPED, V142, chordsPerBar231 } from "../src/study18/chords231.js";
import type { Meter4 } from "../src/study4/synth4.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL_JSON = `${root}src/fixture/model.json`;
const WEIGHTS_JSON = `${root}src/fixture/weights.json`;
const CHILD = `${root}scripts/transcribe-child.mjs`;

function perBar(segments: { bar: number; bars: number; chord: string }[], total: number): string[] {
	const out = new Array<string>(total).fill("N.C.");
	for (const s of segments) {
		for (let i = 0; i < s.bars && s.bar - 1 + i < total; i++) out[s.bar - 1 + i] = s.chord;
	}
	return out;
}

// --- Fixture arm: the handoff's five-row table over stored notes ---
const fixturePath = `${root}corpus/fixture.json`;
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const ROWS: { label: string; cfg: MatcherConfig; expected: number }[] = [
	{ label: "v0.142 (0.05 / 0.08 / -)", cfg: V142, expected: 424 },
	{ label: "bass 0.15 only", cfg: { presentShare: 0.05, missingPenalty: 0.08, bassMinShare: 0.15 }, expected: 432 },
	{ label: "bass + present 0.12, old penalty", cfg: { presentShare: 0.12, missingPenalty: 0.08, bassMinShare: 0.15 }, expected: 432 },
	{ label: "SHIPPED (0.12 / 0.12 / 0.15)", cfg: SHIPPED, expected: 439 },
	{ label: "present 0.15 variant", cfg: { presentShare: 0.15, missingPenalty: 0.12, bassMinShare: 0.15 }, expected: 439 },
];
const fixtureTable: { label: string; right: number; expected: number }[] = [];
const staticBloom = { pre: 0, post: 0 };
const shippedBySong = new Map<string, { segments: ReturnType<typeof chordsPerBar231>; perBar: string[] }>();
for (const row of ROWS) {
	let right = 0;
	for (const song of fixture.songs) {
		const notes: Note[] = (song.notes as [number, number, number, number][]).map(
			([start, duration, pitch, amplitude]) => ({ start, end: start + duration, pitch, amplitude }),
		);
		const starts = fixtureBarStarts({ bpm: song.bpm, chords: song.truth } as SongSpec);
		const segments = chordsPerBar231(notes, starts, row.cfg);
		const bars = perBar(segments, song.truth.length);
		const hits = song.truth.filter((c: string, b: number) => sameChord(c, bars[b]!)).length;
		right += hits;
		if (song.id === "static-bloom") {
			if (row.cfg === V142) staticBloom.pre = hits;
			if (row.cfg === SHIPPED) staticBloom.post = hits;
		}
		if (row.cfg === SHIPPED)
			shippedBySong.set(song.id, {
				segments: segments.map(({ bar, bars: n, chord }) => ({ bar, bars: n, chord })) as never,
				perBar: bars,
			});
	}
	fixtureTable.push({ label: row.label, right, expected: row.expected });
	console.log(`fixture · ${row.label}: ${right}/440 (expected ${row.expected})`);
}
const g2 =
	fixtureTable.every((r) => r.right === r.expected) &&
	staticBloom.pre === 20 &&
	staticBloom.post === 28;
console.log(
	`static-bloom: ${staticBloom.pre} → ${staticBloom.post} of 28\nS18-G2 (fixture table reproduces the handoff): ${g2 ? "PASS" : "FAIL"}`,
);
if (g2) {
	for (const song of fixture.songs) {
		const s = shippedBySong.get(song.id)!;
		song.matcher3Segments = s.segments;
		song.matcher3PerBar = s.perBar;
	}
	writeFileSync(fixturePath, `${JSON.stringify(fixture, null, "\t")}\n`);
	console.log("matcher3 fields written beside the v0.141/v0.142 fields");
}

// --- Real arm: re-transcribe, shared bar grid, three configs + sweep ---
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
	const proc = Bun.spawnSync(["node", CHILD, MODEL_JSON, WEIGHTS_JSON, rawFile], {
		maxBuffer: 256 * 1024 * 1024,
	});
	if (proc.exitCode !== 0) {
		console.error(proc.stderr.toString());
		throw new Error(`transcription failed for ${tag}`);
	}
	const rows = JSON.parse(proc.stdout.toString()) as [number, number, number, number][];
	console.log(`  transcribe ${tag}: ${rows.length} notes`);
	return rows.map(([start, duration, pitch, amplitude]) => ({ start, end: start + duration, pitch, amplitude }));
}

const SWEEP: MatcherConfig[] = [];
for (const presentShare of [0.08, 0.1, 0.12, 0.15])
	for (const bassMinShare of [0.1, 0.15, 0.2, 0.25])
		SWEEP.push({ presentShare, missingPenalty: 0.12, bassMinShare });

const dir = mkdtempSync(join(tmpdir(), "stem-bench18-"));
const real: unknown[] = [];
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
	}[]).find((x) => x.slug === song.slug)!;
	const stems = m.stems.filter((s) => !/drum/i.test(s.name));
	const len = Math.max(
		...stems.map(
			(s) => loadRaw(`${root}corpus-mmkk/${song.slug}/${s.url.split("/").pop()}.22050.f32le.raw`).length,
		),
	);
	const harmonic = new Float32Array(len);
	for (const s of stems) {
		const audio = loadRaw(`${root}corpus-mmkk/${song.slug}/${s.url.split("/").pop()}.22050.f32le.raw`);
		for (let i = 0; i < audio.length; i++) harmonic[i]! += audio[i]!;
	}
	peakNormalize(harmonic);
	const mixAudio = m.mix ? loadRaw(`${root}corpus-mmkk/${song.slug}/mix.mp3.22050.f32le.raw`) : harmonic;
	const bars: RefBar[] = [];
	const truth: string[][] = [];
	for (const sec of song.sections)
		for (const chords of sec.bars) {
			bars.push({ chords, bpm: song.bpm });
			truth.push(chords);
		}
	const ref = renderReference(bars, song.meter as Meter4);
	const rec = chromagram(mixAudio);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, { subsequence: true });
	const starts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	const notes = transcribe(dir, `${song.slug}-sum`, harmonic);

	const score = (cfg: MatcherConfig): { perBar: string[]; grade: BarGrade } => {
		const pb = perBar(chordsPerBar231(notes, starts, cfg), truth.length);
		return { perBar: pb, grade: gradeBars(pb, truth) };
	};
	const anchor = score(V142);
	const bassOnly = score({ presentShare: 0.05, missingPenalty: 0.08, bassMinShare: 0.15 });
	const shipped = score(SHIPPED);
	for (const [label, r] of [
		["anchor (v0.142)", anchor],
		["bass-only", bassOnly],
		["shipped", shipped],
	] as const) {
		console.log(
			`  ${label.padEnd(16)} ${r.grade.right}/${r.grade.bars} | strict-first ${r.grade.strictFirstRight} | power ${r.grade.powerAllowance}`,
		);
	}
	const sweep = SWEEP.map((cfg) => ({ cfg, right: score(cfg).grade.right }));
	for (const s of sweep)
		console.log(
			`  sweep present ${s.cfg.presentShare.toFixed(2)} bass ${s.cfg.bassMinShare.toFixed(2)}: ${s.right}/${truth.length}`,
		);
	real.push({
		slug: song.slug,
		gated: song.gated,
		noteCount: notes.length,
		truth,
		anchor,
		bassOnly,
		shipped,
		sweep,
	});
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(
	`${root}results/study18.json`,
	`${JSON.stringify({ version: 1, fixtureTable, staticBloom, songs: real }, null, "\t")}\n`,
);

// --- Gates over the real arm ---
type RealSong = { gated: boolean; anchor: { grade: BarGrade }; bassOnly: { grade: BarGrade }; shipped: { grade: BarGrade } };
const songs = real as RealSong[];
const gated = songs.find((s) => s.gated)!;
const g1 =
	gated.anchor.grade.right === 29 &&
	gated.anchor.grade.bars === 76 &&
	gated.anchor.grade.strictFirstRight === 20 &&
	gated.anchor.grade.powerAllowance === 9 &&
	songs.find((s) => !s.gated)!.anchor.grade.right === 24;
console.log(`\nS18-G1 (anchor reproduces Study 13, third time): ${g1 ? "PASS" : "FAIL — STOP"}`);
const g3 =
	songs.every((s) => s.bassOnly.grade.right >= s.anchor.grade.right) &&
	songs.some((s) => s.bassOnly.grade.right > s.anchor.grade.right);
console.log(`S18-G3 (bass rule: >= on each song, > on one): ${g3 ? "PASS" : "FAIL"}`);
const shippedTotal = songs.reduce((a, s) => a + s.shipped.grade.right, 0);
const bassTotal = songs.reduce((a, s) => a + s.bassOnly.grade.right, 0);
console.log(
	`S18-G4 (presence rule: shipped ${shippedTotal} >= bass-only ${bassTotal} over both songs): ${shippedTotal >= bassTotal ? "PASS — shipped constants stand" : "FAIL — recommend reverting present/penalty to 0.05/0.08, keep the bass rule"}`,
);
