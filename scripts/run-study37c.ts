/**
 * Study 37 part C (docs/BRIEF-STUDY37.md): the harmonic-rhythm period
 * witness over the Josh Woodward catalog, $0. For each regular mix and
 * each base system (Beat This final0, small0, madmom-34, production) the
 * witness re-picks the bar length among the registered ratios of the
 * base bar, using ChordMini's chord-change times snapped to the base
 * system's beat lattice. Grades base and witness-corrected bars against
 * the declared bar (strict within 4 %, folded). Writes results/study37c.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { foldCompare, summarizeTracker } from "../src/study36/metrical.js";
import { changeBeats, harmonicPeriod, type Segment, type WitnessResult } from "../src/study37/harmonic.js";

const root = new URL("../", import.meta.url).pathname;
const TOL = 0.04;
const MIN_CHANGES = 8;
const MIN_MARGIN = 0.1;

interface Entry {
	bpm: number | null;
	meter: string | null;
	feel: string | null;
	regular?: { file: string; seconds: number | null };
}
const manifest = JSON.parse(readFileSync(`${root}corpus/study36b-manifest.json`, "utf8")) as { entries: Record<string, Entry> };
const trackers = JSON.parse(readFileSync(`${root}results/study36b-trackers.json`, "utf8")) as Record<string, Record<string, { beats: number[]; downbeats: number[] }>>;
const s36b = JSON.parse(readFileSync(`${root}results/study36b.json`, "utf8")) as {
	production: Record<string, { bpm: number; barSec: number; beatsPerBar: number; meter: string }>;
};

function declaredBarSec(bpm: number, meter: string): number {
	return ((meter === "6/8" ? 2 : meter === "3/4" ? 3 : 4) * 60) / bpm;
}

interface Cell {
	baseK: number;
	baseBarSec: number;
	baseStrict: boolean;
	baseFolded: boolean;
	baseFold: number;
	k: number;
	ratio: number;
	abstain: string | null;
	margin: number | null;
	changes: number;
	barSec: number;
	strict: boolean;
	folded: boolean;
	fold: number;
	/** The strict bar was among the candidates (ceiling). */
	strictReachable: boolean;
	top: { k: number; score: number; startRate: number; stability: number }[];
}

const SYSTEMS = ["beatthis-final0", "beatthis-small0", "madmom-34", "production"] as const;
const out: Record<string, Record<string, Cell>> = {};
let n = 0;
for (const [slug, e] of Object.entries(manifest.entries)) {
	if (!e.bpm || !e.meter || !e.regular) continue;
	let segs: Segment[];
	try {
		segs = (JSON.parse(readFileSync(`${root}corpus-study36/chords/${slug}.regular.json`, "utf8")) as { segments: Segment[] }).segments;
	} catch {
		continue;
	}
	const truthBar = declaredBarSec(e.bpm, e.meter);
	const key = `${slug}|regular`;
	out[slug] = {};
	for (const sys of SYSTEMS) {
		let beats: number[];
		let baseK: number;
		if (sys === "production") {
			const p = s36b.production[key];
			if (!p) continue;
			baseK = p.beatsPerBar;
			const beatSec = p.barSec / p.beatsPerBar;
			const dur = e.regular.seconds ?? 300;
			beats = Array.from({ length: Math.floor(dur / beatSec) }, (_, i) => i * beatSec);
		} else {
			const t = trackers[key]?.[sys];
			if (!t) continue;
			const s = summarizeTracker(t.beats, t.downbeats);
			if (!s.beatsPerBar || s.beatsPerBar < 2) continue;
			baseK = s.beatsPerBar;
			beats = t.beats;
		}
		const beatSec = beats.length > 1 ? (beats[beats.length - 1]! - beats[0]!) / (beats.length - 1) : 0;
		if (beatSec <= 0) continue;
		const changes = changeBeats(segs, beats);
		const w: WitnessResult = harmonicPeriod(changes, baseK, MIN_CHANGES, MIN_MARGIN);
		const baseBar = baseK * beatSec;
		const bar = w.k * beatSec;
		const fb = foldCompare(baseBar, truthBar, TOL);
		const fw = foldCompare(bar, truthBar, TOL);
		const reachable = w.ranked.some((c) => Math.abs((c.k * beatSec) / truthBar - 1) <= TOL);
		out[slug][sys] = {
			baseK,
			baseBarSec: baseBar,
			baseStrict: fb.strict,
			baseFolded: fb.folded,
			baseFold: fb.ratio,
			k: w.k,
			ratio: w.ratio,
			abstain: w.abstain,
			margin: w.margin,
			changes: w.changes,
			barSec: bar,
			strict: fw.strict,
			folded: fw.folded,
			fold: fw.ratio,
			strictReachable: reachable,
			top: w.ranked.slice(0, 3).map((c) => ({ k: c.k, score: +c.score.toFixed(3), startRate: +c.startRate.toFixed(3), stability: +c.stability.toFixed(3) })),
		};
	}
	n++;
}
console.log(`${n} songs with chords`);

// tallies
const classes: Record<string, (e: Entry) => boolean> = {
	"4/4": (e) => e.meter === "4/4",
	"6/8": (e) => e.meter === "6/8",
	all: () => true,
};
const summary: Record<string, Record<string, unknown>> = {};
for (const sys of SYSTEMS) {
	summary[sys] = {};
	for (const [cname, f] of Object.entries(classes)) {
		let nn = 0, baseStrict = 0, strict = 0, fixed = 0, broke = 0, abstained = 0, reachable = 0, foldedNotStrict = 0, fixedHalf = 0, fixedDouble = 0, halfCases = 0, doubleCases = 0, unfoldedFixed = 0;
		for (const [slug, e] of Object.entries(manifest.entries)) {
			const c = out[slug]?.[sys];
			if (!c || !f(e)) continue;
			nn++;
			if (c.baseStrict) baseStrict++;
			if (c.strict) strict++;
			if (!c.baseStrict && c.strict) fixed++;
			if (c.baseStrict && !c.strict) broke++;
			if (c.abstain) abstained++;
			if (c.strictReachable) reachable++;
			if (c.baseFolded && !c.baseStrict) {
				foldedNotStrict++;
				if (c.baseFold === 0.5) {
					halfCases++;
					if (c.strict) fixedHalf++;
				}
				if (c.baseFold === 2) {
					doubleCases++;
					if (c.strict) fixedDouble++;
				}
			}
			if (!c.baseFolded && c.strict) unfoldedFixed++;
		}
		summary[sys][cname] = { n: nn, baseStrict, strict, fixed, broke, abstained, strictReachable: reachable, foldedNotStrict, halfCases, fixedHalf, doubleCases, fixedDouble, unfoldedFixed };
		const pct = (a: number) => (nn ? `${((100 * a) / nn).toFixed(0)}%` : "-");
		console.log(
			`${sys} ${cname} (n=${nn}): base strict ${baseStrict} (${pct(baseStrict)}) -> witness strict ${strict} (${pct(strict)}) | fixed ${fixed} broke ${broke} abstained ${abstained} | half-bar cases ${halfCases} fixed ${fixedHalf}, double-bar cases ${doubleCases} fixed ${fixedDouble}, unfolded fixed ${unfoldedFixed} | strict reachable ${reachable}`,
		);
	}
}
// predictions
const f0 = summary["beatthis-final0"]!["4/4"] as { n: number; baseStrict: number; strict: number; fixed: number; broke: number; abstained: number; strictReachable: number; foldedNotStrict: number; halfCases: number; fixedHalf: number; doubleCases: number; fixedDouble: number };
const f068 = summary["beatthis-final0"]!["6/8"] as { n: number; baseStrict: number; strict: number };
const fAll = summary["beatthis-final0"]!.all as { n: number; abstained: number };
console.log("\nC1 (witness fixes >= 50% of final0's folded-not-strict 4/4):", f0.fixed, "of", f0.foldedNotStrict, f0.fixed >= 0.5 * f0.foldedNotStrict ? "PASS" : "FAIL");
console.log("C2 (witness breaks <= 15% of final0's strict 4/4):", f0.broke, "of", f0.baseStrict, f0.broke <= 0.15 * f0.baseStrict ? "PASS" : "FAIL");
console.log("C3 (final0 4/4 strict after witness >= 78%):", `${((100 * f0.strict) / f0.n).toFixed(1)}%`, f0.strict / f0.n >= 0.78 ? "PASS" : "FAIL");
console.log("C4 (final0 6/8 strict after witness >= 45%):", `${((100 * f068.strict) / f068.n).toFixed(1)}%`, f068.strict / f068.n >= 0.45 ? "PASS" : "FAIL");
console.log("C5 (abstention >= 15% of all songs):", `${((100 * fAll.abstained) / fAll.n).toFixed(1)}%`, fAll.abstained / fAll.n >= 0.15 ? "PASS" : "FAIL");
console.log("C6 (strict bar reachable among candidates on >= 90% of 4/4):", `${((100 * f0.strictReachable) / f0.n).toFixed(1)}%`, f0.strictReachable / f0.n >= 0.9 ? "PASS" : "FAIL");
writeFileSync(`${root}results/study37c.json`, `${JSON.stringify({ params: { TOL, MIN_CHANGES, MIN_MARGIN }, summary, cells: out }, null, "\t")}\n`);
console.log("results/study37c.json written");
