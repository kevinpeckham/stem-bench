/**
 * Study 36b (docs/BRIEF-STUDY36B.md): grade the trackers and the
 * production detector over the Josh Woodward catalog against the
 * artist's declared tempo and meter. $0 model spend. Reads
 * results/study36b-trackers.json (scripts/trackers-study36b.py), runs
 * the production detector itself (fast), writes results/study36b.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { analyse as analyse200, extractFeatures as extract200 } from "../src/study11b/analysis200.js";
import { peakNorm } from "../src/study33/stereo.js";
import { foldCompare, type MeterClass, meterSatisfied, meterStringClass, productionBeatsPerBar, summarizeTracker } from "../src/study36/metrical.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const TOL = 0.04;

interface Entry {
	bpm: number | null;
	meter: string | null;
	feel: string | null;
	regular?: { file: string };
	instrumental?: { file: string };
}
const manifest = JSON.parse(readFileSync(`${root}corpus/study36b-manifest.json`, "utf8")) as { entries: Record<string, Entry> };
const trackers = JSON.parse(readFileSync(`${root}results/study36b-trackers.json`, "utf8")) as Record<string, Record<string, { beats: number[]; downbeats: number[]; seconds: number }>>;
const existing = (() => {
	try {
		return JSON.parse(readFileSync(`${root}results/study36b.json`, "utf8")) as { production?: Record<string, ProductionCell> };
	} catch {
		return {};
	}
})();

/** Declared bar in seconds: 6/8 is two dotted quarters at the declared tempo; 3/4 three quarters; 4/4 four. */
function declaredBarSec(bpm: number, meter: string): number {
	const beats = meter === "6/8" ? 2 : meter === "3/4" ? 3 : 4;
	return (beats * 60) / bpm;
}
function declaredClass(meter: string): MeterClass {
	return meter === "6/8" ? "compound" : meter === "3/4" ? 3 : 4;
}

interface Cell {
	bpm: number | null;
	barSec: number | null;
	beatsPerBar: number | null;
	strict: boolean;
	folded: boolean;
	fold: number | null;
	errPct: number | null;
	meterRight: boolean;
}
interface ProductionCell extends Cell {
	meter: string;
	confidence: number;
	subdivision: number | null;
}

function gradeBar(barSec: number | null, beatsPerBar: number | null, bpm: number | null, truthBar: number, cls: MeterClass): Cell {
	const f = barSec !== null ? foldCompare(barSec, truthBar, TOL) : null;
	return { bpm, barSec, beatsPerBar, strict: f?.strict ?? false, folded: f?.folded ?? false, fold: f?.ratio ?? null, errPct: f?.errPct ?? null, meterRight: meterSatisfied(beatsPerBar, cls) };
}

function loadRaw(path: string): Float32Array {
	const buf = readFileSync(path);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

const production: Record<string, ProductionCell> = existing.production ?? {};
const graded: Record<string, Record<string, Cell>> = {};
let n = 0;
for (const [slug, e] of Object.entries(manifest.entries)) {
	if (!e.bpm || !e.meter) continue;
	const truthBar = declaredBarSec(e.bpm, e.meter);
	const cls = declaredClass(e.meter);
	for (const kind of ["regular", "instrumental"] as const) {
		const file = e[kind]?.file;
		if (!file) continue;
		const key = `${slug}|${kind}`;
		graded[key] = {};
		if (!production[key]) {
			const mono = peakNorm(loadRaw(`${root}corpus-study36/${kind}/${file}.22050.f32le.raw`));
			const det = analyse200(extract200(asBuffer(mono, RATE)));
			const beats = productionBeatsPerBar(det.meter.value);
			const barSec = (beats * 60) / det.tempo.bpm;
			const cell = gradeBar(barSec, beats, det.tempo.bpm, truthBar, cls);
			const pClass = meterStringClass(det.meter.value);
			production[key] = { ...cell, meterRight: pClass !== null && pClass === cls, meter: det.meter.value, confidence: det.tempo.confidence, subdivision: (det.tempo as { subdivision?: number }).subdivision ?? null };
			if (++n % 25 === 0) {
				writeFileSync(`${root}results/study36b.json`, JSON.stringify({ production }, null, "\t"));
				console.log(`production ${n} done`);
			}
		}
		graded[key].production = production[key]!;
		for (const [sys, t] of Object.entries(trackers[key] ?? {})) {
			const s = summarizeTracker(t.beats, t.downbeats);
			graded[key][sys] = gradeBar(s.barSec, s.beatsPerBar, s.bpm, truthBar, cls);
		}
	}
}

// tallies
type Filter = (slug: string, e: Entry) => boolean;
const filters: Record<string, Filter> = {
	all: () => true,
	"4/4": (_s, e) => e.meter === "4/4",
	"4/4 straight": (_s, e) => e.meter === "4/4" && e.feel === "Straight",
	"4/4 swing": (_s, e) => e.meter === "4/4" && e.feel === "Swing",
	"6/8": (_s, e) => e.meter === "6/8",
	"6/8 straight": (_s, e) => e.meter === "6/8" && e.feel === "Straight",
	"6/8 swing": (_s, e) => e.meter === "6/8" && e.feel === "Swing",
	"3/4": (_s, e) => e.meter === "3/4",
};
const SYSTEMS = ["production", "beatthis-final0", "beatthis-small0", "madmom-34"];
const summary: Record<string, Record<string, Record<string, { n: number; strict: number; folded: number; meterRight: number; wrongUnfolded: number }>>> = {};
for (const kind of ["regular", "instrumental"] as const) {
	const perKind: Record<string, Record<string, { n: number; strict: number; folded: number; meterRight: number; wrongUnfolded: number }>> = {};
	summary[kind] = perKind;
	for (const sys of SYSTEMS) {
		const perSys: Record<string, { n: number; strict: number; folded: number; meterRight: number; wrongUnfolded: number }> = {};
		perKind[sys] = perSys;
		for (const [fname, f] of Object.entries(filters)) {
			let cnt = 0, strict = 0, folded = 0, meterRight = 0, wrong = 0;
			for (const [slug, e] of Object.entries(manifest.entries)) {
				const c = graded[`${slug}|${kind}`]?.[sys];
				if (!c || !e.bpm || !e.meter || !f(slug, e)) continue;
				cnt++;
				if (c.strict) strict++;
				if (c.folded) folded++;
				if (c.meterRight) meterRight++;
				if (!c.folded) wrong++;
			}
			perSys[fname] = { n: cnt, strict, folded, meterRight, wrongUnfolded: wrong };
		}
	}
}

// paired arm: regular failures that the instrumental fixes, per system
const paired: Record<string, { regularStrictFail: number; instrumentalStrict: number; regularStrict: number; instrumentalStrictFail: number; both: number }> = {};
for (const sys of SYSTEMS) {
	let rf = 0, fixed = 0, rs = 0, broke = 0, both = 0;
	for (const slug of Object.keys(manifest.entries)) {
		const r = graded[`${slug}|regular`]?.[sys];
		const i = graded[`${slug}|instrumental`]?.[sys];
		if (!r || !i) continue;
		both++;
		if (!r.strict) {
			rf++;
			if (i.strict) fixed++;
		} else {
			rs++;
			if (!i.strict) broke++;
		}
	}
	paired[sys] = { both, regularStrictFail: rf, instrumentalStrict: fixed, regularStrict: rs, instrumentalStrictFail: broke };
}

// fold direction by declared tempo (the perceptual-prior question), regular mixes
const foldByTempo: Record<string, Record<string, number[]>> = {};
for (const sys of SYSTEMS) {
	foldByTempo[sys] = { half: [], double: [], strict: [], other: [] };
	for (const [slug, e] of Object.entries(manifest.entries)) {
		const c = graded[`${slug}|regular`]?.[sys];
		if (!c || !e.bpm || e.meter !== "4/4") continue;
		const bucket = c.strict ? "strict" : c.folded && c.fold === 0.5 ? "half" : c.folded && c.fold === 2 ? "double" : "other";
		foldByTempo[sys][bucket]!.push(e.bpm);
	}
}

writeFileSync(`${root}results/study36b.json`, `${JSON.stringify({ production, graded, summary, paired, foldByTempo }, null, "\t")}\n`);

const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(0)}%` : "-");
for (const kind of ["regular", "instrumental"] as const) {
	console.log(`\n== ${kind} ==`);
	for (const sys of SYSTEMS) {
		const s = summary[kind]?.[sys] ?? {};
		const line = Object.entries(s)
			.filter(([, v]) => v.n > 0)
			.map(([k, v]) => `${k}: strict ${pct(v.strict, v.n)} folded ${pct(v.folded, v.n)} meter ${pct(v.meterRight, v.n)} (n=${v.n})`)
			.join(" | ");
		if (line) console.log(`${sys}\n  ${line.split(" | ").join("\n  ")}`);
	}
}
console.log("\n== paired (regular vs instrumental, strict bar) ==");
for (const [sys, p] of Object.entries(paired)) console.log(`${sys}: of ${p.regularStrictFail} regular failures the instrumental fixes ${p.instrumentalStrict}; of ${p.regularStrict} regular passes the instrumental breaks ${p.instrumentalStrictFail} (n=${p.both})`);
console.log("\n== 4/4 fold direction by declared bpm (regular) ==");
const med = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[xs.length >> 1] : null);
for (const [sys, b] of Object.entries(foldByTempo)) console.log(`${sys}: strict n=${b.strict!.length} median ${med(b.strict!)} | half n=${b.half!.length} median ${med(b.half!)} | double n=${b.double!.length} median ${med(b.double!)} | other n=${b.other!.length}`);
console.log("results/study36b.json written");
