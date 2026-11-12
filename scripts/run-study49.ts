/**
 * Study 49 (docs/BRIEF-STUDY49.md), $0: where the written bass line's
 * extra and missed onsets come from, and whether Basic Pitch's own knobs
 * or two filters on its notes buy bars. Grading is Study 48's, unchanged.
 * Needs scripts/study49-transcribe.ts to have written each configuration's
 * notes, and Study 48's note lists (scripts/study48-notes.py).
 *   bun scripts/run-study49.ts            # preflight, then every part
 *   bun scripts/run-study49.ts --check    # preflight only: no new score is computed
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { type Bar, type BarLine, barsOf, meantNotes, type Note, quantizeBar } from "../src/study48/bassLine.js";
import { type Attribution, attribute, EXTRA_CLASSES, FEATURES, gradeLine, type LineGrade, lostBy, MISS_CLASSES, spanOf, type TruthNote } from "../src/study49/grade.js";
import { APP_CONFIG, type AmpNote, applyRules, bassConstrain, beatLengthAt, bpConfigs, FLOORS, MERGE_WINDOWS } from "../src/study49/rules.js";

const root = new URL("../", import.meta.url).pathname;
const checkOnly = process.argv.includes("--check");
const read = <T>(p: string) => JSON.parse(readFileSync(p, "utf8")) as T;
type Grid = { beats: number[]; downbeats: number[]; duration: number };
const manifest = read<{ entries: Record<string, { raw: string; label: string; midiToMixSec: number; appStemOffset: { offsetSec: number }; sigs: { sig: string }[] }> }>(`${root}corpus/study48-manifest.json`);
const grids: Record<string, Grid> = { ...read<Record<string, Grid>>(`${root}corpus/study44-app-beats.json`), ...read<Record<string, Grid>>(`${root}corpus/study48-extra-beats.json`) };
const study48 = read<{ songs: Record<string, Record<string, { bars: number; right: number; oneError: number; wrong: number; truthNotes: number; rhythmRight: number; pitchRight: number }>> }>(`${root}results/study48.json`);
const CONFIGS = bpConfigs();
const SETTINGS: { id: string; window: number | null; floor: number | null }[] = [];
for (const window of [null, ...MERGE_WINDOWS]) for (const floor of [null, ...FLOORS]) SETTINGS.push({ id: `w${window ?? "off"}-f${floor ?? "off"}`, window, floor });
/** Registered bounds. */
const LOSS_BOUND = 0.03;
const D1 = { gain: 0.1, worst: -0.02, heldOut: 5 };
const D2 = { gain: 0.05, worst: -0.02 };
const HELPS = { right: 0.7, wrong: 0.1 };

interface Song {
	slug: string;
	fourFour: boolean;
	bars: Bar[];
	span: Bar[];
	truth: TruthNote[];
	truthLines: BarLine[];
	beatLen: (t: number) => number;
	/** Per configuration: the bass-constrained notes on the mix timeline. */
	notes: Record<string, AmpNote[]>;
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const songs: Song[] = [];
for (const [slug, e] of Object.entries(manifest.entries)) {
	const dir = `${root}${e.raw.slice(0, e.raw.lastIndexOf("/"))}`;
	const grid = grids[slug];
	if (!grid) throw new Error(`no beats for ${slug}`);
	const bars = barsOf(grid.beats, grid.downbeats, grid.duration);
	// the truth: the MIDI an octave down on the mix timeline, with its velocities; must equal the list Study 48 graded
	const midi = read<{ notes: { start: number; end: number; pitch: number; vel: number }[] }>(`${dir}/midi-notes.json`).notes;
	const truthRaw: TruthNote[] = midi.map((n) => ({ start: n.start + e.midiToMixSec, end: n.end + e.midiToMixSec, pitch: n.pitch - 12, vel: n.vel }));
	const truth48 = read<Note[]>(`${dir}/truth-mix.json`);
	if (truth48.length !== truthRaw.length || truth48.some((n, i) => !close(n.start, truthRaw[i]!.start) || !close(n.end, truthRaw[i]!.end) || n.pitch !== truthRaw[i]!.pitch)) throw new Error(`${slug}: the truth is not Study 48's`);
	const truth = meantNotes(truthRaw, bars) as TruthNote[];
	const span = spanOf(truth, bars);
	const truthLines = span.map((b) => quantizeBar(truth, b));
	const notes: Record<string, AmpNote[]> = {};
	for (const c of CONFIGS) {
		const file = `${dir}/study49/${c.id}.json`;
		if (!existsSync(file)) throw new Error(`run scripts/study49-transcribe.ts first (${slug} ${c.id})`);
		const rows = read<[number, number, number, number][]>(file);
		if (c.id === APP_CONFIG.id) {
			// the cached posteriors must give back the notes the app's call gave Study 48
			const bp = read<[number, number, number, number][]>(`${dir}/bp-notes.json`);
			if (bp.length !== rows.length || bp.some((r, i) => !close(r[0], rows[i]![0]) || !close(r[1], rows[i]![1]) || r[2] !== rows[i]![2] || Math.abs(r[3] - rows[i]![3]) > 1e-5)) throw new Error(`${slug}: the app configuration does not reproduce Study 48's Basic Pitch notes`);
		}
		notes[c.id] = bassConstrain(rows.map(([s, d, p, a]) => ({ start: s, end: s + d, pitch: p, amp: a }))).map((n) => ({ ...n, start: n.start + e.appStemOffset.offsetSec, end: n.end + e.appStemOffset.offsetSec }));
	}
	// the port of the bass constraint must give back Study 48's bp-bass notes, and this grader its bars
	const bass48 = read<Note[]>(`${dir}/notes-bp-bass-mix.json`);
	const mine = notes[APP_CONFIG.id]!;
	if (bass48.length !== mine.length || bass48.some((n, i) => !close(n.start, mine[i]!.start) || !close(n.end, mine[i]!.end) || n.pitch !== mine[i]!.pitch)) throw new Error(`${slug}: the bass constraint's port does not reproduce Study 48's notes`);
	const g = gradeLine(truthLines, meantNotes(mine, bars), span);
	const s48 = study48.songs[slug]!["bp-bass"]!;
	if (g.bars !== s48.bars || g.right !== s48.right || g.oneError !== s48.oneError || g.wrong !== s48.wrong || g.truthOnsets !== s48.truthNotes || g.found !== s48.rhythmRight || g.pitchRight !== s48.pitchRight) throw new Error(`${slug}: this grader does not reproduce Study 48's bars (${JSON.stringify({ ...g, foundKeys: undefined })} against ${JSON.stringify(s48)})`);
	songs.push({ slug, fourFour: e.sigs.every((s) => s.sig === "4/4"), bars, span, truth, truthLines, beatLen: beatLengthAt(bars), notes });
}
console.log(`preflight: ${songs.length} songs; the truth, the app configuration's notes, the bass constraint and the bar grades all reproduce Study 48`);
if (checkOnly) process.exit(0);

const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(0)} %` : "-");
const pts = (x: number) => `${x >= 0 ? "+" : ""}${(100 * x).toFixed(1)}`;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const rightShare = (g: LineGrade) => g.right / Math.max(1, g.bars);
const wrongShare = (g: LineGrade) => g.wrong / Math.max(1, g.bars);
const plain = (g: LineGrade) => ({ bars: g.bars, right: g.right, oneError: g.oneError, wrong: g.wrong, truthOnsets: g.truthOnsets, found: g.found, pitchRight: g.pitchRight, missing: g.missing, extra: g.extra, gridDiffers: g.gridDiffers });
const grade = (s: Song, notes: Note[]) => gradeLine(s.truthLines, meantNotes(notes, s.bars), s.span);
/** The best of a set by mean bars right over the given songs; ties to the lower mean wrong share, then the earlier in the registered order. */
function select<T extends string>(ids: T[], grades: Record<string, Record<string, LineGrade>>, over: Song[]): T {
	let best = ids[0]!;
	const score = (id: string) => [mean(over.map((s) => rightShare(grades[id]![s.slug]!))), -mean(over.map((s) => wrongShare(grades[id]![s.slug]!)))] as const;
	for (const id of ids.slice(1)) {
		const [a, b] = score(id);
		const [c, d] = score(best);
		if (a > c + 1e-12 || (Math.abs(a - c) <= 1e-12 && b > d + 1e-12)) best = id;
	}
	return best;
}

// ---- Part A: where the extras and the misses come from (the app's configuration, bass-constrained)
console.log("\n== Part A: attribution, the app's configuration");
const partA: Record<string, Attribution> = {};
for (const s of songs) {
	const est = meantNotes(s.notes[APP_CONFIG.id]!, s.bars);
	const a = attribute(s.truth, s.truthLines, est, s.span, s.beatLen);
	partA[s.slug] = a;
	const ex = EXTRA_CLASSES.reduce((n, c) => n + a.extras[c], 0);
	const mi = MISS_CLASSES.reduce((n, c) => n + a.misses[c], 0);
	console.log(`${s.slug}: extras ${ex}: ${EXTRA_CLASSES.map((c) => `${c} ${a.extras[c]}`).join(", ")}`);
	console.log(`  misses ${mi}: ${MISS_CLASSES.map((c) => `${c} ${a.misses[c]}`).join(", ")}`);
	console.log(`  miss rate with / without: ${FEATURES.map((f) => `${f} ${pct(a.features[f].withMissed, a.features[f].with)} of ${a.features[f].with} / ${pct(a.features[f].withoutMissed, a.features[f].without)} of ${a.features[f].without}`).join("; ")}`);
}

// ---- Part C: Basic Pitch's own knobs
console.log("\n== Part C: Basic Pitch's knobs (every configuration bass-constrained)");
const partC: Record<string, Record<string, LineGrade>> = {};
for (const c of CONFIGS) {
	partC[c.id] = {};
	for (const s of songs) partC[c.id]![s.slug] = grade(s, s.notes[c.id]!);
}
const app = partC[APP_CONFIG.id]!;
const cIds = CONFIGS.map((c) => c.id);
for (const c of CONFIGS) console.log(`  ${c.id.padEnd(18)} mean right ${(100 * mean(songs.map((s) => rightShare(partC[c.id]![s.slug]!)))).toFixed(1)} %, mean wrong ${(100 * mean(songs.map((s) => wrongShare(partC[c.id]![s.slug]!)))).toFixed(1)} % | ${songs.map((s) => pct(partC[c.id]![s.slug]!.right, partC[c.id]![s.slug]!.bars)).join(" ")}`);
// main effects: each knob's alternative against the app's value, the other four knobs held, averaged over their 16 settings
const KNOBS = [
	{ name: "onset 0.35", is: (c: (typeof CONFIGS)[number]) => c.onset === 0.35, flip: (id: string) => id.replace("o35", "o50") },
	{ name: "frame 0.2", is: (c: (typeof CONFIGS)[number]) => c.frame === 0.2, flip: (id: string) => id.replace("f20", "f30") },
	{ name: "minLen 6", is: (c: (typeof CONFIGS)[number]) => c.minLen === 6, flip: (id: string) => id.replace("n6", "n11") },
	{ name: "infer off", is: (c: (typeof CONFIGS)[number]) => !c.infer, flip: (id: string) => id.replace("i0", "i1") },
	{ name: "melodia off", is: (c: (typeof CONFIGS)[number]) => !c.melodia, flip: (id: string) => id.replace("m0", "m1") },
];
const effects: Record<string, Record<string, { right: number; found: number; extra: number }>> = {};
console.log("  main effects (alternative minus the app's value; bars right in points, found and extra onsets as a share of truth onsets):");
for (const k of KNOBS) {
	effects[k.name] = {};
	for (const s of songs) {
		const pairs = CONFIGS.filter(k.is).map((c) => [partC[c.id]![s.slug]!, partC[k.flip(c.id)]![s.slug]!] as const);
		effects[k.name]![s.slug] = { right: mean(pairs.map(([a, b]) => rightShare(a) - rightShare(b))), found: mean(pairs.map(([a, b]) => (a.found - b.found) / a.truthOnsets)), extra: mean(pairs.map(([a, b]) => (a.extra - b.extra) / a.truthOnsets)) };
	}
	console.log(`  ${k.name.padEnd(12)} ${songs.map((s) => `${s.slug.slice(0, 8)} right ${pts(effects[k.name]![s.slug]!.right)} found ${pts(effects[k.name]![s.slug]!.found)} extra ${pts(effects[k.name]![s.slug]!.extra)}`).join(" | ")}`);
}
const cBest = select(cIds, partC, songs);
const cGain = songs.map((s) => rightShare(partC[cBest]![s.slug]!) - rightShare(app[s.slug]!));
const cHeldOut = songs.map((s) => {
	const pick = select(
		cIds,
		partC,
		songs.filter((o) => o !== s),
	);
	return { slug: s.slug, pick, gain: rightShare(partC[pick]![s.slug]!) - rightShare(app[s.slug]!) };
});
console.log(`  selected: ${cBest}; gain per song ${songs.map((s, i) => `${s.slug} ${pts(cGain[i]!)}`).join(", ")}; mean ${pts(mean(cGain))}`);
console.log(`  held out: ${cHeldOut.map((h) => `${h.slug} ${h.pick} ${pts(h.gain)}`).join("; ")}`);

// ---- Part B: the two filters, on the app's notes and on the selected configuration's
function partB(configId: string) {
	const grades: Record<string, Record<string, LineGrade>> = {};
	const lost: Record<string, Record<string, number>> = {};
	for (const st of SETTINGS) {
		grades[st.id] = {};
		lost[st.id] = {};
		for (const s of songs) {
			const g = grade(s, applyRules(s.notes[configId]!, s.beatLen, st.window, st.floor));
			grades[st.id]![s.slug] = g;
			lost[st.id]![s.slug] = lostBy(grades[SETTINGS[0]!.id]![s.slug] ?? g, g) / Math.max(1, g.truthOnsets);
		}
	}
	const base = grades[SETTINGS[0]!.id]!;
	const allowed = SETTINGS.map((st) => st.id).filter((id) => songs.every((s) => lost[id]![s.slug]! <= LOSS_BOUND));
	const best = select(allowed, grades, songs);
	const gain = songs.map((s) => rightShare(grades[best]![s.slug]!) - rightShare(base[s.slug]!));
	const heldOut = songs.map((s) => {
		const others = songs.filter((o) => o !== s);
		const ok = SETTINGS.map((st) => st.id).filter((id) => others.every((o) => lost[id]![o.slug]! <= LOSS_BOUND));
		const pick = select(ok, grades, others);
		return { slug: s.slug, pick, gain: rightShare(grades[pick]![s.slug]!) - rightShare(base[s.slug]!), lost: lost[pick]![s.slug]! };
	});
	for (const st of SETTINGS) console.log(`  ${st.id.padEnd(16)} mean right ${(100 * mean(songs.map((s) => rightShare(grades[st.id]![s.slug]!)))).toFixed(1)} % | ${songs.map((s) => `${pct(grades[st.id]![s.slug]!.right, grades[st.id]![s.slug]!.bars)} x${grades[st.id]![s.slug]!.extra} lost ${(100 * lost[st.id]![s.slug]!).toFixed(1)}`).join(" | ")}${allowed.includes(st.id) ? "" : "  (over the loss bound)"}`);
	console.log(`  selected within the loss bound: ${best}; gain per song ${songs.map((s, i) => `${s.slug} ${pts(gain[i]!)}`).join(", ")}; mean ${pts(mean(gain))}`);
	console.log(`  held out: ${heldOut.map((h) => `${h.slug} ${h.pick} ${pts(h.gain)}`).join("; ")}`);
	return { grades, lost, best, gain, heldOut };
}
console.log(`\n== Part B on the app's notes (${APP_CONFIG.id}); per song: bars right, extra onsets, truth onsets lost in %`);
const bApp = partB(APP_CONFIG.id);
console.log(`\n== Part B on the selected configuration's notes (${cBest})`);
const bSel = partB(cBest);
const combined = bSel.grades[bSel.best]!;

// ---- predictions
console.log("\n== predictions");
const largestExtra = (a: Attribution) => EXTRA_CLASSES.reduce((x, y) => (a.extras[y] > a.extras[x] ? y : x));
const largestMiss = (a: Attribution) => MISS_CLASSES.reduce((x, y) => (a.misses[y] > a.misses[x] ? y : x));
const p1n = songs.filter((s) => largestExtra(partA[s.slug]!) === "retrigger").length;
console.log(`P1 (re-triggers are the largest class of extra onsets on at least five of six songs): ${songs.map((s) => `${s.slug} ${largestExtra(partA[s.slug]!)}`).join(", ")} -> ${p1n >= 5 ? "PASS" : "FAIL"}`);
const p2a = songs.filter((s) => largestMiss(partA[s.slug]!) === "absorbed").length;
const shortSongs = songs.filter((s) => partA[s.slug]!.features.under130ms.with >= 10);
const p2b = shortSongs.every((s) => {
	const f = partA[s.slug]!.features.under130ms;
	return f.withMissed / f.with >= 2 * (f.withoutMissed / Math.max(1, f.without));
});
console.log(`P2a (absorbed is the largest class of missed onsets on at least four of six songs): ${songs.map((s) => `${s.slug} ${largestMiss(partA[s.slug]!)}`).join(", ")} -> ${p2a >= 4 ? "PASS" : "FAIL"}`);
console.log(`P2b (truth notes under 130 ms are missed at twice the rate of longer ones, on every song with ten or more): ${shortSongs.map((s) => `${s.slug} ${pct(partA[s.slug]!.features.under130ms.withMissed, partA[s.slug]!.features.under130ms.with)} against ${pct(partA[s.slug]!.features.under130ms.withoutMissed, partA[s.slug]!.features.under130ms.without)}`).join(", ") || "no such song"} -> ${shortSongs.length && p2b ? "PASS" : "FAIL"}`);
const p3a = songs.filter((s) => effects["minLen 6"]![s.slug]!.right > 0).length;
const p3b = songs.filter((s) => effects["infer off"]![s.slug]!.right > 0).length;
console.log(`P3a (a shorter minimum note raises bars right on at least four of six songs): ${p3a} of 6 -> ${p3a >= 4 ? "PASS" : "FAIL"}`);
console.log(`P3b (no inferred onsets raises bars right on at least four of six songs): ${p3b} of 6 -> ${p3b >= 4 ? "PASS" : "FAIL"}`);
console.log(`P4 (the selected configuration gains at least 10 points of mean bars right): ${pts(mean(cGain))} -> ${mean(cGain) >= 0.1 ? "PASS" : "FAIL"}`);
const floorOnly = SETTINGS.filter((st) => st.window === null && st.floor !== null).map((st) => mean(songs.map((s) => rightShare(bApp.grades[st.id]![s.slug]!) - rightShare(bApp.grades[SETTINGS[0]!.id]![s.slug]!))));
const p5 = mean(bApp.gain) >= 0.05 && Math.max(...floorOnly) < 0.02;
console.log(`P5 (on the app's notes the selected filter gains at least 5 points, and no floor alone gains 2): selected ${bApp.best} ${pts(mean(bApp.gain))}; best floor alone ${pts(Math.max(...floorOnly))} -> ${p5 ? "PASS" : "FAIL"}`);
const fifty = songs.filter((s) => rightShare(combined[s.slug]!) >= 0.5).length;
const clears48 = songs.every((s) => rightShare(combined[s.slug]!) >= HELPS.right && wrongShare(combined[s.slug]!) <= HELPS.wrong);
console.log(`P6 (the combined pipeline reaches 50 % bars right on at least four of six songs and does not clear Study 48's bar on every song): ${songs.map((s) => `${s.slug} ${pct(combined[s.slug]!.right, combined[s.slug]!.bars)} right ${pct(combined[s.slug]!.wrong, combined[s.slug]!.bars)} wrong`).join(", ")} -> ${fifty >= 4 && !clears48 ? "PASS" : "FAIL"}`);

// ---- decisions
console.log("\n== decisions");
const d1 = mean(cGain) >= D1.gain && Math.min(...cGain) >= D1.worst && cHeldOut.filter((h) => h.gain > 0).length >= D1.heldOut;
console.log(`S49-D1 (a Basic Pitch setting for bass stems: mean gain >= 10 points, no song down more than 2, held-out gain on five of six): ${cBest}, mean ${pts(mean(cGain))}, worst ${pts(Math.min(...cGain))}, held-out gains ${cHeldOut.filter((h) => h.gain > 0).length} of 6 -> ${d1 ? `recommend ${cBest}` : "no setting recommended"}`);
const d2 = mean(bApp.gain) >= D2.gain && Math.min(...bApp.gain) >= D2.worst;
console.log(`S49-D2 (a filter on the notes the app already stores: mean gain >= 5 points, no song down more than 2, within the loss bound): ${bApp.best}, mean ${pts(mean(bApp.gain))}, worst ${pts(Math.min(...bApp.gain))} -> ${d2 ? `recommend ${bApp.best}` : "no filter recommended"}`);
const fourFour = songs.filter((s) => s.fourFour);
const softBar = fourFour.every((s) => rightShare(combined[s.slug]!) >= 0.5);
console.log(`S49-D3 (the combined pipeline, ${cBest} then ${bSel.best}, against Study 48's bar of 70 % right and at most 10 % wrong on every song): ${clears48 ? "clears it" : "does not clear it"}; 50 % bars right on every 4/4 song (${fourFour.map((s) => s.slug).join(", ")}): ${softBar ? "yes" : "no"}`);

writeFileSync(
	`${root}results/study49.json`,
	`${JSON.stringify(
		{
			registered: "docs/BRIEF-STUDY49.md",
			spend: 0,
			bounds: { lossBound: LOSS_BOUND, d1: D1, d2: D2, helps: HELPS },
			partA,
			partC: { configs: Object.fromEntries(cIds.map((id) => [id, Object.fromEntries(songs.map((s) => [s.slug, plain(partC[id]![s.slug]!)]))])), effects, selected: cBest, gain: Object.fromEntries(songs.map((s, i) => [s.slug, cGain[i]])), heldOut: cHeldOut },
			partB: Object.fromEntries(
				[
					["app", bApp],
					["selected", bSel],
				].map(([k, b]) => {
					const r = b as typeof bApp;
					return [k, { settings: Object.fromEntries(SETTINGS.map((st) => [st.id, Object.fromEntries(songs.map((s) => [s.slug, { ...plain(r.grades[st.id]![s.slug]!), lost: r.lost[st.id]![s.slug] }]))])), selected: r.best, gain: Object.fromEntries(songs.map((s, i) => [s.slug, r.gain[i]])), heldOut: r.heldOut }];
				}),
			),
			decisions: { d1: d1 ? cBest : null, d2: d2 ? bApp.best : null, combined: { config: cBest, filter: bSel.best, clearsStudy48: clears48, fiftyOnFourFour: softBar } },
		},
		null,
		"\t",
	)}\n`,
);
console.log(`\nresults/study49.json written (${songs.length} songs, ${CONFIGS.length} configurations, ${SETTINGS.length} filter settings, $0)`);
