/**
 * Study 35 regrade (2026-11-09, $0): the original run graded tier-3
 * roots without applying the calibrated transposition, so the four
 * capo slots (+5/+7/+2/+5) were scored against shape roots instead of
 * sounding roots (defect disclosed in docs/BRIEF-STUDY35.md). The
 * drafts themselves are untouched; this re-parses each persisted
 * rawDraft and regrades with sequenceScoreTransposed, recomputing
 * classes and gates. Interval-invariant and transpose-0 slots are
 * regraded by the same code path and must reproduce their numbers.
 */
import { readFileSync, writeFileSync } from "node:fs";
import * as v from "valibot";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { expandChords } from "../src/study23/grade23.js";
import { familyOf, sequenceScore, sequenceScoreIntervals, sequenceScoreTransposed } from "../src/study34/grade34.js";

const root = new URL("../", import.meta.url).pathname;
const data = JSON.parse(readFileSync(`${root}results/study35.json`, "utf8")) as {
	results: Record<string, Record<string, unknown>>;
	auto: Record<string, unknown>;
	gates: Record<string, unknown>;
	tokensIn: number;
	tokensOut: number;
	spend: number;
	model: string;
};

const SLOTS = [
	"jw-same-boat",
	"jw-gravity",
	"jw-my-favorite-regret",
	"jw-california-lullabye",
	"jw-swansong",
	"jw-afterglow",
	"jw-cherubs",
	"jw-goodbye-to-spring",
	"jw-im-letting-go",
];

for (const slug of SLOTS) {
	const rec = data.results[slug]!;
	const truth = JSON.parse(
		readFileSync(
			slug === "jw-same-boat" ? `${root}corpus/study34-truth/jw-same-boat.truth.json` : `${root}corpus/study35-truth/${slug}.truth.json`,
			"utf8",
		),
	) as { sections: Record<string, string[]>; transposition: { value: number | null } };
	const json = (rec.rawDraft as string).match(/\{[\s\S]*\}/)?.[0];
	const parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
	if (!parsed?.success) throw new Error(`${slug}: persisted draft no longer parses`);
	const expanded = expandChords(parsed.output.chords);
	const published = Object.values(truth.sections).flat();
	const invariant = truth.transposition.value === null;
	const before = rec.roots as { right: number; bearing: number };
	const roots = invariant
		? sequenceScoreIntervals(expanded, published)
		: sequenceScoreTransposed(expanded, published, truth.transposition.value ?? 0);
	const quals = sequenceScore(expanded, published, familyOf);
	const qualsBefore = rec.quals as { right: number; bearing: number };
	if (quals.right !== qualsBefore.right || quals.bearing !== qualsBefore.bearing)
		throw new Error(`${slug}: quality regrade diverged (${quals.right}/${quals.bearing} vs ${qualsBefore.right}/${qualsBefore.bearing})`);
	const rootPct = roots.bearing > 0 ? roots.right / roots.bearing : null;
	const qualPct = quals.bearing > 0 ? quals.right / quals.bearing : null;
	const cls =
		rootPct !== null && rootPct < 0.8 ? "confidently-wrong" : rootPct !== null && rootPct >= 0.9 && (qualPct ?? 0) >= 0.8 ? "good" : "saved-below-threshold";
	const holds = rec.holds as { gridDrift: boolean; thinNotes: boolean };
	rec.roots = roots;
	rec.class = cls;
	rec.verdict = holds.gridDrift || holds.thinNotes ? "held" : "saved";
	rec.regrade = {
		date: "2026-11-09",
		rootsBefore: before,
		transposeApplied: invariant ? null : (truth.transposition.value ?? 0),
	};
	console.log(
		`${slug}: roots ${before.right}/${before.bearing} -> ${roots.right}/${roots.bearing} (${invariant ? "intervals, unchanged path" : `transpose ${truth.transposition.value ?? 0}`}) -> ${cls}`,
	);
}

const tenSlugs = ["jw-let-it-in", ...SLOTS];
const recOf = (s: string) => data.results[s] as { class?: string; verdict?: string; roots?: { right: number; bearing: number } };
const g1 = tenSlugs.every((s) => !(recOf(s).class === "confidently-wrong" && recOf(s).verdict === "saved"));
const goodCount = tenSlugs.filter((s) => recOf(s).class === "good").length;
const g2 = goodCount >= 7;
const heldGood = tenSlugs.filter((s) => {
	const r = recOf(s);
	const pct = r.roots && r.roots.bearing > 0 ? r.roots.right / r.roots.bearing : null;
	return r.verdict === "held" && pct !== null && pct >= 0.8;
}).length;
const g3 = heldGood <= 1;
const autoRows = Object.entries(data.auto) as [string, { tempoRight: boolean; refused: boolean }][];
const wrongPassed = autoRows.filter(([, a]) => !a.tempoRight && !a.refused).map(([s]) => s);
const refuseRate = autoRows.filter(([, a]) => a.refused).length;
data.gates = { g1, g2, g3, goodCount, heldGood, refuseRate, wrongPassed, regraded: "2026-11-09" };
console.log(`\nS35-G1: ${g1 ? "PASS" : "FAIL"} [${tenSlugs.map((s) => `${recOf(s).class}/${recOf(s).verdict}`).join(", ")}]`);
console.log(`S35-G2: ${g2 ? "PASS" : "FAIL"} (${goodCount}/10)`);
console.log(`S35-G3: ${g3 ? "PASS" : "FAIL"} (${heldGood} held good/near-good)`);
console.log(`S35-G4 (reported): refuses ${refuseRate}/10; wrong passing: ${wrongPassed.length === 0 ? "none" : wrongPassed.join(", ")}`);
writeFileSync(`${root}results/study35.json`, `${JSON.stringify(data, null, "\t")}\n`);
console.log("results/study35.json rewritten");
