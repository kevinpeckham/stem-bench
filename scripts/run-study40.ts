/**
 * Study 40 (docs/BRIEF-STUDY40.md), $0: the app's Ask A and Ask B as
 * sweeps over results/study40-features.json.
 *  A0  reproduction: the probe at production thresholds must give the
 *      detector's own bpm and meter on every song.
 *  A1  duple-bar witness on a 6/8 call: keep 6/8 only if
 *      c = ac(1.5L) + ac(3L) ≥ r · d = r · (ac(2L) + ac(4L)), L the kept
 *      beat lag; else fall back to 4/4 at the pre-re-pick pulse. Sweep r.
 *  A2  sub-beat thresholds: COMPOUND_MARGIN × TRIPLET_SHARE grid.
 *  B   finer bar: take the ×2 rung when its strength ≥ s. Sweep s, with
 *      the bpm split of right and wrong ×2 moves for a cap.
 * Every variant is graded as Study 36b graded production: bar =
 * productionBeatsPerBar(meter) × 60 / bpm against the declared bar,
 * strict within 4 %, folded, meter class. Writes results/study40.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { foldCompare, type MeterClass, meterSatisfied, meterStringClass, productionBeatsPerBar } from "../src/study36/metrical.js";
import { DEFAULTS, detectionFrom, subdivisionFrom, type TempoProbe } from "../src/study40/probe.js";

const root = new URL("../", import.meta.url).pathname;
const TOL = 0.04;
interface Row {
	declared: { bpm: number; meter: string; feel: string | null };
	detector: { bpm: number; confidence: number; subdivision: number; meter: string; alternates: { factor: number; bpm: number; strength: number }[] };
	probe: TempoProbe | null;
}
const rows = (JSON.parse(readFileSync(`${root}results/study40-features.json`, "utf8")) as { rows: Record<string, Row> }).rows;
const songs = Object.entries(rows).filter(([, r]) => r.probe !== null) as [string, Row & { probe: TempoProbe }][];
const declaredBarSec = (bpm: number, meter: string) => ((meter === "6/8" ? 2 : meter === "3/4" ? 3 : 4) * 60) / bpm;
const declaredClass = (meter: string): MeterClass => (meter === "6/8" ? "compound" : meter === "3/4" ? 3 : 4);

interface Grade {
	strict: boolean;
	folded: boolean;
	meterRight: boolean;
}
function grade(bpm: number, meter: string, d: Row["declared"]): Grade {
	const beats = productionBeatsPerBar(meter);
	const f = foldCompare((beats * 60) / bpm, declaredBarSec(d.bpm, d.meter), TOL);
	const cls = meterStringClass(meter);
	return { strict: f.strict, folded: f.folded, meterRight: cls !== null && cls === declaredClass(d.meter) && meterSatisfied(beats, declaredClass(d.meter)) };
}
interface Tally {
	n: number;
	strict: number;
	folded: number;
	meterRight: number;
	false68: number;
	true68: number;
	rightToWrong: number;
	wrongToRight: number;
}
function tally(f: (slug: string, r: Row & { probe: TempoProbe }) => { bpm: number; meter: string }, baseline?: Record<string, Grade>): Tally {
	const t: Tally = { n: 0, strict: 0, folded: 0, meterRight: 0, false68: 0, true68: 0, rightToWrong: 0, wrongToRight: 0 };
	for (const [slug, r] of songs) {
		const v = f(slug, r);
		const g = grade(v.bpm, v.meter, r.declared);
		t.n++;
		if (g.strict) t.strict++;
		if (g.folded) t.folded++;
		if (g.meterRight) t.meterRight++;
		if (v.meter === "6/8" && r.declared.meter !== "6/8") t.false68++;
		if (v.meter === "6/8" && r.declared.meter === "6/8") t.true68++;
		const b = baseline?.[slug];
		if (b) {
			if (b.strict && !g.strict) t.rightToWrong++;
			if (!b.strict && g.strict) t.wrongToRight++;
		}
	}
	return t;
}
const pct = (a: number, n: number) => `${((100 * a) / n).toFixed(0)}%`;
const fmt = (t: Tally) => `strict ${t.strict} (${pct(t.strict, t.n)}) folded ${t.folded} (${pct(t.folded, t.n)}) meter ${t.meterRight} (${pct(t.meterRight, t.n)}) | 6/8 named: false ${t.false68}, true ${t.true68}` + (t.rightToWrong || t.wrongToRight ? ` | right→wrong ${t.rightToWrong}, wrong→right ${t.wrongToRight}` : "");

// A0: reproduction
let agree = 0;
const baseline: Record<string, Grade> = {};
for (const [slug, r] of songs) {
	const d = detectionFrom(r.probe, DEFAULTS);
	if (d.bpm === r.detector.bpm && d.meter === r.detector.meter) agree++;
	baseline[slug] = grade(r.detector.bpm, r.detector.meter, r.declared);
}
const prod = tally((_s, r) => ({ bpm: r.detector.bpm, meter: r.detector.meter }));
console.log(`A0 reproduction: probe agrees with the detector on ${agree}/${songs.length} songs`);
console.log(`production (Study 36b baseline): ${fmt(prod)}`);
const n68 = songs.filter(([, r]) => r.declared.meter === "6/8").length;

// A1: duple-bar witness
const a1: Record<string, Tally> = {};
console.log("\nA1 duple-bar witness c/d ≥ r on every 6/8 call (fallback: 4/4 at the pre-re-pick pulse):");
for (let r = 0.8; r <= 1.3001; r += 0.05) {
	const key = r.toFixed(2);
	a1[key] = tally((_s, row) => {
		const s = subdivisionFrom(row.probe, DEFAULTS);
		const d = detectionFrom(row.probe, DEFAULTS);
		if (d.meter !== "6/8") return d;
		const ac = s.branch === "super" ? row.probe.ac1 : row.probe.ac0;
		const c = ac["1.5"]! + ac["3"]!;
		const dd = ac["2"]! + ac["4"]!;
		if (c >= r * dd) return d;
		// dropped: straight meter at the pre-re-pick pulse
		const bpm0 = Math.round(((60 * row.probe.fps) / row.probe.lag0) * 10) / 10;
		return { bpm: bpm0, meter: row.probe.lean0 > 0.03 ? "3/4" : "4/4" };
	}, baseline);
	console.log(`  r ${key}: ${fmt(a1[key]!)}`);
}

// A2: sub-beat threshold grid
const a2: Record<string, Tally> = {};
console.log("\nA2 sub-beat thresholds (COMPOUND_MARGIN × TRIPLET_SHARE; super-beat test unchanged):");
for (let margin = 1.15; margin <= 1.6001; margin += 0.05) {
	for (let share = 0.55; share <= 0.8001; share += 0.05) {
		const key = `${margin.toFixed(2)}x${share.toFixed(2)}`;
		a2[key] = tally((_s, row) => detectionFrom(row.probe, { ...DEFAULTS, compoundMargin: margin, tripletShare: share }), baseline);
		console.log(`  margin ${margin.toFixed(2)} share ${share.toFixed(2)}: ${fmt(a2[key]!)}`);
	}
}
// A2b: the super-beat branch alone (sub-beat test off)
const superOnly = tally((_s, row) => detectionFrom(row.probe, { ...DEFAULTS, compoundMargin: 1e9 }), baseline);
console.log(`  sub-beat test OFF (super-beat only): ${fmt(superOnly)}`);
const noneOnly = tally((_s, row) => detectionFrom(row.probe, { ...DEFAULTS, compoundMargin: 1e9, dottedMargin: 1e9 }), baseline);
console.log(`  both tests OFF (never 6/8): ${fmt(noneOnly)}`);

// B: finer bar
const b: Record<string, Tally & { moves: number; movesRight: number; movesWrong: number; bpmRight: number[]; bpmWrong: number[] }> = {};
console.log("\nB finer bar: take the ×2 rung when its strength ≥ s (detector's meter kept):");
for (let s = 0.6; s <= 1.0001; s += 0.05) {
	const key = s.toFixed(2);
	let moves = 0, movesRight = 0, movesWrong = 0;
	const bpmRight: number[] = [], bpmWrong: number[] = [];
	const t = tally((slug, row) => {
		const rung = row.detector.alternates.find((a) => a.factor === 2);
		if (!rung || rung.strength < s) return { bpm: row.detector.bpm, meter: row.detector.meter };
		moves++;
		const g = grade(rung.bpm, row.detector.meter, row.declared);
		if (g.strict && !baseline[slug]!.strict) { movesRight++; bpmRight.push(row.detector.bpm); }
		if (!g.strict && baseline[slug]!.strict) { movesWrong++; bpmWrong.push(row.detector.bpm); }
		return { bpm: rung.bpm, meter: row.detector.meter };
	}, baseline);
	b[key] = { ...t, moves, movesRight, movesWrong, bpmRight, bpmWrong };
	const med = (xs: number[]) => (xs.length ? xs.sort((x, y) => x - y)[xs.length >> 1] : null);
	console.log(`  s ${key}: ${fmt(t)} | ×2 taken on ${moves}; made right ${movesRight} (detected bpm median ${med(bpmRight)}), made wrong ${movesWrong} (median ${med(bpmWrong)})`);
}
// B cap: among all songs, which detected bpm band holds the strict-wrong-by-half readings (where ×2 would fix) vs strict-right ones (where ×2 would break)?
const halfWrong = songs.filter(([slug, r]) => !baseline[slug]!.strict && grade(r.detector.bpm * 2, r.detector.meter, r.declared).strict).map(([, r]) => r.detector.bpm).sort((x, y) => x - y);
const rightNow = songs.filter(([slug]) => baseline[slug]!.strict).map(([, r]) => r.detector.bpm).sort((x, y) => x - y);
console.log(`\nB cap data: ×2 would FIX ${halfWrong.length} songs (detected bpm: min ${halfWrong[0]}, median ${halfWrong[halfWrong.length >> 1]}, max ${halfWrong[halfWrong.length - 1]}); strict-right songs ${rightNow.length} (detected bpm min ${rightNow[0]}, median ${rightNow[rightNow.length >> 1]}, max ${rightNow[rightNow.length - 1]})`);
for (const cap of [80, 90, 100, 110, 120]) console.log(`  cap ${cap}: ×2 fixes ${halfWrong.filter((x) => x < cap).length} of ${halfWrong.length}; strict-right songs under the cap (at risk) ${rightNow.filter((x) => x < cap).length}`);

// predictions
const best1 = Object.entries(a1).sort((x, y) => y[1].meterRight - x[1].meterRight)[0]!;
const best2 = Object.entries(a2).sort((x, y) => y[1].meterRight - x[1].meterRight)[0]!;
console.log(`\nP1 (A1 at some r: false 6/8 ≤ 10 with true 6/8 ≥ 15 of ${n68}):`, Object.entries(a1).some(([, t]) => t.false68 <= 10 && t.true68 >= 15) ? "PASS" : "FAIL", `best meter: r ${best1[0]} ${fmt(best1[1])}`);
console.log(`P2 (A2 at some cell: false 6/8 ≤ 20 with true 6/8 ≥ 15):`, Object.entries(a2).some(([, t]) => t.false68 <= 20 && t.true68 >= 15) ? "PASS" : "FAIL", `best meter: ${best2[0]} ${fmt(best2[1])}`);
console.log("P3 (A1 best cell raises production strict by ≥ 10 songs over 36b's baseline):", best1[1].strict - prod.strict, best1[1].strict - prod.strict >= 10 ? "PASS" : "FAIL");
const bestB = Object.entries(b).sort((x, y) => y[1].strict - x[1].strict)[0]!;
console.log(`P4 (B at some s: wrong→right ≥ 2× right→wrong and strict up ≥ 10):`, Object.entries(b).some(([, t]) => t.wrongToRight >= 2 * t.rightToWrong && t.strict - prod.strict >= 10) ? "PASS" : "FAIL", `best strict: s ${bestB[0]} ${fmt(bestB[1])}`);
console.log("P5 (×2 fixes sit below detected 100 bpm: ≥ 80% of fixable under 100):", halfWrong.length ? pct(halfWrong.filter((x) => x < 100).length, halfWrong.length) : "-", halfWrong.length && halfWrong.filter((x) => x < 100).length >= 0.8 * halfWrong.length ? "PASS" : "FAIL");
writeFileSync(`${root}results/study40.json`, `${JSON.stringify({ reproduction: { agree, n: songs.length }, production: prod, a1, a2, superOnly, noneOnly, b, cap: { halfWrong, rightNow } }, null, "\t")}\n`);
console.log("results/study40.json written");
