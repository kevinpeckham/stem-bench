/**
 * Study 19 (docs/BRIEF-STUDY19.md): the app's TypeScript ChordMini
 * pipeline (stem-shovel 2256d489, run AS COMMITTED from a pinned
 * worktree) against the Python reference (scripts/study10/nchord.py),
 * frame by frame on all four public mixes and bar by bar on the two
 * songs with chord truth. Zero model-API spend.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { renderReference, type RefBar } from "../src/study12/reference.js";
import { gradeBars } from "../src/study13/grading13.js";
import type { Meter4 } from "../src/study4/synth4.js";

const root = new URL("../", import.meta.url).pathname;
const WT = `${root}.worktrees/stem-shovel-2256d489`;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const FRAME_SEC = 2048 / 22050;
const SEQ = 108;

// The app's code, imported from the pinned worktree (computed paths so
// the bench's tsc does not typecheck the foreign tree; bun resolves them).
const cqtMod = await import(`${WT}/src/lib/utils/chordminiCqt.ts`);
const smoothMod = await import(`${WT}/src/lib/utils/chordminiSmooth.ts`);
const runsMod = await import(`${WT}/src/lib/utils/chordminiRunsOf.ts`);
const barsMod = await import(`${WT}/src/lib/utils/chordminiBarChords.ts`);
const inferMod = await import(`${WT}/src/lib/server/chordmini/infer.ts`);
const plan = JSON.parse(readFileSync(`${WT}/src/lib/server/chordmini/cqt-plan.json`, "utf8"));
const config = JSON.parse(readFileSync(`${WT}/src/lib/server/chordmini/config.json`, "utf8")) as {
	chordVocab: string[];
};
const symbols = JSON.parse(
	readFileSync(`${WT}/src/lib/server/chordmini/chart-symbols.json`, "utf8"),
) as Record<string, string>;

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

/** The reference pipeline on a raw file; per-frame raw labels rebuilt from its run-length segments. */
function reference(
	dir: string,
	tag: string,
	rawPath: string,
	barStarts: number[] | null,
): { labels: string[]; perBar: string[] | null } {
	const outFile = join(dir, `${tag}-ref.json`);
	const args = [PY, NCHORD, "--raw", rawPath, "--out", outFile];
	if (barStarts) {
		const barsFile = join(dir, `${tag}-bars.json`);
		writeFileSync(barsFile, JSON.stringify({ barStarts }));
		args.push("--bars", barsFile);
	}
	const t0 = Date.now();
	const proc = Bun.spawnSync(args, { maxBuffer: 64 * 1024 * 1024 });
	if (proc.exitCode !== 0) {
		console.error(proc.stderr.toString());
		throw new Error(`nchord failed for ${tag}`);
	}
	console.log(`  reference ${tag}: ${((Date.now() - t0) / 1000).toFixed(0)}s`);
	const parsed = JSON.parse(readFileSync(outFile, "utf8")) as {
		frameSec: number;
		segments: { start: number; end: number; chord: string }[];
		perBar?: string[];
	};
	const last = parsed.segments[parsed.segments.length - 1]!;
	const frames = Math.round(last.end / parsed.frameSec);
	const labels = new Array<string>(frames);
	for (const s of parsed.segments) {
		const lo = Math.round(s.start / parsed.frameSec);
		const hi = Math.round(s.end / parsed.frameSec);
		for (let f = lo; f < hi; f++) labels[f] = s.chord;
	}
	return { labels, perBar: parsed.perBar?.map((c) => (c === "" ? "N.C." : c)) ?? null };
}

/** The app pipeline on the same samples: CQT -> ONNX child -> smoothing; per-frame raw labels. */
async function appLabels(dir: string, samples: Float32Array): Promise<string[]> {
	const t0 = Date.now();
	const { frames, features } = cqtMod.chordminiFeatures(samples, plan);
	const logits = await inferMod.chordminiLogits(features, frames, dir);
	const indices = smoothMod.chordminiIndices(logits, frames) as Int32Array;
	console.log(`  app pipeline: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
	return Array.from(indices, (i) => config.chordVocab[i]!);
}

/** The app's stored-run shape for a label sequence, chart symbols applied as chords.ts does. */
function storedRuns(labels: string[]) {
	const indices = new Int32Array(labels.length);
	// chordminiRunsOf takes indices + vocab; rebuild indices from labels (bijective map).
	const at = new Map(config.chordVocab.map((l, i) => [l, i]));
	for (let i = 0; i < labels.length; i++) indices[i] = at.get(labels[i]!)!;
	const runs = (
		runsMod.chordminiRunsOf(indices, config.chordVocab) as {
			start: number;
			end: number;
			label: string;
		}[]
	).map((r) => ({ start: r.start, end: r.end, chord: symbols[r.label] || "N.C." }));
	return { frameSec: FRAME_SEC, frames: labels.length, runs };
}

/** The app's per-bar vote, flattened to one chord per bar. */
function appPerBar(labels: string[], barStarts: number[], bars: number): string[] {
	const perBar = new Array<string>(bars).fill("N.C.");
	const segs = barsMod.chordminiBarChords(storedRuns(labels), barStarts) as {
		bar: number;
		bars: number;
		chord: string;
	}[];
	for (const s of segs)
		for (let k = 0; k < s.bars && s.bar - 1 + k < bars; k++) perBar[s.bar - 1 + k] = s.chord;
	return perBar;
}

/** Disagreement anatomy: window-edge frames and reference-boundary frames. */
function anatomy(app: string[], ref: string[]) {
	const overlap = Math.min(app.length, ref.length);
	let disagree = 0;
	let atEdge = 0;
	let atBoundary = 0;
	for (let i = 0; i < overlap; i++) {
		if (app[i] === ref[i]) continue;
		disagree++;
		const inWindow = i % SEQ;
		if (inWindow <= 3 || inWindow >= SEQ - 4) atEdge++;
		if ((i > 0 && ref[i] !== ref[i - 1]) || (i + 1 < overlap && ref[i] !== ref[i + 1]))
			atBoundary++;
	}
	return { overlap, disagree, agreement: (overlap - disagree) / overlap, atEdge, atBoundary };
}

const SONGS = ["letter-lands", "eat-all-the-clocks", "peaceful-dreams", "mop-heart"];
const dir = mkdtempSync(join(tmpdir(), "stem-bench19-"));
const out: Record<string, unknown> = {};
let g1Pass = true;
let g2Pass = true;

for (const slug of SONGS) {
	const chart = (mmkkCharts.songs as {
		slug: string;
		gated: boolean;
		bpm: number;
		meter: string;
		sections: { name: string; bars: string[][] }[];
	}[]).find((s) => s.slug === slug);
	console.log(`\n${slug}${chart ? (chart.gated ? " (GATED)" : " (exploratory)") : " (parity only)"}:`);
	const rawPath = `${root}corpus-mmkk/${slug}/mix.mp3.22050.f32le.raw`;
	const samples = loadRaw(rawPath);

	// The shared bar grid for graded songs: Study 12's alignment, as Studies 13/17/18.
	let barStarts: number[] | null = null;
	let truth: string[][] | null = null;
	if (chart) {
		const bars: RefBar[] = [];
		truth = [];
		for (const s of chart.sections)
			for (const chords of s.bars) {
				bars.push({ chords, bpm: chart.bpm });
				truth.push(chords);
			}
		const ref = renderReference(bars, chart.meter as Meter4);
		const rec = chromagram(samples);
		const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
			subsequence: true,
		});
		barStarts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	}

	const ref = reference(dir, slug, rawPath, barStarts);
	const app = await appLabels(dir, samples);
	const a = anatomy(app, ref.labels);
	const framesEqual = app.length === ref.labels.length;
	console.log(
		`  frames app ${app.length} / ref ${ref.labels.length}${framesEqual ? "" : " — MISMATCH"} | agreement ${(100 * a.agreement).toFixed(3)}% (${a.disagree} of ${a.overlap} differ; ${a.atBoundary} at ref boundaries, ${a.atEdge} at window edges)`,
	);
	if (a.agreement < 0.995) g1Pass = false;

	const song: Record<string, unknown> = {
		framesApp: app.length,
		framesRef: ref.labels.length,
		...a,
	};
	if (chart && barStarts && truth && ref.perBar) {
		const appBar = appPerBar(app, barStarts, truth.length);
		const refBarViaApp = appPerBar(ref.labels, barStarts, truth.length);
		const voteCheck = JSON.stringify(refBarViaApp) === JSON.stringify(ref.perBar);
		const grade = gradeBars(appBar, truth);
		const target = chart.gated ? 59 : 53;
		const pass = grade.right >= target - 1;
		if (!pass) g2Pass = false;
		console.log(
			`  per-bar (app vote): ${grade.right}/${grade.bars} vs Study 17's ${target} — ${pass ? "within one bar" : "PORT DEFECT"} | strict-first ${grade.strictFirstRight} | vote cross-check (app vote on ref frames == nchord perBar): ${voteCheck ? "EQUAL" : "DIFFERS"}`,
		);
		song.barStarts = barStarts.map((s) => Math.round(s * 100) / 100);
		song.appPerBar = appBar;
		song.refPerBar = ref.perBar;
		song.voteCheckEqual = voteCheck;
		song.grade = grade;
		song.study17Target = target;
	}
	out[slug] = song;
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(
	`${root}results/study19.json`,
	`${JSON.stringify({ version: 1, appCommit: "2256d489", songs: out }, null, "\t")}\n`,
);

console.log(`\nS19-G1 (frame parity >= 99.5% on all four mixes): ${g1Pass ? "PASS" : "FAIL"}`);
console.log(`S19-G2 (per-bar within one of Study 17 on both graded songs): ${g2Pass ? "PASS" : "FAIL"}`);
