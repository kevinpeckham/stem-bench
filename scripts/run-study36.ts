/**
 * Study 36 (docs/BRIEF-STUDY36.md): grade the trackers' raw output
 * (results/study36-trackers.json, from scripts/trackers-study36.py) and
 * the production detector's automatic grid against bar-level truth.
 * $0 in model spend. Writes results/study36.json and prints the table.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyse as analyse200, extractFeatures as extract200 } from "../src/study11b/analysis200.js";
import { chromagram } from "../src/study12/chroma.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { mod, w1TimeZero, w4Harmonic, w7Section, weightedVote } from "../src/study31/witnesses.js";
import { applyRatioRule } from "../src/study32/corpus32.js";
import { peakNorm } from "../src/study33/stereo.js";
import {
	downbeatF,
	foldCompare,
	type MeterClass,
	meterSatisfied,
	meterStringClass,
	productionBeatsPerBar,
	summarizeTracker,
	uniformDownbeats,
} from "../src/study36/metrical.js";
import { extractFeatures as extract9 } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const UNCAPPED = 600;
const LEAD = 0.07;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench36-"));
const TOL = 0.04;

interface Row {
	slug: string;
	raw: string;
	era: "modern" | "acoustic";
	bpm: number | null;
	meter: string;
	meterClass: MeterClass;
	barSec: number | null;
	downbeats: { kind: "uniform"; barOne: number } | { kind: "jaah"; truth: string } | null;
	barCount?: number;
}
const corpus = JSON.parse(readFileSync(`${root}corpus/study36-corpus.json`, "utf8")) as { rows: Row[] };
const trackers = JSON.parse(readFileSync(`${root}results/study36-trackers.json`, "utf8")) as Record<
	string,
	Record<string, { beats: number[]; downbeats: number[]; seconds: number }>
>;
const SYSTEMS = ["beatthis-final0", "beatthis-small0", "beatthis-final0-dbn", "madmom-34", "madmom-346"] as const;

function loadRaw(path: string): Float32Array {
	const buf = readFileSync(path);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function nchordPerBar(samples: Float32Array, barStarts: number[], name: string): string[] {
	const rawFile = join(dir, `${name}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	const barsFile = `${rawFile}.bars.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", rawFile, "--out", `${barsFile}.out`, "--bars", barsFile], { maxBuffer: 64 * 1024 * 1024 });
	if (np.exitCode !== 0) throw new Error(`nchord failed (${name})`);
	return (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar;
}

/** The shipped grid, vote and placement (run-study34/35 verbatim) at the detector's own tempo and meter. */
function placeGrid(mono: Float32Array, beats: number, beatSec: number, slug: string) {
	const feat = extract9(asBuffer(mono, RATE), UNCAPPED);
	const grid = chartlessGrid(feat.onset, feat.fps, beats * beatSec, mono, RATE);
	const span = audibleSpan(mono, RATE);
	const beat = grid.period / beats;
	const w1lead = w1TimeZero(grid.anchor + LEAD, beat, beats);
	const nBeats = grid.n * beats;
	const beatStarts = Array.from({ length: nBeats }, (_, j) => grid.anchor + j * beat);
	const labels = nchordPerBar(mono, beatStarts, `${slug}-beats`);
	const w4ship = applyRatioRule(w4Harmonic(labels, beats));
	const ch = chromagram(mono);
	const j0 = Math.max(0, Math.ceil((0 - grid.anchor) / beat));
	const beatChroma: Float32Array[] = [];
	for (let j = j0; j < nBeats; j++) {
		const f0 = Math.max(0, Math.floor((grid.anchor + j * beat) / ch.hopSec));
		const f1 = Math.min(ch.frames.length, Math.floor((grid.anchor + (j + 1) * beat) / ch.hopSec));
		const acc = new Float32Array(12);
		for (let f = f0; f < f1; f++) for (let k = 0; k < 12; k++) acc[k]! += ch.frames[f]![k]!;
		let norm = 0;
		for (let k = 0; k < 12; k++) norm += acc[k]! * acc[k]!;
		norm = Math.sqrt(norm) || 1;
		for (let k = 0; k < 12; k++) acc[k]! /= norm;
		beatChroma.push(acc);
	}
	const raw7 = w7Section(beatChroma, beats);
	const w7 = raw7.cls === null ? raw7 : { cls: mod(raw7.cls + j0, beats), detail: raw7.detail };
	const ship = weightedVote(
		[
			{ cls: w1lead.cls, weight: 2 },
			{ cls: w4ship.cls, weight: 2 },
			{ cls: w7.cls, weight: 1 },
		],
		beats,
	);
	const cls = ship.undecided ? 0 : ship.decided;
	let anchor = grid.anchor + cls * beat;
	while (anchor > span.first + 0.25 * beat) anchor -= grid.period;
	if (anchor < span.first - grid.period) anchor += grid.period;
	return { period: grid.period, n: grid.n, anchor, spanFirst: span.first, spanLast: span.last };
}

interface SystemGrade {
	bpm: number | null;
	barSec: number | null;
	beatsPerBar: number | null;
	barStrict: boolean | null;
	barFolded: boolean | null;
	barFoldRatio: number | null;
	barErrPct: number | null;
	meterRight: boolean;
	downbeatF: number | null;
	barCountEst: number | null;
	barCountErr: number | null;
	seconds?: number;
}

function truthDownbeats(row: Row, durationSec: number): number[] | null {
	if (!row.downbeats) return null;
	if (row.downbeats.kind === "uniform") return uniformDownbeats(row.downbeats.barOne, row.barSec!, durationSec);
	const t = JSON.parse(readFileSync(`${root}${row.downbeats.truth}`, "utf8")) as { barsAligned: { start: number }[] };
	return t.barsAligned.map((b) => b.start);
}

function gradeSystem(row: Row, barSec: number | null, beatsPerBar: number | null, bpm: number | null, downbeats: number[], truthDb: number[] | null, span: [number, number]): SystemGrade {
	const fold = row.barSec !== null && barSec !== null ? foldCompare(barSec, row.barSec, TOL) : null;
	const barCountEst = truthDb && row.barCount !== undefined ? downbeats.filter((d) => d >= span[0] - 0.5 && d <= span[1] + 0.5).length : null;
	return {
		bpm,
		barSec,
		beatsPerBar,
		barStrict: fold?.strict ?? null,
		barFolded: fold?.folded ?? null,
		barFoldRatio: fold?.ratio ?? null,
		barErrPct: fold?.errPct ?? null,
		meterRight: meterSatisfied(beatsPerBar, row.meterClass),
		downbeatF: truthDb ? downbeatF(downbeats, truthDb, 0.07, span[0] - 0.5, span[1] + 0.5).f : null,
		barCountEst,
		barCountErr: barCountEst !== null && row.barCount !== undefined ? barCountEst - row.barCount : null,
	};
}

const results: Record<string, Record<string, SystemGrade>> = {};
const productionDetections: Record<string, unknown> = {};

for (const row of corpus.rows) {
	const mono = peakNorm(loadRaw(`${root}${row.raw}`));
	const duration = mono.length / RATE;
	const span: [number, number] = (() => {
		const s = audibleSpan(mono, RATE);
		return [s.first, s.last];
	})();
	const truthDb = truthDownbeats(row, duration);
	const rec: Record<string, SystemGrade> = {};
	results[row.slug] = rec;

	// production automatic mode: v0.200-port detector, then the shipped grid at its own tempo and meter
	const det = analyse200(extract200(asBuffer(mono, RATE)));
	const pBeats = productionBeatsPerBar(det.meter.value);
	const placed = placeGrid(mono, pBeats, 60 / det.tempo.bpm, row.slug);
	const pDownbeats = Array.from({ length: placed.n }, (_, i) => placed.anchor + i * placed.period);
	productionDetections[row.slug] = { tempo: det.tempo, meter: det.meter, key: det.key, placed };
	const production = gradeSystem(row, placed.period, pBeats, det.tempo.bpm, pDownbeats, truthDb, span);
	// the detector's own meter class (not the placed grouping), reported as well
	const pClass = meterStringClass(det.meter.value);
	production.meterRight = pClass !== null && pClass === row.meterClass;
	rec.production = production;

	for (const sys of SYSTEMS) {
		const t = trackers[row.slug]?.[sys];
		if (!t) continue;
		const s = summarizeTracker(t.beats, t.downbeats);
		rec[sys] = { ...gradeSystem(row, s.barSec, s.beatsPerBar, s.bpm, t.downbeats, truthDb, span), seconds: t.seconds };
	}
	const lib = trackers[row.slug]?.librosa;
	if (lib) {
		const s = summarizeTracker(lib.beats, []);
		const fold = row.bpm !== null && s.bpm !== null ? foldCompare(s.bpm, row.bpm, TOL) : null;
		rec.librosa = {
			bpm: s.bpm,
			barSec: null,
			beatsPerBar: null,
			barStrict: fold?.strict ?? null,
			barFolded: fold?.folded ?? null,
			barFoldRatio: fold?.ratio ?? null,
			barErrPct: fold?.errPct ?? null,
			meterRight: false,
			downbeatF: null,
			barCountEst: null,
			barCountErr: null,
			seconds: lib.seconds,
		};
	}
	const line = ["production", ...SYSTEMS]
		.map((sys) => {
			const g = rec[sys];
			if (!g) return `${sys}: -`;
			return `${sys}: bar ${g.barSec?.toFixed(3) ?? "-"}s (${g.barStrict === null ? "n/a" : g.barStrict ? "STRICT" : g.barFolded ? `fold ${g.barFoldRatio}` : "WRONG"}) x${g.beatsPerBar ?? "-"} ${g.meterRight ? "meter ok" : "meter WRONG"}${g.downbeatF !== null ? ` F ${g.downbeatF.toFixed(2)}` : ""}${g.barCountErr !== null ? ` bars ${g.barCountEst}/${row.barCount}` : ""}`;
		})
		.join(" | ");
	console.log(`[${row.slug}] truth bar ${row.barSec?.toFixed(3) ?? "-"}s ${row.meter}\n  ${line.split(" | ").join("\n  ")}`);
}

// registered tallies
const modern = corpus.rows.filter((r) => r.era === "modern" && r.barSec !== null);
const modernJw = corpus.rows.filter((r) => r.slug.startsWith("jw-"));
const acoustic = corpus.rows.filter((r) => r.era === "acoustic");
const tally = (rows: Row[], sys: string, key: keyof SystemGrade) => rows.filter((r) => results[r.slug]?.[sys]?.[key] === true).length;
const summary: Record<string, unknown> = {};
for (const sys of ["production", ...SYSTEMS, "librosa"]) {
	summary[sys] = {
		modernJw: { n: modernJw.length, barStrict: tally(modernJw, sys, "barStrict"), barFolded: tally(modernJw, sys, "barFolded"), meterRight: tally(modernJw, sys, "meterRight") },
		modernAll: { n: modern.length, barStrict: tally(modern, sys, "barStrict"), barFolded: tally(modern, sys, "barFolded"), meterRight: tally(corpus.rows.filter((r) => r.era === "modern"), sys, "meterRight") },
		acoustic: {
			n: acoustic.length,
			barStrict: tally(acoustic, sys, "barStrict"),
			barFolded: tally(acoustic, sys, "barFolded"),
			meterRight: tally(acoustic, sys, "meterRight"),
			downbeatF: Object.fromEntries(
				acoustic.filter((r) => results[r.slug]?.[sys]?.downbeatF != null).map((r) => [r.slug, results[r.slug]?.[sys]?.downbeatF ?? null]),
			),
		},
		meterAll: tally(corpus.rows, sys, "meterRight"),
	};
	const s = summary[sys] as { modernJw: { barStrict: number; barFolded: number; meterRight: number }; acoustic: { barStrict: number; barFolded: number } };
	console.log(`\n${sys}: JW ten strict ${s.modernJw.barStrict}/10 folded ${s.modernJw.barFolded}/10 meter ${s.modernJw.meterRight}/10 | acoustic strict ${s.acoustic.barStrict}/${acoustic.length} folded ${s.acoustic.barFolded}/${acoustic.length} | meter all ${(summary[sys] as { meterAll: number }).meterAll}/${corpus.rows.length}`);
}
// S36-D1: a tracker earns the Study 38 automatic re-draft
for (const sys of SYSTEMS) {
	const s = summary[sys] as { modernJw: { barStrict: number; barFolded: number; meterRight: number } };
	const d1 = s.modernJw.barStrict >= 7 && s.modernJw.meterRight >= 8 && s.modernJw.barFolded === 10;
	console.log(`S36-D1 ${sys}: ${d1 ? "EARNS the Study 38 re-draft" : "does not qualify"}`);
}

writeFileSync(`${root}results/study36.json`, `${JSON.stringify({ results, productionDetections, summary }, null, "\t")}\n`);
console.log("results/study36.json written");
