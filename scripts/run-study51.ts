/**
 * Study 51 (docs/BRIEF-STUDY51.md), $0: can the app tell, without truth,
 * which bars of the transcribed bass line to show? Each bar of the line
 * (Study 49's selected configuration) is trusted when other readings of
 * the same stem write it identically; the trusted bars are then graded
 * against the truth with Study 48's bar grade.
 *   bun scripts/run-study51.ts            # preflight, then every rule
 *   bun scripts/run-study51.ts --check    # preflight only: no new score is computed
 */
import { readFileSync, writeFileSync } from "node:fs";
import { barsOf, meantNotes, type Note, quantizeBar } from "../src/study48/bassLine.js";
import { spanOf } from "../src/study49/grade.js";
import { APP_CONFIG, bassConstrain } from "../src/study49/rules.js";
import { addBar, coverage, emptyScore, precision, RULES, type RuleName, type TrustScore, trusts, wrongShare } from "../src/study51/trust.js";

const root = new URL("../", import.meta.url).pathname;
const checkOnly = process.argv.includes("--check");
const read = <T>(p: string) => JSON.parse(readFileSync(p, "utf8")) as T;
type Grid = { beats: number[]; downbeats: number[]; duration: number };
const manifest = read<{ entries: Record<string, { raw: string; midiToMixSec: number; appStemOffset: { offsetSec: number } }> }>(`${root}corpus/study48-manifest.json`);
const grids: Record<string, Grid> = { ...read<Record<string, Grid>>(`${root}corpus/study44-app-beats.json`), ...read<Record<string, Grid>>(`${root}corpus/study48-extra-beats.json`) };
const study49 = read<{ partC: { selected: string; configs: Record<string, Record<string, { bars: number; right: number; oneError: number; wrong: number }>> } }>(`${root}results/study49.json`);
const SHOWN = study49.partC.selected;
if (SHOWN !== "o50-f30-n11-i0-m0") throw new Error(`the registered readings assume Study 49 selected o50-f30-n11-i0-m0, not ${SHOWN}`);
const READINGS = { shown: SHOWN, app: APP_CONFIG.id, frame: "o50-f20-n11-i0-m0", short: "o50-f30-n6-i0-m0" } as const;
/** The registered bar for showing a bar: Study 48's, among the bars shown, and a floor on how many are shown. */
const BAR = { right: 0.7, wrong: 0.1, coverage: 0.25 };

const slugs = Object.keys(manifest.entries);
const scores: Record<string, Record<RuleName, TrustScore>> = {};
for (const slug of slugs) {
	const e = manifest.entries[slug]!;
	const dir = `${root}${e.raw.slice(0, e.raw.lastIndexOf("/"))}`;
	const g = grids[slug]!;
	const bars = barsOf(g.beats, g.downbeats, g.duration);
	const truth = meantNotes(
		read<{ notes: { start: number; end: number; pitch: number }[] }>(`${dir}/midi-notes.json`).notes.map((n) => ({ start: n.start + e.midiToMixSec, end: n.end + e.midiToMixSec, pitch: n.pitch - 12 })),
		bars,
	);
	const span = spanOf(truth, bars);
	const bp = (id: string): Note[] =>
		meantNotes(
			bassConstrain(read<[number, number, number, number][]>(`${dir}/study49/${id}.json`).map(([s, d, p, a]) => ({ start: s, end: s + d, pitch: p, amp: a }))).map((n) => ({ ...n, start: n.start + e.appStemOffset.offsetSec, end: n.end + e.appStemOffset.offsetSec })),
			bars,
		);
	const notes = { shown: bp(READINGS.shown), app: bp(READINGS.app), frame: bp(READINGS.frame), short: bp(READINGS.short), pyin: meantNotes(read<Note[]>(`${dir}/notes-pyin-mix.json`), bars) };
	scores[slug] = Object.fromEntries(RULES.map((r) => [r, emptyScore()])) as Record<RuleName, TrustScore>;
	for (const bar of span) {
		const tl = quantizeBar(truth, bar);
		const r = { shown: quantizeBar(notes.shown, bar), app: quantizeBar(notes.app, bar), frame: quantizeBar(notes.frame, bar), short: quantizeBar(notes.short, bar), pyin: quantizeBar(notes.pyin, bar) };
		const t = trusts(r);
		for (const rule of RULES) addBar(scores[slug]![rule]!, tl, r.shown, t[rule]);
	}
	// preflight: showing every bar is Study 49's selected configuration, bar for bar
	const all = scores[slug]!.everyBar;
	const s49 = study49.partC.configs[SHOWN]![slug]!;
	if (all.bars + all.rests !== s49.bars || all.right + all.restsRight !== s49.right || all.right + all.oneError + all.wrong !== all.shown || all.shown !== all.bars) throw new Error(`${slug}: showing every bar does not reproduce Study 49 (${JSON.stringify(all)} against ${JSON.stringify(s49)})`);
}
console.log(`preflight: ${slugs.length} songs; showing every bar reproduces Study 49's bars and bars right for ${SHOWN}`);
if (checkOnly) process.exit(0);

const pct = (x: number) => `${(100 * x).toFixed(0)} %`;
const pooled = Object.fromEntries(
	RULES.map((r) => {
		const s = emptyScore();
		for (const slug of slugs) for (const k of Object.keys(s) as (keyof TrustScore)[]) s[k] += scores[slug]![r]![k];
		return [r, s];
	}),
) as Record<RuleName, TrustScore>;
for (const rule of RULES) {
	console.log(`\n== ${rule}`);
	for (const slug of [...slugs, "pooled"]) {
		const s = slug === "pooled" ? pooled[rule] : scores[slug]![rule]!;
		console.log(`${slug.padEnd(18)} shows ${String(s.shown).padStart(3)} of ${String(s.bars).padStart(3)} bars with notes (${pct(coverage(s)).padStart(5)}): right ${pct(precision(s)).padStart(5)}, one error ${pct(s.shown ? s.oneError / s.shown : 0).padStart(5)}, wrong ${pct(wrongShare(s)).padStart(5)} | rests shown ${s.rests}, ${s.restsRight} right | of the part's ${s.truthOnsets} notes, ${pct(s.notesShownRight / Math.max(1, s.truthOnsets))} written right`);
	}
}

console.log("\n== predictions");
const lifts = (rule: RuleName) => slugs.every((s) => precision(scores[s]![rule]!) > precision(scores[s]!.everyBar));
console.log(`P1 (the bars trusted by loosened, by pyin and by all are right more often than every bar, on every song): loosened ${lifts("loosened")}, pyin ${lifts("pyin")}, all ${lifts("all")} -> ${lifts("loosened") && lifts("pyin") && lifts("all") ? "PASS" : "FAIL"}`);
const p2 = slugs.filter((s) => precision(scores[s]!.all) >= 0.7).length;
console.log(`P2 (the bars trusted by all are at least 70 % right on at least five of six songs): ${slugs.map((s) => `${s} ${pct(precision(scores[s]!.all))}`).join(", ")} -> ${p2 >= 5 ? "PASS" : "FAIL"}`);
const p3 = slugs.filter((s) => coverage(scores[s]!.all) < 0.25).length;
console.log(`P3 (all shows under a quarter of the bars on at least three songs): ${slugs.map((s) => `${s} ${pct(coverage(scores[s]!.all))}`).join(", ")} -> ${p3 >= 3 ? "PASS" : "FAIL"}`);
console.log(`P4 (pooled, agreement with pYIN is right more often than stability under loosening): pyin ${pct(precision(pooled.pyin))}, loosened ${pct(precision(pooled.loosened))} -> ${precision(pooled.pyin) > precision(pooled.loosened) ? "PASS" : "FAIL"}`);
const meets = (rule: RuleName) => slugs.every((s) => precision(scores[s]![rule]!) >= BAR.right && wrongShare(scores[s]![rule]!) <= BAR.wrong && coverage(scores[s]![rule]!) >= BAR.coverage);
const qualifying = RULES.filter((r) => r !== "everyBar" && meets(r));
console.log(`P5 (no rule meets the bar on every song): ${qualifying.length ? qualifying.join(", ") : "none"} -> ${qualifying.length === 0 ? "PASS" : "FAIL"}`);

console.log("\n== decision");
const pick = qualifying.sort((a, b) => coverage(pooled[b]) - coverage(pooled[a]))[0] ?? null;
for (const rule of RULES) console.log(`  ${rule.padEnd(9)} songs at 70 % right ${slugs.filter((s) => precision(scores[s]![rule]!) >= BAR.right).length}, at 10 % wrong or under ${slugs.filter((s) => wrongShare(scores[s]![rule]!) <= BAR.wrong).length}, showing a quarter or more ${slugs.filter((s) => coverage(scores[s]![rule]!) >= BAR.coverage).length}; all three ${slugs.filter((s) => precision(scores[s]![rule]!) >= BAR.right && wrongShare(scores[s]![rule]!) <= BAR.wrong && coverage(scores[s]![rule]!) >= BAR.coverage).length} of ${slugs.length}`);
console.log(`S51-D1 (show only trusted bars: on every song at least 70 % of shown bars right, at most 10 % wrong, at least a quarter of the bars shown): ${pick ? `recommend ${pick}` : "no rule recommended"}`);

writeFileSync(`${root}results/study51.json`, `${JSON.stringify({ registered: "docs/BRIEF-STUDY51.md", spend: 0, readings: { ...READINGS, pyin: "Study 48's pYIN notes" }, bar: BAR, songs: scores, pooled, decision: pick }, null, "\t")}\n`);
console.log(`\nresults/study51.json written (${slugs.length} songs, ${RULES.length - 1} rules and the baseline, $0)`);
