/**
 * Study 50 (docs/BRIEF-STUDY50.md), $0: how much of the written bass
 * line's failure is the grid's. The same notes (Study 49's, the app's
 * configuration and the selected one) and the same truth, graded on three
 * grids (the tracker's, the tracker's with double beats split, the
 * composer's from the MIDI) under two subdivision rules (per bar, per song).
 *   bun scripts/run-study50.ts            # preflight, then every cell
 *   bun scripts/run-study50.ts --check    # preflight only: no new score is computed
 */
import { readFileSync, writeFileSync } from "node:fs";
import { barsOf, meantNotes, type Note } from "../src/study48/bassLine.js";
import { spanOf } from "../src/study49/grade.js";
import { APP_CONFIG, bassConstrain } from "../src/study49/rules.js";
import { composerGrid, fillBeats, type Grade50, type Grid, gradeLines, gridAgreement, linesOf, type Rule, songMode } from "../src/study50/grid.js";

const root = new URL("../", import.meta.url).pathname;
const checkOnly = process.argv.includes("--check");
const read = <T>(p: string) => JSON.parse(readFileSync(p, "utf8")) as T;
const manifest = read<{ entries: Record<string, { raw: string; midiToMixSec: number; appStemOffset: { offsetSec: number }; tempos: { sec: number; bpm: number }[]; sigs: { sec: number; sig: string }[] }> }>(`${root}corpus/study48-manifest.json`);
const trackerGrids: Record<string, Grid> = { ...read<Record<string, Grid>>(`${root}corpus/study44-app-beats.json`), ...read<Record<string, Grid>>(`${root}corpus/study48-extra-beats.json`) };
const study49 = read<{ partC: { selected: string; configs: Record<string, Record<string, { right: number; oneError: number; wrong: number; truthOnsets: number; found: number; extra: number; gridDiffers: number }>> } }>(`${root}results/study49.json`);
const PIPES = { app: APP_CONFIG.id, selected: study49.partC.selected } as const;
type Pipe = keyof typeof PIPES;
const GRIDS = ["tracker", "filled", "composer"] as const;
type GridName = (typeof GRIDS)[number];
const RULES: Rule[] = ["bar", "song"];
const HELPS = { right: 0.7, wrong: 0.1 };
const D2 = { gain: 0.1, worst: -0.02 };

const slugs = Object.keys(manifest.entries);
const cells: Record<string, Record<GridName, Record<Rule, Record<Pipe, Grade50>>>> = {};
const modes: Record<string, Record<GridName, { truth: string; app: string; selected: string }>> = {};
const partA: Record<string, unknown> = {};
for (const slug of slugs) {
	const e = manifest.entries[slug]!;
	const dir = `${root}${e.raw.slice(0, e.raw.lastIndexOf("/"))}`;
	const tracker = trackerGrids[slug];
	if (!tracker) throw new Error(`no beats for ${slug}`);
	const grids: Record<GridName, Grid> = { tracker, filled: fillBeats(tracker), composer: composerGrid(e.tempos, e.sigs, tracker.duration - e.midiToMixSec, e.midiToMixSec) };
	const truthRaw: Note[] = read<{ notes: { start: number; end: number; pitch: number }[] }>(`${dir}/midi-notes.json`).notes.map((n) => ({ start: n.start + e.midiToMixSec, end: n.end + e.midiToMixSec, pitch: n.pitch - 12 }));
	const notes = Object.fromEntries(
		(Object.keys(PIPES) as Pipe[]).map((p) => [
			p,
			bassConstrain(read<[number, number, number, number][]>(`${dir}/study49/${PIPES[p]}.json`).map(([s, d, pitch, a]) => ({ start: s, end: s + d, pitch, amp: a }))).map((n) => ({ ...n, start: n.start + e.appStemOffset.offsetSec, end: n.end + e.appStemOffset.offsetSec })),
		]),
	) as unknown as Record<Pipe, Note[]>;
	cells[slug] = {} as (typeof cells)[string];
	modes[slug] = {} as (typeof modes)[string];
	const tripletBars: Record<string, number> = {};
	for (const gname of GRIDS) {
		const g = grids[gname];
		const bars = barsOf(g.beats, g.downbeats, g.duration);
		const truth = meantNotes(truthRaw, bars);
		const span = spanOf(truth, bars);
		const est = Object.fromEntries((Object.keys(PIPES) as Pipe[]).map((p) => [p, meantNotes(notes[p], bars)])) as Record<Pipe, Note[]>;
		cells[slug]![gname] = {} as Record<Rule, Record<Pipe, Grade50>>;
		modes[slug]![gname] = { truth: songMode(truth, span), app: songMode(est.app, span), selected: songMode(est.selected, span) };
		for (const rule of RULES) {
			const truthLines = linesOf(truth, span, rule);
			if (rule === "bar") tripletBars[gname] = truthLines.filter((l) => l.mode === "triplet").length;
			cells[slug]![gname]![rule] = Object.fromEntries((Object.keys(PIPES) as Pipe[]).map((p) => [p, gradeLines(truthLines, linesOf(est[p], span, rule))])) as Record<Pipe, Grade50>;
		}
	}
	// preflight: the tracker's grid under the per-bar rule is Study 49's Part C, cell for cell
	for (const p of Object.keys(PIPES) as Pipe[]) {
		const mine = cells[slug]!.tracker.bar[p];
		const s49 = study49.partC.configs[PIPES[p]]![slug]!;
		if (mine.right !== s49.right || mine.oneError !== s49.oneError || mine.wrong !== s49.wrong || mine.truthOnsets !== s49.truthOnsets || mine.found !== s49.found || mine.extra !== s49.extra || mine.gridDiffers !== s49.gridDiffers) throw new Error(`${slug} ${p}: the tracker's grid under the per-bar rule does not reproduce Study 49 (${JSON.stringify(mine)} against ${JSON.stringify(s49)})`);
	}
	// Part A: the tracker's grid against the composer's, and the truth against the composer's sixteenths (no transcription)
	const cg = grids.composer;
	const onSixteenth = truthRaw.filter((n) => {
		let k = cg.beats.findIndex((b) => b > n.start) - 1;
		if (k < 0) k = cg.beats.length - 2;
		const len = cg.beats[k + 1]! - cg.beats[k]!;
		const x = ((n.start - cg.beats[k]!) / len) * 4;
		return (Math.abs(x - Math.round(x)) * len) / 4 <= 0.035;
	}).length;
	partA[slug] = { ...gridAgreement(tracker, cg), beatsAddedByFilling: grids.filled.beats.length - tracker.beats.length, truthNotes: truthRaw.length, truthOnAComposerSixteenth: onSixteenth, truthTripletBarsPerBarRule: tripletBars };
}
console.log(`preflight: ${slugs.length} songs; the tracker's grid under the per-bar rule reproduces Study 49's bars for both pipelines`);
if (checkOnly) process.exit(0);

const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(0)} %` : "-");
const pts = (x: number) => `${x >= 0 ? "+" : ""}${(100 * x).toFixed(1)}`;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const right = (g: Grade50) => g.right / Math.max(1, g.bars);
const wrong = (g: Grade50) => g.wrong / Math.max(1, g.bars);

console.log("\n== Part A: the tracker's grid on the composer's (no transcription)");
for (const slug of slugs) {
	const a = partA[slug] as ReturnType<typeof gridAgreement> & { beatsAddedByFilling: number; truthNotes: number; truthOnAComposerSixteenth: number; truthTripletBarsPerBarRule: Record<string, number> };
	console.log(`${slug.padEnd(18)} tracker beats on a composer's beat ${pct(a.trackerBeatsOnABeat, a.trackerBeats)} of ${a.trackerBeats}; composer's beats untracked ${pct(a.composerBeatsUntracked, a.composerBeats)} of ${a.composerBeats}; filling adds ${a.beatsAddedByFilling}; tracker bar lines on a composer's ${pct(a.trackerDownbeatsOnADownbeat, a.trackerDownbeats)} of ${a.trackerDownbeats}; composer's bar lines tracked ${pct(a.composerDownbeatsTracked, a.composerDownbeats)} of ${a.composerDownbeats}; truth on a composer's sixteenth ${pct(a.truthOnAComposerSixteenth, a.truthNotes)}; truth triplet bars (per-bar rule) ${GRIDS.map((g) => `${g} ${a.truthTripletBarsPerBarRule[g]}`).join(", ")}`);
}

console.log("\n== bars right / wrong, slot F, bars on different subdivisions; per grid and rule");
for (const p of Object.keys(PIPES) as Pipe[]) {
	console.log(`-- ${p} (${PIPES[p]})`);
	for (const slug of slugs) {
		console.log(`${slug.padEnd(18)} ${GRIDS.map((g) => `${g}: ${RULES.map((r) => {
			const c = cells[slug]![g]![r]![p]!;
			return `${r} ${pct(c.right, c.bars)}/${pct(c.wrong, c.bars)} of ${c.bars} F ${c.slotF.toFixed(3)} d${c.gridDiffers}`;
		}).join("; ")}`).join(" | ")}`);
	}
	console.log(`${"mean bars right".padEnd(18)} ${GRIDS.map((g) => `${g}: ${RULES.map((r) => `${r} ${(100 * mean(slugs.map((s) => right(cells[s]![g]![r]![p]!)))).toFixed(1)} %`).join("; ")}`).join(" | ")}`);
}
console.log(`\nsong-level subdivision chosen: ${slugs.map((s) => `${s} ${GRIDS.map((g) => `${g} ${modes[s]![g]!.truth}/${modes[s]![g]!.app}/${modes[s]![g]!.selected}`).join(", ")}`).join(" | ")} (truth/app/selected)`);

// ---- predictions
console.log("\n== predictions");
const sel = (s: string, g: GridName, r: Rule) => cells[s]![g]![r]!.selected;
const p1 = slugs.every((s) => GRIDS.every((g) => modes[s]![g]!.truth === "straight" && modes[s]![g]!.app === "straight" && modes[s]![g]!.selected === "straight"));
console.log(`P1 (the per-song rule chooses sixteenths for the truth and both transcriptions on every song and grid): ${p1 ? "PASS" : "FAIL"}`);
const ruleGain = slugs.map((s) => right(sel(s, "tracker", "song")) - right(sel(s, "tracker", "bar")));
console.log(`P2 (on the tracker's grid the per-song rule raises bars right on at least five of six songs): ${slugs.map((s, i) => `${s} ${pts(ruleGain[i]!)}`).join(", ")} -> ${ruleGain.filter((x) => x > 0).length >= 5 ? "PASS" : "FAIL"}`);
const gridGain = slugs.map((s) => right(sel(s, "composer", "song")) - right(sel(s, "tracker", "song")));
console.log(`P3 (the composer's grid gains between 5 and 10 points of mean bars right over the tracker's, per-song rule): ${slugs.map((s, i) => `${s} ${pts(gridGain[i]!)}`).join(", ")}; mean ${pts(mean(gridGain))} -> ${mean(gridGain) >= 0.05 && mean(gridGain) <= 0.1 ? "PASS" : "FAIL"}`);
const top = slugs[gridGain.indexOf(Math.max(...gridGain))]!;
console.log(`P4 (the largest gain is Mop Heart's or Downline's): ${top} -> ${top === "mop-heart" || top === "downline" ? "PASS" : "FAIL"}`);
const fillGain = slugs.map((s) => right(sel(s, "filled", "song")) - right(sel(s, "tracker", "song")));
console.log(`P5 (splitting the tracker's double beats moves mean bars right by under 2 points): ${slugs.map((s, i) => `${s} ${pts(fillGain[i]!)}`).join(", ")}; mean ${pts(mean(fillGain))} -> ${Math.abs(mean(fillGain)) < 0.02 ? "PASS" : "FAIL"}`);
const fifty = slugs.filter((s) => right(sel(s, "composer", "song")) >= 0.5).length;
const clearing = slugs.filter((s) => right(sel(s, "composer", "song")) >= HELPS.right && wrong(sel(s, "composer", "song")) <= HELPS.wrong);
console.log(`P6 (on the composer's grid the line reaches 50 % bars right on at least four of six songs and clears Study 48's bar on at most one): ${slugs.map((s) => `${s} ${pct(sel(s, "composer", "song").right, sel(s, "composer", "song").bars)} right ${pct(sel(s, "composer", "song").wrong, sel(s, "composer", "song").bars)} wrong`).join(", ")} -> ${fifty >= 4 && clearing.length <= 1 ? "PASS" : "FAIL"}`);

// ---- decisions
console.log("\n== decisions");
const d1 = ruleGain.filter((x) => x > 0).length >= 5 && ruleGain.every((x) => x >= 0) && slugs.every((s) => modes[s]!.composer.truth === "straight") && slugs.every((s) => GRIDS.every((g) => modes[s]![g]!.selected === modes[s]![g]!.truth && modes[s]![g]!.app === modes[s]![g]!.truth));
console.log(`S50-D1 (choose the subdivision once for the song: bars right up on five of six on the tracker's grid, down on none, the truth in sixteenths on the composer's grid, and the transcription's choice the truth's everywhere): ${d1 ? "recommend the per-song rule" : "keep the per-bar rule"}`);
const d2 = mean(gridGain) >= D2.gain && Math.min(...gridGain) >= D2.worst;
const share = mean(gridGain) > 0 ? mean(fillGain) / mean(gridGain) : 0;
console.log(`S50-D2 (the grid is a bottleneck: the composer's grid gains 10 points of mean bars right, no song down more than 2): mean ${pts(mean(gridGain))}, worst ${pts(Math.min(...gridGain))} -> ${d2 ? "yes" : "no"}; splitting double beats recovers ${(100 * share).toFixed(0)} % of the composer's gain`);
console.log(`S50-D3 (Study 48's bar on the composer's grid, per-song rule, selected notes): cleared on ${clearing.length ? clearing.join(", ") : "no song"}; ${clearing.length === slugs.length ? "the line can be shown on a true grid" : "not on every song"}`);

writeFileSync(`${root}results/study50.json`, `${JSON.stringify({ registered: "docs/BRIEF-STUDY50.md", spend: 0, pipelines: PIPES, bounds: { helps: HELPS, d2: D2 }, partA, modes, cells, gains: { rule: Object.fromEntries(slugs.map((s, i) => [s, ruleGain[i]])), composer: Object.fromEntries(slugs.map((s, i) => [s, gridGain[i]])), filled: Object.fromEntries(slugs.map((s, i) => [s, fillGain[i]])) }, decisions: { d1, d2, filledShare: share, clears: clearing } }, null, "\t")}\n`);
console.log(`\nresults/study50.json written (${slugs.length} songs, ${GRIDS.length} grids, ${RULES.length} rules, 2 pipelines, $0)`);
