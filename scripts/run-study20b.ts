/**
 * Study 20b (docs/BRIEF-STUDY20B.md): the frozen power hint on held-out
 * songs. Anchors (letter-lands, eat-all-the-clocks) come from
 * corpus/mmkk-charts.json and must reproduce Study 20's record exactly;
 * the held-out songs come from corpus/mmkk-charts-20b.json, whose truth
 * is fetched and committed only AFTER the registration commit. Zero
 * model spend.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import type { Note } from "../src/fixture/chords.js";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import { reduceLabel } from "../src/study20/color20.js";
import { strictSame } from "../src/study20/strict20.js";
import { frozenPowerHint, hintEvidence, variantPowerHint } from "../src/study20b/powerHint.js";
import type { Meter4 } from "../src/study4/synth4.js";
import { parseChord } from "../src/grading/symbols.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL_JSON = `${root}src/fixture/model.json`;
const WEIGHTS_JSON = `${root}src/fixture/weights.json`;
const CHILD = `${root}scripts/transcribe-child.mjs`;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const HELD_OUT = `${root}corpus/mmkk-charts-20b.json`;

interface ChartSong {
	slug: string;
	bpm: number;
	meter: string;
	sections: { name: string; bars: string[][] }[];
}

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

function nchordRaw(dir: string, tag: string, rawPath: string, barStarts: number[]): string[] {
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
	return (JSON.parse(readFileSync(outFile, "utf8")) as { perBarRaw: string[] }).perBarRaw;
}

interface ArmRecord {
	fires: number;
	right: number;
	rootRight: number;
	rootRightAndRight: number;
	bars: { bar: number; symbol: string; strictRight: boolean; rootRight: boolean }[];
}

function newArm(): ArmRecord {
	return { fires: 0, right: 0, rootRight: 0, rootRightAndRight: 0, bars: [] };
}

function record(arm: ArmRecord, bar: number, symbol: string, truth: string[]) {
	const strictRight = truth.some((t) => t !== "" && strictSame(t, symbol));
	const pc = parseChord(symbol).pc;
	const rootRight = truth.some((t) => t !== "" && parseChord(t).pc === pc);
	arm.fires++;
	if (strictRight) arm.right++;
	if (rootRight) {
		arm.rootRight++;
		if (strictRight) arm.rootRightAndRight++;
	}
	arm.bars.push({ bar, symbol, strictRight, rootRight });
}

const heldOutCharts = existsSync(HELD_OUT)
	? (JSON.parse(readFileSync(HELD_OUT, "utf8")) as { songs: ChartSong[] }).songs
	: null;
if (!heldOutCharts) {
	console.error("corpus/mmkk-charts-20b.json is missing: fetch and commit the held-out charts first (brief step 2).");
	process.exit(1);
}

const songs: { chart: ChartSong; heldOut: boolean }[] = [
	...(mmkkCharts.songs as ChartSong[]).map((chart) => ({ chart, heldOut: false })),
	...heldOutCharts.map((chart) => ({ chart, heldOut: true })),
];

const dir = mkdtempSync(join(tmpdir(), "stem-bench20b-"));
const out: Record<string, unknown> = {};
const heldOutTotals = { A: newArm(), B: newArm() };
const anchors: Record<string, { fires: number; right: number }> = {};
const unalignable: string[] = [];

for (const { chart, heldOut } of songs) {
	console.log(`\n${chart.slug}${heldOut ? " (HELD OUT)" : " (anchor)"}:`);
	const m = (manifestMmkk.songs as {
		slug: string;
		stems: { name: string; url: string }[];
	}[]).find((x) => x.slug === chart.slug)!;

	const bars: RefBar[] = [];
	const truth: string[][] = [];
	for (const s of chart.sections)
		for (const chords of s.bars) {
			bars.push({ chords, bpm: chart.bpm });
			truth.push(chords);
		}
	const mixRawPath = `${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`;
	const mix = loadRaw(mixRawPath);
	let barStarts: number[];
	try {
		const ref = renderReference(bars, chart.meter as Meter4);
		const rec = chromagram(mix);
		const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
			subsequence: true,
		});
		barStarts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	} catch (e) {
		console.log(`  UNALIGNABLE (${String(e).slice(0, 120)})`);
		unalignable.push(chart.slug);
		continue;
	}
	// Registered sanity: strictly monotone, spanning >= 60% of the mix.
	const monotone = barStarts.every((s, i) => i === 0 || s > barStarts[i - 1]!);
	const span = (barStarts[barStarts.length - 1]! - barStarts[0]!) / (mix.length / 22050);
	if (!monotone || span < 0.6) {
		console.log(`  UNALIGNABLE (monotone ${monotone}, span ${(span * 100).toFixed(0)}%)`);
		unalignable.push(chart.slug);
		continue;
	}

	const stems = m.stems.filter((s) => !/drum/i.test(s.name));
	const stemAudio = stems.map((s) =>
		loadRaw(`${root}corpus-mmkk/${chart.slug}/${s.url.split("/").pop()}.22050.f32le.raw`),
	);
	const len = Math.max(...stemAudio.map((s) => s.length));
	const sum = new Float32Array(len);
	for (const s of stemAudio) for (let i = 0; i < s.length; i++) sum[i]! += s[i]!;
	const notes = transcribe(dir, chart.slug, peakNormalize(sum));
	const perBarRaw = nchordRaw(dir, chart.slug, mixRawPath, barStarts);

	const A = newArm();
	const B = newArm();
	for (let b = 0; b < truth.length; b++) {
		const { rootPc, quality } = reduceLabel(perBarRaw[b]!);
		const ev = hintEvidence(notes, barStarts[b]!, barStarts[b + 1]!);
		const a = frozenPowerHint(rootPc, quality, ev);
		if (a.fires) record(A, b + 1, a.symbol!, truth[b]!);
		const v = variantPowerHint(rootPc, quality, notes, barStarts[b]!, barStarts[b + 1]!, ev);
		if (v.fires) record(B, b + 1, v.symbol!, truth[b]!);
	}
	for (const [name, arm] of [["A", A], ["B", B]] as const) {
		console.log(
			`  ${name}: fires ${arm.fires}, strict right ${arm.right} (${arm.fires ? ((100 * arm.right) / arm.fires).toFixed(0) : "-"}%), root right ${arm.rootRight} of which right ${arm.rootRightAndRight}`,
		);
	}
	out[chart.slug] = { heldOut, bars: truth.length, A, B };
	if (heldOut) {
		for (const [k, arm] of [["A", A], ["B", B]] as const) {
			const t = heldOutTotals[k];
			t.fires += arm.fires;
			t.right += arm.right;
			t.rootRight += arm.rootRight;
			t.rootRightAndRight += arm.rootRightAndRight;
		}
	} else {
		anchors[chart.slug] = { fires: A.fires, right: A.right };
	}
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(
	`${root}results/study20b.json`,
	`${JSON.stringify({ version: 1, unalignable, songs: out, heldOutTotals: { A: { ...heldOutTotals.A, bars: undefined }, B: { ...heldOutTotals.B, bars: undefined } } }, null, "\t")}\n`,
);

// Gates.
const g2 =
	anchors["letter-lands"]?.fires === 23 &&
	anchors["letter-lands"]?.right === 22 &&
	anchors["eat-all-the-clocks"]?.fires === 12 &&
	anchors["eat-all-the-clocks"]?.right === 7;
console.log(`\nS20B-G2 (anchors reproduce 23/22 and 12/7): ${g2 ? "PASS" : "FAIL"}`);
const A = heldOutTotals.A;
if (A.fires < 10) {
	console.log(`S20B-G1: INSUFFICIENT EVIDENCE (${A.fires} held-out fires < 10) — no ship recommendation`);
} else {
	const precision = A.right / A.fires;
	console.log(
		`S20B-G1 (held-out precision >= 0.75 over ${A.fires} fires): ${precision >= 0.75 ? "PASS" : "FAIL"} (${(100 * precision).toFixed(1)}%)`,
	);
}
const Bt = heldOutTotals.B;
console.log(
	`Arm B (disclosed): ${Bt.fires} fires, ${Bt.right} right${Bt.fires ? ` (${((100 * Bt.right) / Bt.fires).toFixed(1)}%)` : ""} — recommended over A only if precision >= A's and fires >= A's`,
);
