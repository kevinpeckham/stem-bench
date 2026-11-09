/**
 * Study 34b Parts A and C (docs/BRIEF-STUDY34B.md): $0, no model.
 * Part A: the v0.200.0 production detector port (full Detection with
 * confidences and the tempo ladder's rungs) over fifteen recordings,
 * judged against the registered truth table, with the exploratory
 * separation read. Part C: pickup distances under the declared grid.
 * Results committed raw to results/study34a.json.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromagram } from "../src/study12/chroma.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { classOf, mod, w1TimeZero, w4Harmonic, w7Section, weightedVote } from "../src/study31/witnesses.js";
import { applyRatioRule } from "../src/study32/corpus32.js";
import { peakNorm } from "../src/study33/stereo.js";
import { analyse as analyse200, extractFeatures as extract200 } from "../src/study11b/analysis200.js";
import { extractFeatures as extract9 } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const UNCAPPED = 600;
const LEAD = 0.07;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench34a-"));

function loadRaw(path: string): Float32Array {
	const buf = readFileSync(path);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function nchordPerBar(samples: Float32Array, barStarts: number[], name: string): string[] {
	const rawFile = join(dir, `${name}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	const barsFile = `${rawFile}.bars.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", rawFile, "--out", `${barsFile}.out`, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np.exitCode !== 0) throw new Error(`nchord failed (${name})`);
	return (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar;
}

/** The shipped grid, vote and placement on the mono mix (run-study34 verbatim). */
function placeGrid(mono: Float32Array, beats: number, beatSec: number, slug: string) {
	const feat = extract9(asBuffer(mono, RATE), UNCAPPED);
	const declared = beats * beatSec;
	const grid = chartlessGrid(feat.onset, feat.fps, declared, mono, RATE);
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
	return { grid, beat, anchor, span, truthCls: classOf(0, grid.anchor, beat, beats) };
}

// ---- Part A: the registered truth table (docs/BRIEF-STUDY34B.md) ----

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function keyParse(s: string | null): { pc: number; minor: boolean } | null {
	if (!s) return null;
	const t = s.replace(/♯/g, "#").replace(/♭/g, "b").trim();
	const m = t.match(/^([A-G])([#b]?)\s*(major|minor|maj|min|m)?$/i);
	if (!m) return null;
	let pc = PC[m[1]!.toUpperCase()]!;
	if (m[2] === "#") pc = (pc + 1) % 12;
	if (m[2] === "b") pc = (pc + 11) % 12;
	const q = (m[3] ?? "major").toLowerCase();
	return { pc, minor: q === "minor" || q === "min" || q === "m" };
}
function keySame(a: string | null, b: string | null): boolean | null {
	const pa = keyParse(a);
	const pb = keyParse(b);
	if (!pa || !pb) return null;
	return pa.pc === pb.pc && pa.minor === pb.minor;
}

interface ARow {
	slug: string;
	raw: string;
	tempo: number | null;
	meter: string | null;
	key: string | null;
}
const ROWS: ARow[] = [
	{ slug: "eat-all-the-clocks", raw: "corpus-mmkk/eat-all-the-clocks/mix.mp3.22050.f32le.raw", tempo: 120, meter: "4/4", key: "E minor" },
	{ slug: "interbellum", raw: "corpus-mmkk/interbellum/mix.mp3.22050.f32le.raw", tempo: 115, meter: "4/4", key: "C major" },
	{ slug: "letter-lands", raw: "corpus-mmkk/letter-lands/mix.mp3.22050.f32le.raw", tempo: 132, meter: "4/4", key: "F# major" },
	{ slug: "mop-heart", raw: "corpus-mmkk/mop-heart/mix.mp3.22050.f32le.raw", tempo: 224, meter: "3/4", key: "A major" },
	{ slug: "peaceful-dreams", raw: "corpus-mmkk/peaceful-dreams/mix.mp3.22050.f32le.raw", tempo: 145, meter: "4/4", key: "D major" },
	{ slug: "dippermouth-blues", raw: "corpus-study34/dippermouth-blues.mp3.22050.f32le.raw", tempo: 185.5, meter: "4/4", key: "C major" },
	{ slug: "st-louis-blues", raw: "corpus-study34/st-louis-blues.mp3.22050.f32le.raw", tempo: 67.0, meter: "4/4", key: "D major" },
	{ slug: "livery-stable-blues", raw: "corpus-study34/livery-stable-blues.mp3.22050.f32le.raw", tempo: 163.8, meter: "4/4", key: "Eb major" },
	{ slug: "roll-called-up-yonder", raw: "corpus-study34/roll-called-up-yonder.mp3.22050.f32le.raw", tempo: 97.1, meter: "4/4", key: "Ab major" },
	{ slug: "three-oclock-waltz", raw: "corpus-study34/three-oclock-waltz.mp3.22050.f32le.raw", tempo: 141.6, meter: "3/4", key: "C major" },
	{ slug: "jw-let-it-in", raw: "corpus-study34/jw-let-it-in.mp3.22050.f32le.raw", tempo: 121, meter: "4/4", key: "D minor" },
	{ slug: "jw-same-boat", raw: "corpus-study34/jw-same-boat.mp3.22050.f32le.raw", tempo: 93, meter: "4/4", key: "F# major" },
	{ slug: "kitten-on-the-keys", raw: "corpus-study34/kitten-on-the-keys.flac.22050.f32le.raw", tempo: null, meter: "4/4", key: "F major" },
	{ slug: "sp-today-live", raw: "corpus-study34/sp-today-live.mp3.22050.f32le.raw", tempo: null, meter: "4/4", key: "Eb major" },
	{ slug: "irish-jigs-medley", raw: "corpus-study34/irish-jigs-medley.mp3.22050.f32le.raw", tempo: null, meter: "6/8", key: null },
];

const study34 = JSON.parse(readFileSync(`${root}results/study34.json`, "utf8")) as {
	results: Record<string, { declared?: { bpm: number; meter: string; key: string } }>;
};

const partA: Record<string, unknown> = {};
const monos = new Map<string, Float32Array>();

for (const row of ROWS) {
	const mono = peakNorm(loadRaw(`${root}${row.raw}`));
	monos.set(row.slug, mono);
	const det = analyse200(extract200(asBuffer(mono, RATE)));
	const tempoRight = row.tempo === null ? null : Math.abs(det.tempo.bpm - row.tempo) / row.tempo <= 0.04;
	let rung: { factor: number; bpm: number; strength: number } | null = null;
	if (row.tempo !== null && tempoRight === false) {
		rung = det.tempo.alternates.find((r) => Math.abs(r.bpm - row.tempo!) / row.tempo! <= 0.04) ?? null;
	}
	const meterRight = row.meter === null ? null : det.meter.value === row.meter;
	const keyRight = keySame(det.key.value, row.key);
	const s34 = study34.results[row.slug]?.declared ?? null;
	partA[row.slug] = {
		truth: { tempo: row.tempo, meter: row.meter, key: row.key },
		detection: det,
		tempoRight,
		trueTempoOnRung: rung,
		meterRight,
		keyRight,
		study34Declared: s34,
	};
	console.log(
		`[A] ${row.slug}: tempo ${det.tempo.bpm.toFixed(1)} (conf ${det.tempo.confidence.toFixed(3)}, sub ${det.tempo.subdivision}) ${tempoRight === null ? "-" : tempoRight ? "RIGHT" : rung ? `wrong, truth on rung x${rung.factor} (strength ${rung.strength.toFixed(3)})` : "wrong, truth on NO rung"} | meter ${det.meter.value} (${det.meter.confidence.toFixed(3)}) ${meterRight === null ? "-" : meterRight ? "right" : "WRONG"} | key ${det.key.value} (${det.key.confidence.toFixed(3)}) ${keyRight === null ? "-" : keyRight ? "right" : "WRONG"}`,
	);
}

// ---- Part A exploratory separation (registered as exploratory) ----
function separate(points: { slug: string; value: number; wrong: boolean }[]) {
	if (points.length === 0) return null;
	const sorted = [...points].sort((a, b) => a.value - b.value);
	let best: { threshold: number; errors: number; direction: string } | null = null;
	for (let i = 0; i <= sorted.length; i++) {
		const lo = i === 0 ? sorted[0]!.value - 1 : sorted[i - 1]!.value;
		const hi = i === sorted.length ? sorted[sorted.length - 1]!.value + 1 : sorted[i]!.value;
		const t = (lo + hi) / 2;
		// direction 1: wrong below threshold
		const e1 = points.filter((p) => (p.value < t ? !p.wrong : p.wrong)).length;
		// direction 2: wrong above threshold
		const e2 = points.filter((p) => (p.value >= t ? !p.wrong : p.wrong)).length;
		for (const [e, d] of [
			[e1, "wrong-below"],
			[e2, "wrong-above"],
		] as const) {
			if (!best || e < best.errors) best = { threshold: t, errors: e, direction: d };
		}
	}
	const near = points.filter((p) => Math.abs(p.value - best!.threshold) <= 0.1 * Math.abs(best!.threshold)).map((p) => p.slug);
	return { ...best!, n: points.length, wrongCount: points.filter((p) => p.wrong).length, within10pct: near };
}

type ARec = {
	detection: ReturnType<typeof analyse200>;
	tempoRight: boolean | null;
	meterRight: boolean | null;
	keyRight: boolean | null;
};
const recs = ROWS.map((r) => ({ slug: r.slug, a: partA[r.slug] as ARec }));
const separation = {
	note: "A threshold read off fifteen recordings is a hypothesis for the next corpus, not a finding.",
	tempoConfidence: separate(
		recs.filter((r) => r.a.tempoRight !== null).map((r) => ({ slug: r.slug, value: r.a.detection.tempo.confidence, wrong: !r.a.tempoRight })),
	),
	strongestAlternate: separate(
		recs
			.filter((r) => r.a.tempoRight !== null)
			.map((r) => ({
				slug: r.slug,
				value: Math.max(0, ...r.a.detection.tempo.alternates.map((x) => x.strength)),
				wrong: !r.a.tempoRight,
			})),
	),
	meterConfidence: separate(
		recs.filter((r) => r.a.meterRight !== null).map((r) => ({ slug: r.slug, value: r.a.detection.meter.confidence, wrong: !r.a.meterRight })),
	),
	keyConfidence: separate(
		recs.filter((r) => r.a.keyRight !== null).map((r) => ({ slug: r.slug, value: r.a.detection.key.confidence, wrong: !r.a.keyRight })),
	),
};
console.log("\n[A] separation (exploratory):", JSON.stringify(separation, null, 1));

// ---- Part C: pickups under the declared grid ----

interface CRow {
	slug: string;
	bpm: number;
	meter: string;
	truthBarOne: number | null;
	note?: string;
}
const JAAH = (slug: string): number =>
	(JSON.parse(readFileSync(`${root}corpus/study34-truth/${slug}.truth.json`, "utf8")) as { barsAligned: { start: number }[] })
		.barsAligned[0]!.start;
const CROWS: CRow[] = [
	{ slug: "eat-all-the-clocks", bpm: 120, meter: "4/4", truthBarOne: -0.085 },
	{ slug: "interbellum", bpm: 115, meter: "4/4", truthBarOne: 0 },
	{ slug: "letter-lands", bpm: 132, meter: "4/4", truthBarOne: 0, note: "Study 31d family truth; ~0.07s early ruler bias disclosed" },
	{ slug: "mop-heart", bpm: 224, meter: "3/4", truthBarOne: 0, note: "Study 31d family truth; ~0.07s early ruler bias disclosed" },
	{ slug: "peaceful-dreams", bpm: 145, meter: "4/4", truthBarOne: 0, note: "Study 31d family truth; ~0.07s early ruler bias disclosed" },
	{ slug: "dippermouth-blues", bpm: 186, meter: "4/4", truthBarOne: JAAH("dippermouth-blues") },
	{ slug: "st-louis-blues", bpm: 67, meter: "4/4", truthBarOne: JAAH("st-louis-blues") },
	{ slug: "livery-stable-blues", bpm: 164, meter: "4/4", truthBarOne: JAAH("livery-stable-blues") },
	{ slug: "roll-called-up-yonder", bpm: 97, meter: "4/4", truthBarOne: null, note: "no time truth; the engraving opens on a downbeat (no pickup)" },
	{ slug: "three-oclock-waltz", bpm: 142, meter: "3/4", truthBarOne: null, note: "no time truth; the engraving opens on a downbeat (no pickup)" },
];

const partC: Record<string, unknown> = {};
for (const row of CROWS) {
	const mono = monos.get(row.slug) ?? peakNorm(loadRaw(`${root}${ROWS.find((r) => r.slug === row.slug)!.raw}`));
	const beats = row.meter === "3/4" ? 3 : 4;
	const placed = placeGrid(mono, beats, 60 / row.bpm, `c-${row.slug}`);
	const pickupBeats = (placed.anchor - placed.span.first) / placed.beat;
	const truthPickupBeats = row.truthBarOne === null ? null : (row.truthBarOne - placed.span.first) / placed.beat;
	const halfBarBound = beats / 2;
	partC[row.slug] = {
		declared: { bpm: row.bpm, meter: row.meter },
		gridPeriod: placed.grid.period,
		gridN: placed.grid.n,
		anchor: placed.anchor,
		firstSound: placed.span.first,
		pickupBeats,
		classedPickupAtHalfBar: pickupBeats > 0 && pickupBeats <= halfBarBound,
		truthBarOne: row.truthBarOne,
		truthPickupBeats,
		note: row.note ?? null,
	};
	console.log(
		`[C] ${row.slug}: grid ${placed.grid.period.toFixed(3)}s x ${placed.grid.n} | anchor ${placed.anchor.toFixed(3)} firstSound ${placed.span.first.toFixed(3)} -> ${pickupBeats.toFixed(2)} beats ${pickupBeats > 0 ? "of sound before the downbeat" : "(downbeat at/before first sound)"} | truth ${truthPickupBeats === null ? row.note : `${truthPickupBeats.toFixed(2)} beats`}`,
	);
}

writeFileSync(`${root}results/study34a.json`, `${JSON.stringify({ partA, separation, partC }, null, "\t")}\n`);
console.log("results/study34a.json written");
