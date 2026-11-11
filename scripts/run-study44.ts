/**
 * Study 44 (docs/BRIEF-STUDY44.md), $0: the app's two rules on the
 * tracker's bars (adjacent half bars joined; an unsteady reading not used)
 * measured over every Beat This small0 reading the bench holds, beside the
 * draft grades and the census truth. Reads committed readings and results
 * only; writes results/study44.json. No model.
 *   bun scripts/run-study44.ts
 */
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { declaredBarSec, type GridProfile, profile, type Reading } from "../src/study44/gridRules.js";

const root = new URL("../", import.meta.url).pathname;
const read = <T>(p: string): T => JSON.parse(readFileSync(`${root}${p}`, "utf8")) as T;
type Tracks = Record<string, Record<string, { beats: number[]; downbeats: number[] }>>;
const RATE = 22050;

// --- corpora -------------------------------------------------------------
interface Item {
	slug: string;
	set: "woodward" | "mmkk" | "guitar" | "waltz" | "census";
	declared: { bpm: number; meter: string } | null;
	seconds: number;
	readings: Record<string, Reading>;
	/** The draft on this tracker's bars as read (Study 41 small0; Study 43 bar grid; Study 38 madmom), when one exists. */
	grade: { study: string; system: string; class: string; roots: string } | null;
	/** The census grade of the reading (Study 36b): bar strict / folded / meter right, per system. */
	census: Record<string, { strict: boolean; folded: boolean; meterRight: boolean }> | null;
}
const items: Item[] = [];

const t36 = read<Tracks>("results/study36-trackers.json");
const corpus36 = read<{ rows: { slug: string; raw: string; bpm: number | null; meter: string | null }[] }>("corpus/study36-corpus.json").rows;
const s41 = read<{ results: Record<string, { class: string; roots: { right: number; bearing: number } }> }>("results/study41.json").results;
const s38 = read<{ results: Record<string, { class: string; roots?: { right: number; bearing: number }; arm: string }> }>("results/study38.json").results;
const s43 = existsSync(`${root}results/study43.json`) ? read<{ results: Record<string, { class: string; roots?: { right: number; bearing: number } }> }>("results/study43.json").results : {};
const t38 = read<Tracks>("results/study38-trackers.json");
const t43 = read<Tracks>("results/study43-trackers.json");
const m43 = read<{ entries: Record<string, { seconds: number; group: string }> }>("corpus/study43-manifest.json").entries;
const fmt = (r?: { right: number; bearing: number }) => (r ? `${r.right}/${r.bearing}` : "-");
const withDuration = (t: { beats: number[]; downbeats: number[] }, seconds: number): Reading => ({ ...t, duration: seconds });

for (const row of corpus36) {
	if (!t36[row.slug]?.["beatthis-small0"]) continue;
	const seconds = statSync(`${root}${row.raw}`).size / 4 / RATE;
	const set = row.slug.startsWith("jw-") ? "woodward" : row.slug === "three-oclock-waltz" ? "waltz" : "mmkk";
	const readings: Record<string, Reading> = {};
	for (const sys of ["beatthis-small0", "beatthis-final0", "beatthis-final0-dbn", "madmom-34"]) if (t36[row.slug]![sys]) readings[sys] = withDuration(t36[row.slug]![sys]!, seconds);
	const g41 = s41[`${row.slug}|beatthis-small0`];
	items.push({
		slug: row.slug,
		set,
		declared: row.bpm && row.meter ? { bpm: row.bpm, meter: row.meter } : null,
		seconds,
		readings,
		grade: g41 ? { study: "41", system: "beatthis-small0", class: g41.class, roots: fmt(g41.roots) } : null,
		census: null,
	});
}
for (const [slug, e] of Object.entries(m43)) {
	if (e.group !== "guitar" || !t43[slug]?.["beatthis-small0"]) continue;
	const bpm = Number(/SS\d-(\d+)-/.exec(slug)?.[1]);
	const g43 = s43[`${slug}|bar`];
	items.push({
		slug,
		set: "guitar",
		declared: { bpm, meter: "4/4" },
		seconds: e.seconds,
		readings: { "beatthis-small0": withDuration(t43[slug]!["beatthis-small0"]!, e.seconds) },
		grade: g43 ? { study: "43", system: "beatthis-small0", class: g43.class, roots: fmt(g43.roots) } : null,
		census: null,
	});
}
const t36b = read<Tracks>("results/study36b-trackers.json");
const m36b = read<{ entries: Record<string, { bpm: number; meter: string; regular?: { seconds: number } }> }>("corpus/study36b-manifest.json").entries;
const g36b = read<{ graded: Record<string, Record<string, { strict: boolean; folded: boolean; meterRight: boolean }>> }>("results/study36b.json").graded;
for (const [slug, e] of Object.entries(m36b)) {
	const key = `${slug}|regular`;
	if (!t36b[key]?.["beatthis-small0"] || !e.regular) continue;
	const readings: Record<string, Reading> = {};
	for (const sys of ["beatthis-small0", "beatthis-final0", "madmom-34"]) if (t36b[key]![sys]) readings[sys] = withDuration(t36b[key]![sys]!, e.regular.seconds);
	const c = g36b[key];
	items.push({
		slug,
		set: "census",
		declared: { bpm: e.bpm, meter: e.meter },
		seconds: e.regular.seconds,
		readings,
		grade: null,
		census: c ? Object.fromEntries(Object.entries(c).filter(([k]) => k in readings).map(([k, v]) => [k, { strict: v.strict, folded: v.folded, meterRight: v.meterRight }])) : null,
	});
}
// Study 38's madmom drafts (steady by construction: the DBN): the share cannot separate them, reported as such
const madmomDrafts: { slug: string; arm: string; class: string; share: number | null }[] = [];
for (const [key, c] of Object.entries(s38)) {
	if (!key.includes("|madmom-34") || !c.roots) continue;
	const slug = key.split("|")[0]!;
	const t = t38[slug]?.["madmom-34"];
	if (!t) continue;
	madmomDrafts.push({ slug, arm: c.arm, class: c.class, share: profile(withDuration(t, 0)).shareAsRead });
}

// --- profiles --------------------------------------------------------------
interface Cell {
	slug: string;
	set: Item["set"];
	system: string;
	declared: Item["declared"];
	declaredBars: number | null;
	profile: GridProfile;
	/** |bars − declared| / declared, as read and joined. */
	errAsRead: number | null;
	errJoined: number | null;
	grade: Item["grade"];
	census: { strict: boolean; folded: boolean; meterRight: boolean } | null;
}
const cells: Cell[] = [];
for (const it of items) {
	const declaredBars = it.declared ? it.seconds / declaredBarSec(it.declared.bpm, it.declared.meter) : null;
	for (const [system, r] of Object.entries(it.readings)) {
		const p = profile(r);
		cells.push({
			slug: it.slug,
			set: it.set,
			system,
			declared: it.declared,
			declaredBars: declaredBars === null ? null : Math.round(declaredBars * 10) / 10,
			profile: p,
			errAsRead: declaredBars ? Math.abs(p.barsAsRead - declaredBars) / declaredBars : null,
			errJoined: declaredBars ? Math.abs(p.barsJoined - declaredBars) / declaredBars : null,
			grade: system === it.grade?.system ? it.grade : null,
			census: it.census?.[system] ?? null,
		});
	}
}
const small0 = cells.filter((c) => c.system === "beatthis-small0");
const r2 = (x: number | null | undefined) => (x === null || x === undefined ? null : Math.round(x * 100) / 100);

// --- Ask A: joining ------------------------------------------------------------
console.log("== Ask A: Rule 1, adjacent half bars joined (small0)");
const askA: Record<string, unknown> = {};
for (const set of ["woodward", "mmkk", "guitar", "waltz", "census"] as const) {
	const cs = small0.filter((c) => c.set === set);
	const withJoins = cs.filter((c) => c.profile.joins > 0);
	const toward = cs.filter((c) => c.errAsRead !== null && c.errJoined! < c.errAsRead - 1e-9).length;
	const away = cs.filter((c) => c.errAsRead !== null && c.errJoined! > c.errAsRead + 1e-9).length;
	const joinsTotal = cs.reduce((a, c) => a + c.profile.joins, 0);
	const fourPlus = cs.filter((c) => c.profile.joins >= 4).length;
	askA[set] = { n: cs.length, withJoins: withJoins.length, joinsTotal, fourPlusJoins: fourPlus, towardDeclared: toward, awayFromDeclared: away };
	console.log(`  ${set.padEnd(9)} n ${cs.length}: ${withJoins.length} with joins (${joinsTotal} pairs; ${fourPlus} with 4+); bar count moves toward the declared count on ${toward}, away on ${away}`);
	if (set !== "census")
		for (const c of cs)
			console.log(
				`    ${c.slug.padEnd(26)} bars as read ${c.profile.barsAsRead} joined ${c.profile.barsJoined} declared ${c.declaredBars ?? "-"} | joins ${c.profile.joins} | share ${r2(c.profile.shareAsRead)} -> ${r2(c.profile.shareJoined)} fold ${r2(c.profile.foldShareAsRead)} cv ${r2(c.profile.beatCv)} | ${c.profile.meter} ${c.profile.tempo} ${JSON.stringify(c.profile.counts)}${c.grade ? ` | draft ${c.grade.roots} ${c.grade.class}` : ""}${c.census ? ` | census strict ${c.census.strict} folded ${c.census.folded}` : ""}`,
			);
}
// the census songs that joining moves away from the declared count, listed (the "really two bars" candidates)
const awayList = small0.filter((c) => c.set === "census" && c.errAsRead !== null && c.errJoined! > c.errAsRead + 1e-9).map((c) => ({ slug: c.slug, joins: c.profile.joins, asRead: c.profile.barsAsRead, joined: c.profile.barsJoined, declared: c.declaredBars, meter: c.declared?.meter, bpm: c.declared?.bpm }));
console.log(`  census songs moved away from the declared count by joining: ${awayList.map((a) => `${a.slug} (${a.joins} joins, ${a.asRead}->${a.joined} vs ${a.declared}, ${a.meter} ${a.bpm})`).join("; ") || "none"}`);

// --- Ask B: the steady share ---------------------------------------------------
console.log("\n== Ask B: Rule 2, the steady share against the draft grade (small0 drafts) and the census");
const drafted = small0.filter((c) => c.grade);
for (const c of [...drafted].sort((a, b) => (a.profile.shareJoined ?? 0) - (b.profile.shareJoined ?? 0)))
	console.log(`  ${c.slug.padEnd(26)} share joined ${r2(c.profile.shareJoined)} (as read ${r2(c.profile.shareAsRead)}) fold ${r2(c.profile.foldShareAsRead)} cv ${r2(c.profile.beatCv)} stands ${c.profile.stands} | draft ${c.grade!.roots} ${c.grade!.class} (Study ${c.grade!.study})`);
const sweep = (xs: Cell[], measure: (c: Cell) => number | null, thresholds: number[], below: boolean, bad: (c: Cell) => boolean) =>
	thresholds.map((th) => {
		const removed = xs.filter((c) => {
			const v = measure(c);
			return v !== null && (below ? v < th : v > th);
		});
		return { threshold: th, removed: removed.length, badRemoved: removed.filter(bad).length, badTotal: xs.filter(bad).length, goodRemoved: removed.filter((c) => !bad(c)).length };
	});
const ths = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const cvThs = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4];
const badDraft = (c: Cell) => c.grade?.class === "confidently-wrong";
const draftSweep = {
	shareJoined: sweep(drafted, (c) => c.profile.shareJoined, ths, true, badDraft),
	foldShare: sweep(drafted, (c) => c.profile.foldShareAsRead, ths, true, badDraft),
	beatCv: sweep(drafted, (c) => c.profile.beatCv, cvThs, false, badDraft),
};
console.log(`  drafts on small0 bars: ${drafted.length} (${drafted.filter(badDraft).length} confidently-wrong)`);
for (const [name, rows] of Object.entries(draftSweep)) console.log(`  ${name.padEnd(12)} ${rows.map((r) => `${r.threshold}: -${r.removed} (${r.badRemoved} bad, ${r.goodRemoved} not)`).join(" | ")}`);
const census = small0.filter((c) => c.set === "census" && c.census);
const badCensus = (c: Cell) => !c.census!.folded;
const censusSweep = {
	shareJoined: sweep(census, (c) => c.profile.shareJoined, ths, true, badCensus),
	shareAsRead: sweep(census, (c) => c.profile.shareAsRead, ths, true, badCensus),
	foldShare: sweep(census, (c) => c.profile.foldShareAsRead, ths, true, badCensus),
	beatCv: sweep(census, (c) => c.profile.beatCv, cvThs, false, badCensus),
};
console.log(`  census small0 readings: ${census.length} (${census.filter(badCensus).length} with the bar wrong at every fold)`);
for (const [name, rows] of Object.entries(censusSweep)) console.log(`  ${name.padEnd(12)} ${rows.map((r) => `${r.threshold}: -${r.removed} (${r.badRemoved} wrong, ${r.goodRemoved} right)`).join(" | ")}`);
// by declared meter at the app's threshold
const byMeter: Record<string, { n: number; removed: number; removedRight: number; strictKept: number }> = {};
for (const c of census) {
	const m = (byMeter[c.declared!.meter] ??= { n: 0, removed: 0, removedRight: 0, strictKept: 0 });
	m.n++;
	if (!c.profile.stands) {
		m.removed++;
		if (c.census!.folded) m.removedRight++;
	} else if (c.census!.strict) m.strictKept++;
}
console.log(`  at the app's rule (joined share < 0.6), by declared meter: ${JSON.stringify(byMeter)}`);
const final0Census = cells.filter((c) => c.set === "census" && c.system === "beatthis-final0" && c.census);
console.log(`  final0 for contrast: ${final0Census.filter((c) => !c.profile.stands).length} of ${final0Census.length} removed at 0.6, ${final0Census.filter((c) => !c.profile.stands && c.census!.folded).length} of them folded right`);
console.log(`  Study 38's ${madmomDrafts.length} madmom drafts: share 1.0 on ${madmomDrafts.filter((d) => d.share === 1).length} (the DBN makes every bar the usual count); ${madmomDrafts.filter((d) => d.class === "confidently-wrong").length} confidently-wrong among them, none separable by share`);

// --- Ask C: mop heart --------------------------------------------------------------
console.log("\n== Ask C: mop heart (3/4 at 224) and the waltz (3/4 at 141.6), every system");
const askC = cells.filter((c) => c.slug === "mop-heart" || c.slug === "three-oclock-waltz").map((c) => ({ slug: c.slug, system: c.system, declaredBars: c.declaredBars, bars: c.profile.barsAsRead, meter: c.profile.meter, tempo: c.profile.tempo, usual: c.profile.usual, share: r2(c.profile.shareJoined), fold: r2(c.profile.foldShareAsRead), cv: r2(c.profile.beatCv), stands: c.profile.stands, counts: c.profile.counts }));
for (const c of askC) console.log(`  ${c.slug.padEnd(20)} ${c.system.padEnd(20)} bars ${c.bars} (declared ${c.declaredBars}) ${c.meter} at ${c.tempo}, usual ${c.usual}, share ${c.share} fold ${c.fold} cv ${c.cv} stands ${c.stands} ${JSON.stringify(c.counts)}`);
const threeFour = census.filter((c) => c.declared?.meter === "3/4");
console.log(`  census 3/4 songs: ${threeFour.map((c) => `${c.slug} at ${c.declared!.bpm}: small0 share ${r2(c.profile.shareJoined)} strict ${c.census!.strict} folded ${c.census!.folded}`).join("; ") || "none"}`);
// the fast songs in the census (declared beat ≥ 180 bpm): does small0 lose steadiness with speed?
const fast = census.filter((c) => c.declared!.bpm >= 180);
console.log(`  census songs declared at ≥ 180 bpm: ${fast.length}; small0 share median ${r2(fast.map((c) => c.profile.shareJoined!).sort((a, b) => a - b)[fast.length >> 1] ?? null)}, under 0.6 on ${fast.filter((c) => !c.profile.stands).length}, folded right on ${fast.filter((c) => c.census!.folded).length}`);
// the mmkk comparison: the app's counts (its brief) against the bench's small0 readings
const appCounts: Record<string, Record<string, number>> = {
	"eat-all-the-clocks": { "2": 17, "3": 1, "4": 61 },
	"peaceful-dreams": { "2": 11, "3": 3, "4": 131, "7": 1, "8": 2 },
	"letter-lands": { "2": 8, "3": 1, "4": 63 },
	interbellum: { "1": 1, "2": 10, "3": 1, "4": 56, "6": 1 },
	"mop-heart": { "1": 1, "2": 22, "3": 32, "4": 29, "5": 10, "6": 9, "8": 2 },
};
const countsMatch = Object.entries(appCounts).map(([slug, counts]) => ({ slug, match: JSON.stringify(counts) === JSON.stringify(small0.find((c) => c.slug === slug)?.profile.counts) }));
console.log(`\n== the app's port against the package on the five MMKK songs, beats-per-bar counts: ${countsMatch.map((m) => `${m.slug} ${m.match ? "identical" : "DIFFER"}`).join(", ")}`);

writeFileSync(
	`${root}results/study44.json`,
	`${JSON.stringify(
		{
			registered: "docs/BRIEF-STUDY44.md",
			spend: 0,
			cells: cells.map((c) => ({ ...c, errAsRead: r2(c.errAsRead), errJoined: r2(c.errJoined) })),
			askA: { ...askA, censusMovedAway: awayList },
			askB: { draftSweep, censusSweep, byMeterAtRule: byMeter, madmomDrafts },
			askC: { table: askC, censusThreeFour: threeFour.map((c) => c.slug), fastCensus: { n: fast.length, removed: fast.filter((c) => !c.profile.stands).length, foldedRight: fast.filter((c) => c.census!.folded).length } },
			portCountsMatch: countsMatch,
		},
		null,
		"\t",
	)}\n`,
);
console.log(`\nresults/study44.json written (${cells.length} cells, $0)`);
