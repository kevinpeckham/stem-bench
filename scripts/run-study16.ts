/**
 * Study 16 run (docs/BRIEF-STUDY16.md): the barmark adoption validated
 * at the stem-shovel pins 371831ae/b5ed9ed2/a0926c65 with barmark 0.5.0.
 * Arm A: cross-parser agreement on the committed app-dialect texts
 * (retired chordChartBars @39c25b5 vs the adapter), each parser given
 * its own dialect's header over the identical body (the substitution
 * table is registered in the brief). Arm B: the band's stored MIGRATED
 * charts through the production path, graded against the declared
 * section grid and the bench's verified content. Arm C: placement and
 * the two-clause same-piece gates on the real recordings through the
 * new path. Zero spend.
 */
import { readFileSync, writeFileSync } from "node:fs";
import declared from "../corpus/badverbs-declared.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { chordChartBars } from "../src/study14/chordChartBars.js";
import type { ChartBar } from "../src/study14/chartBars.js";
import { alignChart } from "../src/study15/chartAlignment.js";
import { alignedPlacements } from "../src/study15/alignedPlacements.js";
import { ALIGNMENT_SAME_PIECE_RATIO } from "../src/study15/constants.js";
import { barmarkChartBars } from "../src/study16/barmarkChartBars.js";
import {
	barsAgreement,
	contentDiffs,
	median,
	sectionGridErrors,
	type TruthSection,
} from "../src/study16/grading16.js";

const root = new URL("../", import.meta.url).pathname;
const MEDIAN_LOCAL_MAX = 0.3; // the second same-piece clause, recommended by Study 15
const GRID_TOL = 0.1; // s, G2
const fail: string[] = [];
const gate = (id: string, ok: boolean, detail: string) => {
	console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`);
	if (!ok) fail.push(id);
};

// ---- Arm A: cross-parser agreement on the committed app-dialect texts ----
// The old combined stated line is the app dialect's; barmark's grammar wants
// the directive form. Same body, each parser its own header (registered).
const HEADERS: Record<string, { old: string; barmark: string }> = {
	"letter-lands": { old: "key: F#maj 4/4 132 bpm", barmark: "key: F#, time: 4/4, tempo: 132" },
	"peaceful-dreams": { old: "Key: D · 4/4 · 145 bpm", barmark: "key: D, time: 4/4, tempo: 145" },
	"eat-all-the-clocks": { old: "key: Emin 4/4 120 bpm", barmark: "key: Em, time: 4/4, tempo: 120" },
};
const armA: unknown[] = [];
let aOk = true;
for (const [slug, h] of Object.entries(HEADERS)) {
	const md = readFileSync(`${root}corpus/mmkk-chart-texts/${slug}.md`, "utf8");
	if (!md.startsWith(h.old)) throw new Error(`${slug}: header drifted from the registered table`);
	const retired = chordChartBars(md, { tempo: null, meter: null })!;
	const adapted = barmarkChartBars(md.replace(h.old, h.barmark), { tempo: null, meter: null })!;
	const diffs = barsAgreement(retired.bars, adapted.bars);
	const warnings = [...retired.warnings, ...adapted.warnings];
	armA.push({ slug, bars: retired.bars.length, diffs, retiredWarnings: retired.warnings, adapterWarnings: adapted.warnings });
	if (diffs.length || warnings.length) aOk = false;
	console.log(`armA ${slug}: ${retired.bars.length} bars, ${diffs.length} diffs, ${warnings.length} warnings${diffs.length ? ` | ${diffs.slice(0, 3).join("; ")}` : ""}`);
}
gate("G1", aOk, "cross-parser agreement, zero warnings, all three app-dialect charts");

// ---- Arm B: the stored migrated charts through the production path ----
type Declared = { slug: string; chart: string | null; defaults: { tempo: number | null; meter: string | null }; sections: { name: string; start: number }[] | null };
const SONGS = (declared.songs as Declared[]).filter((s) => s.chart && s.sections);
const GATED_B = new Set(["letter-lands", "peaceful-dreams", "eat-all-the-clocks"]);
const barsOf = new Map<string, ChartBar[]>();
const armB: unknown[] = [];
let bOk = true;
// Verified content truth: letter-lands from the committed Study 12 list;
// peaceful-dreams from the retired parser's reading of the committed band
// revision (152 bars, grid-verified in Study 15's registration tests).
const truthOf = new Map<string, TruthSection[]>();
truthOf.set(
	"letter-lands",
	(mmkkCharts.songs as { slug: string; sections: TruthSection[] }[]).find((s) => s.slug === "letter-lands")!.sections,
);
{
	const md = readFileSync(`${root}corpus/mmkk-chart-texts/peaceful-dreams.md`, "utf8");
	const read = chordChartBars(md, { tempo: null, meter: null })!;
	const sections: TruthSection[] = [];
	for (const b of read.bars) {
		if (b.section !== null) sections.push({ name: b.section, bars: [] });
		sections.at(-1)!.bars.push(b.chords);
	}
	truthOf.set("peaceful-dreams", sections);
}
for (const s of SONGS) {
	const md = readFileSync(`${root}${s.chart}`, "utf8");
	const read = barmarkChartBars(md, s.defaults);
	const gatedB = GATED_B.has(s.slug);
	if (!read) {
		armB.push({ slug: s.slug, gated: gatedB, bars: 0, error: "no read" });
		if (gatedB) bOk = false;
		continue;
	}
	barsOf.set(s.slug, read.bars);
	const grid = sectionGridErrors(read.bars, s.sections!);
	const maxGridErr = grid ? Math.max(...grid.map((g) => Math.abs(g.err))) : null;
	const truth = truthOf.get(s.slug);
	const content = truth ? contentDiffs(truth, read.bars, 1) : null;
	const ok =
		read.warnings.length === 0 && grid !== null && maxGridErr! <= GRID_TOL && (content === null || content.length === 0);
	if (gatedB && !ok) bOk = false;
	armB.push({
		slug: s.slug,
		gated: gatedB,
		bars: read.bars.length,
		warnings: read.warnings,
		grid,
		maxGridErr,
		contentDiffs: content,
	});
	console.log(
		`armB ${s.slug}${gatedB ? " (GATED)" : " (expl)"}: ${read.bars.length} bars, ${read.warnings.length} warnings, grid ${grid ? `max |err| ${maxGridErr!.toFixed(4)}s over ${grid.length} sections` : "SECTION-COUNT MISMATCH"}${content ? `, content diffs ${content.length}` : ""}${content?.length ? ` | ${content.slice(0, 3).join("; ")}` : ""}`,
	);
}
gate("G2", bOk, `migration: three verified songs parse clean, land every declared section within ±${GRID_TOL}s, match verified content`);

// ---- Arm C: real recordings through the new path ----
const loadRaw = (slug: string) => {
	const buf = readFileSync(`${root}corpus-mmkk/${slug}/mix.mp3.22050.f32le.raw`);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
};
const GATED_C = ["letter-lands", "peaceful-dreams", "eat-all-the-clocks"];
const audioOf = new Map<string, Float32Array>();
for (const s of SONGS) audioOf.set(s.slug, loadRaw(s.slug));
const real: unknown[] = [];
const localStats: unknown[] = [];
const rightPass = new Map<string, boolean>();
const medianAbsErr = new Map<string, number>();
for (const s of SONGS) {
	const bars = barsOf.get(s.slug);
	if (!bars) continue;
	const alignment = alignChart(bars, audioOf.get(s.slug)!, 22050);
	const placements = alignedPlacements(bars, alignment);
	const medLocal = median(alignment.localCost);
	const pass = placements.ratio >= ALIGNMENT_SAME_PIECE_RATIO && medLocal <= MEDIAN_LOCAL_MAX;
	rightPass.set(s.slug, pass);
	const errs = placements.sections.map((p, k) => (s.sections![k] ? Math.round((p.start - s.sections![k]!.start) * 100) / 100 : null));
	const absErrs = errs.filter((e): e is number => e !== null).map(Math.abs);
	medianAbsErr.set(s.slug, median(absErrs));
	real.push({
		slug: s.slug,
		gated: GATED_C.includes(s.slug),
		ratio: placements.ratio,
		medianLocal: medLocal,
		twoClausePass: pass,
		firstSound: alignment.firstSound,
		lastSound: alignment.lastSound,
		medianAbsErr: medianAbsErr.get(s.slug),
		sections: placements.sections.map((p, k) => ({ name: p.name, placed: Math.round(p.start * 100) / 100, declared: s.sections![k]?.start ?? null, err: errs[k], hedged: p.hedged })),
	});
	localStats.push({ itemId: s.slug, kind: "right-real", medianLocal: medLocal, ratio: placements.ratio });
	console.log(
		`armC ${s.slug}${GATED_C.includes(s.slug) ? " (GATED)" : " (expl)"}: ratio ${placements.ratio.toFixed(2)} medLocal ${medLocal.toFixed(3)} twoClause ${pass} | median|err| ${medianAbsErr.get(s.slug)!.toFixed(2)}s | errs ${errs.map((e) => (e === null ? "—" : e.toFixed(2))).join(",")}`,
	);
}
let wrongAllFail = true;
for (const rec of GATED_C) {
	for (const chart of GATED_C) {
		if (rec === chart) continue;
		const bars = barsOf.get(chart)!;
		const a = alignChart(bars, audioOf.get(rec)!, 22050);
		const p = alignedPlacements(bars, a);
		const medLocal = median(a.localCost);
		const pass = p.ratio >= ALIGNMENT_SAME_PIECE_RATIO && medLocal <= MEDIAN_LOCAL_MAX;
		if (pass) wrongAllFail = false;
		localStats.push({ itemId: `${rec}⊗${chart}`, kind: "wrong-real", medianLocal: medLocal, ratio: p.ratio });
		console.log(`armC wrong ${rec} vs ${chart}: ratio ${p.ratio.toFixed(2)} medLocal ${medLocal.toFixed(3)} twoClause ${pass}`);
	}
}
// mop-heart cross pairs, exploratory (first appearance of the song; not
// gated). Amendment 1: alignChart THROWS when a chart runs more than
// twice the recording (production's own refusal — peaceful's 253 s chart
// against mop-heart's recording); the runner records the refusal, which
// for a wrong pair is the right answer by construction.
for (const other of GATED_C) {
	for (const [rec, chart] of [["mop-heart", other], [other, "mop-heart"]] as const) {
		const bars = barsOf.get(chart);
		if (!bars) continue;
		try {
			const a = alignChart(bars, audioOf.get(rec)!, 22050);
			const p = alignedPlacements(bars, a);
			localStats.push({ itemId: `${rec}⊗${chart}`, kind: "wrong-real-expl", medianLocal: median(a.localCost), ratio: p.ratio });
		} catch (e) {
			localStats.push({ itemId: `${rec}⊗${chart}`, kind: "wrong-real-expl", refused: (e as Error).message });
		}
	}
}
gate("G3", GATED_C.every((s) => rightPass.get(s)) && wrongAllFail, "two-clause same-piece: 3 right pairs pass, 6 wrong pairs fail");
const G4 = [
	["letter-lands", 0.33],
	["peaceful-dreams", 0.36],
] as const;
gate(
	"G4",
	G4.every(([slug, cap]) => (medianAbsErr.get(slug) ?? Infinity) <= cap),
	`placement no-regression vs Study 15 @bc683871: ${G4.map(([s, c]) => `${s} median|err| ${medianAbsErr.get(s)?.toFixed(2)}s ≤ ${c}s`).join(", ")}`,
);

// ---- Predictions (scored, not gates) ----
const counts = Object.fromEntries([...barsOf].map(([k, v]) => [k, v.length]));
console.log(`\npredictions: P1 bars ${JSON.stringify(counts)} (said letter 76, peaceful 153, eat 71)`);
console.log(`P2 eat median|err| ${medianAbsErr.get("eat-all-the-clocks")?.toFixed(2)}s (said ≤ 0.50; Study 15: 1.99)`);
const ratioOf = (slug: string) => (real as { slug: string; ratio: number }[]).find((r) => r.slug === slug)?.ratio;
console.log(`P3 ratios letter ${ratioOf("letter-lands")?.toFixed(2)} (15: 2.04 ±0.15), peaceful ${ratioOf("peaceful-dreams")?.toFixed(2)} (15: 3.21 ±0.15), eat ${ratioOf("eat-all-the-clocks")?.toFixed(2)} (said ≥ 2.53)`);
console.log(`P4 mop-heart two-clause ${rightPass.get("mop-heart")} (said pass)`);

writeFileSync(
	`${root}results/study16.json`,
	`${JSON.stringify({ version: 1, pins: { stemShovel: ["371831ae", "b5ed9ed2", "a0926c65"], barmark: "0.5.0", retired: "39c25b5", alignment: "bc683871" }, armA, armB, real, localStats, gates: { failed: fail } }, null, "\t")}\n`,
);
console.log(`\nstudy16.json written; gates ${fail.length ? `FAILED: ${fail.join(", ")}` : "all pass"}`);
