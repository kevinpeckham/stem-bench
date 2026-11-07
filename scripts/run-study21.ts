/**
 * Study 21 (docs/BRIEF-STUDY21.md): the shipped chord reader graded on
 * all four charted songs — the two anchors (fourth reproduction) and the
 * two held-out charts banked by Study 20b. No transcription, no model
 * spend: nchord on each mix over the Study 12 bar grid, graded three
 * ways (extended allowance, Study-13 verbatim, barmark strict).
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import charts20b from "../corpus/mmkk-charts-20b.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import { gradeBars } from "../src/study13/grading13.js";
import { gradeStrict } from "../src/study20/strict20.js";
import { gradeBars21 } from "../src/study21/grading21.js";
import type { Meter4 } from "../src/study4/synth4.js";

const root = new URL("../", import.meta.url).pathname;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;

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

const songs: { chart: ChartSong; heldOut: boolean }[] = [
	...(mmkkCharts.songs as ChartSong[]).map((chart) => ({ chart, heldOut: false })),
	...(charts20b.songs as ChartSong[]).map((chart) => ({ chart, heldOut: true })),
];

const dir = mkdtempSync(join(tmpdir(), "stem-bench21-"));
const out: Record<string, unknown> = {};
let g1 = true;
let g2 = true;

for (const { chart, heldOut } of songs) {
	console.log(`\n${chart.slug}${heldOut ? " (HELD OUT)" : " (anchor)"}:`);
	const bars: RefBar[] = [];
	const truth: string[][] = [];
	for (const s of chart.sections)
		for (const chords of s.bars) {
			// The 20b render-only rule: parentheticals stripped for the pads only.
			bars.push({ chords: chords.map((c) => c.replace(/\(.*\)$/, "")), bpm: chart.bpm });
			truth.push(chords);
		}
	const mixRawPath = `${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`;
	const mix = loadRaw(mixRawPath);
	const ref = renderReference(bars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const barStarts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	const monotone = barStarts.every((s, i) => i === 0 || s > barStarts[i - 1]!);
	const span = (barStarts[barStarts.length - 1]! - barStarts[0]!) / (mix.length / 22050);
	if (!monotone || span < 0.6) {
		console.log(`  UNALIGNABLE (monotone ${monotone}, span ${(span * 100).toFixed(0)}%)`);
		out[chart.slug] = { heldOut, unalignable: true };
		if (heldOut) g2 = false;
		else g1 = false;
		continue;
	}

	const barsFile = join(dir, `${chart.slug}-bars.json`);
	const outFile = join(dir, `${chart.slug}-nchord.json`);
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const proc = Bun.spawnSync([PY, NCHORD, "--raw", mixRawPath, "--out", outFile, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (proc.exitCode !== 0) {
		console.error(proc.stderr.toString());
		throw new Error(`nchord failed for ${chart.slug}`);
	}
	const perBar = (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar.map(
		(c) => (c === "" ? "N.C." : c),
	);

	const extended = gradeBars21(perBar, truth);
	const verbatim = gradeBars(perBar, truth);
	const strict = gradeStrict(perBar, truth);
	const chordBearing = truth.filter((t) => t.some((c) => c !== "")).length;
	console.log(
		`  extended allowance ${extended.right}/${extended.bars} (${((100 * extended.right) / chordBearing).toFixed(1)}% of ${chordBearing} chord-bearing) | Study-13 verbatim ${verbatim.right} | strict-any ${strict.right} (first ${strict.strictFirstRight}) | strict-first(13) ${extended.strictFirstRight} | power credit ${extended.powerAllowance}`,
	);
	out[chart.slug] = {
		heldOut,
		barStarts: barStarts.map((s) => Math.round(s * 100) / 100),
		perBar,
		extended,
		verbatim,
		strict,
		chordBearing,
	};
	if (!heldOut) {
		const expected = chart.slug === "letter-lands" ? 59 : 53;
		if (extended.right !== expected || verbatim.right !== expected) g1 = false;
	} else {
		const line = chart.slug === "peaceful-dreams" ? 77 : 70;
		if (extended.right < line) g2 = false;
	}
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(`${root}results/study21.json`, `${JSON.stringify({ version: 1, songs: out }, null, "\t")}\n`);

console.log(`\nS21-G1 (anchors reproduce 59/76 and 53/86 exactly): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S21-G2 (each held-out song >= 50% of chord-bearing bars, extended allowance): ${g2 ? "PASS" : "FAIL"}`);
