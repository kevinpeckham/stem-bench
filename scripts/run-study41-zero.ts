/**
 * Study 41 arms C and D (docs/BRIEF-STUDY41.md), $0.
 *  C  the app's three draft holds over Study 38's drafts on a tracker's
 *     bars (ten modern on madmom, 36 GuitarSet on madmom), the tracker's
 *     bar standing in for the detector's: how many each would have held
 *     and how many of those are the confidently-wrong drafts. The 36
 *     annotated-grid GuitarSet drafts are reported as a secondary.
 *  D  the Study 10 ONNX export of Beat This small0 (results/study41-onnx.json,
 *     scripts/onnx-study41.py) against the torch package's small0
 *     (results/study36-trackers.json) on the same ten songs: downbeat F
 *     at 70 ms, bar count, median bar.
 * Writes results/study41-zero.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { downbeatF, foldCompare, summarizeTracker } from "../src/study36/metrical.js";

const root = new URL("../", import.meta.url).pathname;
const MAX_GRID_DRIFT = 0.04; // stem-shovel GENERATED_MAX_GRID_DRIFT
const MIN_NOTES_PER_BAR = 3; // stem-shovel GENERATED_MIN_NOTES_PER_BAR

interface Cell {
	arm: string;
	grid: string;
	typed: { bpm: number; meter: string; beatsPerBar: number };
	declared: { bpm?: number; meter?: string } | null;
	bars: number;
	barSecMedian: number;
	notesPerBar: number;
	class: string;
}
const study38 = (JSON.parse(readFileSync(`${root}results/study38.json`, "utf8")) as { results: Record<string, Cell> }).results;
const declaredBarSec = (bpm: number, meter: string) => ((meter === "6/8" ? 2 : meter === "3/4" ? 3 : 4) * 60) / bpm;

interface HoldRow {
	key: string;
	class: string;
	bad: boolean;
	detected: boolean;
	drift: number | null;
	driftHold: boolean;
	notesPerBar: number;
	thinHold: boolean;
	fold: number | null;
}
function holdsOver(keys: string[]): { rows: HoldRow[]; summary: Record<string, { held: number; bad: number; goodHeld: number }> } {
	const rows: HoldRow[] = keys.map((key) => {
		const c = study38[key]!;
		const d = c.declared;
		const truthBar = d?.bpm ? declaredBarSec(d.bpm, d.meter ?? "4/4") : null;
		const f = truthBar ? foldCompare(c.barSecMedian, truthBar, MAX_GRID_DRIFT) : null;
		const drift = truthBar ? Math.abs(c.barSecMedian / truthBar - 1) : null;
		return {
			key,
			class: c.class,
			bad: c.class === "confidently-wrong",
			detected: true,
			drift,
			driftHold: drift !== null && drift > MAX_GRID_DRIFT,
			notesPerBar: c.notesPerBar,
			thinHold: c.notesPerBar < MIN_NOTES_PER_BAR,
			fold: f?.folded ? f.ratio : null,
		};
	});
	const tally = (pick: (r: HoldRow) => boolean) => ({ held: rows.filter(pick).length, bad: rows.filter((r) => pick(r) && r.bad).length, goodHeld: rows.filter((r) => pick(r) && r.class === "good").length });
	return { rows, summary: { detectedGrid: tally((r) => r.detected), drift: tally((r) => r.driftHold), thin: tally((r) => r.thinHold) } };
}
const trackerKeys = Object.keys(study38).filter((k) => !k.endsWith("|retry") && study38[k]!.grid === "madmom-34" && (study38[k]!.arm === "A" || study38[k]!.arm === "B"));
const annotatedKeys = Object.keys(study38).filter((k) => !k.endsWith("|retry") && study38[k]!.grid === "annotated");
const primary = holdsOver(trackerKeys);
const secondary = holdsOver(annotatedKeys);
const bad = primary.rows.filter((r) => r.bad).length;
console.log(`C: ${primary.rows.length} drafts on a tracker's bars (${trackerKeys.filter((k) => study38[k]!.arm === "A").length} modern, ${trackerKeys.filter((k) => study38[k]!.arm === "B").length} guitar); confidently-wrong ${bad}; refused ${primary.rows.filter((r) => r.class === "refused").length}`);
for (const [name, s] of Object.entries(primary.summary)) console.log(`  ${name.padEnd(13)} would hold ${s.held} (good among them ${s.goodHeld}); catches ${s.bad} of the ${bad} bad`);
console.log("  drift hold, the held drafts:");
for (const r of primary.rows.filter((r) => r.driftHold)) console.log(`    ${r.key.padEnd(34)} drift ${(100 * (r.drift ?? 0)).toFixed(0)}% ${r.fold !== null ? `(bar at fold ${r.fold})` : "(no metrical fold)"} ${r.class}`);
console.log(`  the bad drafts: ${primary.rows.filter((r) => r.bad).map((r) => `${r.key} drift ${(100 * (r.drift ?? 0)).toFixed(0)}% npb ${r.notesPerBar.toFixed(1)}`).join("; ")}`);
console.log(`  notes a bar over the 46: min ${Math.min(...primary.rows.map((r) => r.notesPerBar)).toFixed(1)}, median ${[...primary.rows].sort((a, b) => a.notesPerBar - b.notesPerBar)[primary.rows.length >> 1]!.notesPerBar.toFixed(1)}`);
console.log(`  secondary, ${secondary.rows.length} annotated-grid guitar drafts:`);
for (const [name, s] of Object.entries(secondary.summary)) console.log(`    ${name.padEnd(13)} would hold ${s.held}; catches ${s.bad} of ${secondary.rows.filter((r) => r.bad).length} bad`);
console.log(`P5 (drift hold holds >= 10 of 46 and catches <= 1 of 3 bad; thin holds 0): ${primary.summary.drift!.held >= 10 && primary.summary.drift!.bad <= 1 && primary.summary.thin!.held === 0 ? "PASS" : "FAIL"}`);

// D: ONNX small0 against torch small0
interface Reading {
	beats: number[];
	downbeats: number[];
	seconds?: number;
}
const onnx = JSON.parse(readFileSync(`${root}results/study41-onnx.json`, "utf8")) as Record<string, Reading & { tempo: number | null; meter: string | null; beatsPerBarCounts: Record<string, number> }>;
const torch = JSON.parse(readFileSync(`${root}results/study36-trackers.json`, "utf8")) as Record<string, Record<string, Reading>>;
console.log("\nD: Study 10 ONNX small0 (numpy front end, minimal postprocessor) vs torch beat_this small0, same audio:");
const agreement: Record<string, { downbeatF70: number; beatF70: number; onnxBars: number; torchBars: number; onnxBarSec: number | null; torchBarSec: number | null; onnxSeconds: number | undefined; torchSeconds: number | undefined }> = {};
let p6 = true;
for (const [slug, o] of Object.entries(onnx)) {
	const t = torch[slug]?.["beatthis-small0"];
	if (!t) continue;
	const dF = downbeatF(o.downbeats, t.downbeats, 0.07).f;
	const bF = downbeatF(o.beats, t.beats, 0.07).f;
	const so = summarizeTracker(o.beats, o.downbeats);
	const st = summarizeTracker(t.beats, t.downbeats);
	agreement[slug] = { downbeatF70: dF, beatF70: bF, onnxBars: o.downbeats.length, torchBars: t.downbeats.length, onnxBarSec: so.barSec, torchBarSec: st.barSec, onnxSeconds: o.seconds, torchSeconds: t.seconds };
	if (dF < 0.95 || Math.abs(o.downbeats.length - t.downbeats.length) > 2) p6 = false;
	console.log(`  ${slug.padEnd(24)} downbeat F ${dF.toFixed(3)} beat F ${bF.toFixed(3)} | bars ${o.downbeats.length} vs ${t.downbeats.length} | bar ${so.barSec?.toFixed(3)} vs ${st.barSec?.toFixed(3)} s | ${o.seconds}s vs ${t.seconds}s`);
}
console.log(`P6 (downbeat F >= 0.95 on all ten, bar counts within 2): ${p6 ? "PASS" : "FAIL"}`);
writeFileSync(`${root}results/study41-zero.json`, `${JSON.stringify({ holds: { primary, secondary }, onnxAgreement: agreement }, null, "\t")}\n`);
console.log("results/study41-zero.json written");
