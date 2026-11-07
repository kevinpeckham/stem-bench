/**
 * Study 20 (docs/BRIEF-STUDY20.md): coloring ChordMini's per-bar roots
 * from the note channel. Fixture arm: the PRESENT_SHARE sweep on the
 * 440-bar synthetic corpus with a truth-proxy model (color erased).
 * Real arms: A0 (the model as shipped), A1 (shipped constants), A2 (the
 * fixture-chosen constant), A3 (the forced-root matcher, the negative
 * control), on re-transcribed notes; eat-all-the-clocks runs on two
 * note channels (with and without the vocal stem). Zero model spend.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fixture from "../corpus/fixture.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import type { Note } from "../src/fixture/chords.js";
import { type SongSpec, barStarts as fixtureBarStarts } from "../src/fixture/synth.js";
import { parseChord } from "../src/grading/symbols.js";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import { chordRight, gradeBars } from "../src/study13/grading13.js";
import { SHIPPED } from "../src/study18/chords231.js";
import {
	type ColorConfig,
	type Reduced,
	SHIPPED20,
	barEvidence,
	colorChord,
	forcedRootChord,
	reduceLabel,
} from "../src/study20/color20.js";
import { gradeStrict } from "../src/study20/strict20.js";
import type { Meter4 } from "../src/study4/synth4.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL_JSON = `${root}src/fixture/model.json`;
const WEIGHTS_JSON = `${root}src/fixture/weights.json`;
const CHILD = `${root}scripts/transcribe-child.mjs`;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const VOCAL_STEM = "Eat all the Clocks";

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

function nchord(dir: string, tag: string, rawPath: string, barStarts: number[]) {
	const barsFile = join(dir, `${tag}-bars.json`);
	const outFile = join(dir, `${tag}-nchord.json`);
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const proc = Bun.spawnSync([PY, NCHORD, "--raw", rawPath, "--out", outFile, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (proc.exitCode !== 0) {
		console.error(proc.stderr.toString());
		throw new Error(`nchord failed for ${tag}`);
	}
	const parsed = JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[]; perBarRaw: string[] };
	return {
		perBar: parsed.perBar.map((c) => (c === "" ? "N.C." : c)),
		perBarRaw: parsed.perBarRaw,
	};
}

/** The fixture proxy: the truth's quality with the COLOR erased (the brief's A2). */
function proxyQuality(quality: string): Reduced {
	const map: Record<string, Reduced> = {
		"": "maj", "5": "maj", sus4: "maj", sus2: "maj", "7sus4": "7",
		m: "min", "7": "7", maj7: "maj7", m7: "min7", dim: "dim", aug: "aug",
	};
	return map[quality] ?? "maj";
}

// ---------- Fixture arm: the PRESENT_SHARE sweep ----------
const SWEEP = [0.08, 0.1, 0.12, 0.15, 0.2];
type FixtureSong = { bpm: number; truth: string[]; notes: [number, number, number, number][] };
const sweepTable: { presentShare: number; right: number }[] = [];
import { strictSame } from "../src/study20/strict20.js";
for (const presentShare of SWEEP) {
	let right = 0;
	for (const song of (fixture as unknown as { songs: FixtureSong[] }).songs) {
		const starts = fixtureBarStarts({ bpm: song.bpm, chords: song.truth } as SongSpec);
		const notes: Note[] = song.notes.map(([start, duration, pitch, amplitude]) => ({
			start,
			end: start + duration,
			pitch,
			amplitude,
		}));
		for (let b = 0; b + 1 < starts.length; b++) {
			const t = song.truth[b]!;
			const p = parseChord(t);
			if (!p.ok || p.pc === null) continue;
			const ev = barEvidence(notes, starts[b]!, starts[b + 1]!, SHIPPED.bassMinShare);
			const colored = colorChord(p.pc, proxyQuality(p.quality), ev, {
				presentShare,
				slashMinShare: 0.2,
			});
			if (strictSame(colored.chord, t)) right++;
		}
	}
	sweepTable.push({ presentShare, right });
	console.log(`fixture sweep presentShare ${presentShare}: ${right}/440 strict`);
}
// The fixture's pick: highest strict score, ties broken toward the shipped 0.12.
const bestScore = Math.max(...sweepTable.map((r) => r.right));
const winners = sweepTable.filter((r) => r.right === bestScore).map((r) => r.presentShare);
const chosen = winners.includes(0.12) ? 0.12 : winners[0]!;
console.log(`A2 constant chosen by the fixture: presentShare ${chosen}\n`);

// ---------- Real arms ----------
interface ArmResult {
	perBar: string[];
	strict: ReturnType<typeof gradeStrict>;
	rootLevel: ReturnType<typeof gradeBars>;
	costFromA0: number;
	flips: { bar: number; to: string; strictRight: boolean }[];
	slashes: { bar: number; to: string; strictRight: boolean }[];
}

const dir = mkdtempSync(join(tmpdir(), "stem-bench20-"));
const out: Record<string, unknown> = { sweepTable, chosenPresentShare: chosen };
const gatePrimary: Record<string, Record<string, ArmResult>> = {};

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
	const harmonic = m.stems.filter((s) => !/drum/i.test(s.name));
	const channels: { name: string; stems: typeof harmonic }[] = [
		{ name: "all", stems: harmonic },
	];
	if (harmonic.some((s) => s.name === VOCAL_STEM))
		channels.push({ name: "noVocal", stems: harmonic.filter((s) => s.name !== VOCAL_STEM) });

	// The shared bar grid (Studies 13/17/18/19) and the model's bars (A0).
	const bars: RefBar[] = [];
	const truth: string[][] = [];
	for (const s of song.sections)
		for (const chords of s.bars) {
			bars.push({ chords, bpm: song.bpm });
			truth.push(chords);
		}
	const ref = renderReference(bars, song.meter as Meter4);
	const mixRawPath = `${root}corpus-mmkk/${song.slug}/mix.mp3.22050.f32le.raw`;
	const rec = chromagram(loadRaw(mixRawPath));
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const barStarts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	const model = nchord(dir, song.slug, mixRawPath, barStarts);
	const a0: ArmResult = {
		perBar: model.perBar,
		strict: gradeStrict(model.perBar, truth),
		rootLevel: gradeBars(model.perBar, truth),
		costFromA0: 0,
		flips: [],
		slashes: [],
	};

	const songOut: Record<string, unknown> = {
		barStarts: barStarts.map((s) => Math.round(s * 100) / 100),
		truth,
		modelPerBarRaw: model.perBarRaw,
		A0: a0,
	};
	for (const channel of channels) {
		const stemAudio = channel.stems.map((s) =>
			loadRaw(`${root}corpus-mmkk/${song.slug}/${s.url.split("/").pop()}.22050.f32le.raw`),
		);
		const len = Math.max(...stemAudio.map((s) => s.length));
		const sum = new Float32Array(len);
		for (const s of stemAudio) for (let i = 0; i < s.length; i++) sum[i]! += s[i]!;
		const notes = transcribe(dir, `${song.slug}-${channel.name}`, peakNormalize(sum));

		const colorArm = (cfg: ColorConfig): ArmResult => {
			const perBar: string[] = [];
			const flips: ArmResult["flips"] = [];
			const slashes: ArmResult["slashes"] = [];
			for (let b = 0; b < truth.length; b++) {
				const { rootPc, quality } = reduceLabel(model.perBarRaw[b]!);
				if (rootPc === null) {
					perBar.push("N.C.");
					continue;
				}
				const ev = barEvidence(notes, barStarts[b]!, barStarts[b + 1]!, SHIPPED.bassMinShare);
				const colored = colorChord(rootPc, quality, ev, cfg);
				perBar.push(colored.chord);
				const strictRight = truth[b]!.some((t) => t !== "" && strictSame(t, colored.chord));
				if (colored.flipped) flips.push({ bar: b + 1, to: colored.chord, strictRight });
				if (colored.slashed) slashes.push({ bar: b + 1, to: colored.chord, strictRight });
			}
			return {
				perBar,
				strict: gradeStrict(perBar, truth),
				rootLevel: gradeBars(perBar, truth),
				costFromA0: truth.filter(
					(t, b) => chordRight(model.perBar[b]!, t) && !chordRight(perBar[b]!, t),
				).length,
				flips,
				slashes,
			};
		};
		const a3PerBar: string[] = [];
		for (let b = 0; b < truth.length; b++) {
			const { rootPc } = reduceLabel(model.perBarRaw[b]!);
			if (rootPc === null) {
				a3PerBar.push("N.C.");
				continue;
			}
			const ev = barEvidence(notes, barStarts[b]!, barStarts[b + 1]!, SHIPPED.bassMinShare);
			const boosted = new Float64Array(ev.profile);
			if (ev.bass !== null) boosted[ev.bass]! += ev.bassWeight * 0.5;
			a3PerBar.push(forcedRootChord(boosted, ev.bass, SHIPPED, rootPc).chord);
		}
		const arms: Record<string, ArmResult> = {
			A1: colorArm(SHIPPED20),
			A2: colorArm({ presentShare: chosen, slashMinShare: 0.2 }),
			A3: {
				perBar: a3PerBar,
				strict: gradeStrict(a3PerBar, truth),
				rootLevel: gradeBars(a3PerBar, truth),
				costFromA0: truth.filter(
					(t, b) => chordRight(model.perBar[b]!, t) && !chordRight(a3PerBar[b]!, t),
				).length,
				flips: [],
				slashes: [],
			},
		};
		for (const [name, arm] of Object.entries({ A0: a0, ...arms })) {
			console.log(
				`  [${channel.name}] ${name}: strict ${arm.strict.right}/${arm.strict.bars} (first ${arm.strict.strictFirstRight}) | root-level ${arm.rootLevel.right} | cost ${arm.costFromA0} | flips ${arm.flips.length} (${arm.flips.filter((f) => f.strictRight).length} right) | slashes ${arm.slashes.length}`,
			);
		}
		(songOut as Record<string, unknown>)[`arms_${channel.name}`] = arms;
		if (channel.name === "all") gatePrimary[song.slug] = { A0: a0, ...arms };
	}
	out[song.slug] = songOut;
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(`${root}results/study20.json`, `${JSON.stringify({ version: 1, ...out }, null, "\t")}\n`);

// ---------- Gates ----------
const letter = gatePrimary["letter-lands"]!;
const eat = gatePrimary["eat-all-the-clocks"]!;
const g1 = letter.A1!.strict.right >= 46 && eat.A1!.strict.right >= 38;
const g2 =
	letter.A1!.rootLevel.right >= letter.A0!.rootLevel.right - 1 &&
	eat.A1!.rootLevel.right >= eat.A0!.rootLevel.right - 1;
const g3 = letter.A1!.costFromA0 <= 4 && eat.A1!.costFromA0 <= 4;
const a1Total = letter.A1!.strict.right + eat.A1!.strict.right;
const a3Total = letter.A3!.strict.right + eat.A3!.strict.right;
console.log(`\nS20-G1 (A1 strict >= 46/76 and >= 38/86): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S20-G2 (root-level within 1 of A0 per song): ${g2 ? "PASS" : "FAIL"}`);
console.log(`S20-G3 (cost from A0 <= 4 per song): ${g3 ? "PASS" : "FAIL"}`);
console.log(`S20-G4 (A3 ${a3Total} < A1 ${a1Total} strict total): ${a3Total < a1Total ? "PASS" : "FAIL"}`);
