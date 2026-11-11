/**
 * Study 45 Arm 0 (docs/BRIEF-STUDY45.md), $0: where Study 43's guitar
 * drafts lost their chord qualities. For each of the 24 guitar cells (12
 * takes × bar and half grid) the per-cell hints are recomputed with the
 * same ChordMini child and grid, the truth per cell is the sheet's chord
 * sounding at the cell start, and the draft per cell is the stored
 * answer's chords expanded. Writes results/study45-attribution.json.
 *   bun scripts/attribute-study45.ts
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as v from "valibot";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { expandChords } from "../src/study23/grade23.js";
import { peakNorm } from "../src/study33/stereo.js";
import { chordAtBars, type TimedChord } from "../src/study38/truth.js";
import { type Attribution, attributeQualities } from "../src/study45/attribute.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench45a-"));
const manifest = JSON.parse(readFileSync(`${root}corpus/study43-manifest.json`, "utf8")) as { entries: Record<string, { raw: string; group: string; truth: { timedChords?: TimedChord[] } }> };
const trackers = JSON.parse(readFileSync(`${root}results/study43-trackers.json`, "utf8")) as Record<string, Record<string, { beats: number[]; downbeats: number[] }>>;
const s43 = JSON.parse(readFileSync(`${root}results/study43.json`, "utf8")) as { results: Record<string, { rawDraft?: string; class: string; quals?: { right: number; bearing: number } }> };

/** Study 43's grids, verbatim (scripts/run-study43.ts gridStarts). */
function gridStarts(grid: "bar" | "half", beats: number[], downbeats: number[]): number[] {
	if (grid === "bar") return downbeats;
	const out: number[] = [];
	for (let i = 0; i < downbeats.length; i++) {
		const from = downbeats[i]!;
		out.push(from);
		const to = downbeats[i + 1];
		if (to === undefined) break;
		const inside = beats.filter((b) => b > from + 1e-6 && b < to - 1e-6);
		const mid = (from + to) / 2;
		if (inside.length) out.push(inside.reduce((best, b) => (Math.abs(b - mid) < Math.abs(best - mid) ? b : best), inside[0]!));
		else out.push(mid);
	}
	return out;
}
function nchordPerBar(samples: Float32Array, barStarts: number[], name: string): string[] {
	const rawFile = join(dir, `${name}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	const barsFile = `${rawFile}.bars.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", rawFile, "--out", `${barsFile}.out`, "--bars", barsFile], { maxBuffer: 64 * 1024 * 1024 });
	if (np.exitCode !== 0) throw new Error(`nchord failed (${name})`);
	return (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar.map((c) => (c === "" ? "N.C." : c));
}

const cells: Record<string, Attribution & { grid: string; sheet: string; class: string; quals: { right: number; bearing: number } | undefined; truth: string[]; hints: string[]; draft: string[] }> = {};
const totals: Record<string, Attribution> = {};
const add = (k: string, a: Attribution) => {
	const t = (totals[k] ??= { bearing: 0, draftRight: 0, hintRight: 0, lost: { hintWrongDraftFollowed: 0, hintWrongDraftOtherWrong: 0, hintRightDraftWrong: 0, powerChord: 0 } });
	t.bearing += a.bearing;
	t.draftRight += a.draftRight;
	t.hintRight += a.hintRight;
	for (const key of Object.keys(t.lost) as (keyof Attribution["lost"])[]) t.lost[key] += a.lost[key];
};
for (const [slug, e] of Object.entries(manifest.entries)) {
	if (e.group !== "guitar") continue;
	const buf = readFileSync(`${root}${e.raw}`);
	const mono = peakNorm(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
	const duration = mono.length / RATE;
	const t = trackers[slug]!["beatthis-small0"]!;
	for (const grid of ["bar", "half"] as const) {
		const cell = s43.results[`${slug}|${grid}`];
		if (!cell?.rawDraft) continue;
		const json = cell.rawDraft.match(/\{[\s\S]*\}/)?.[0];
		let parsed: v.SafeParseResult<typeof ChartDraftAnswerSchema> | null = null;
		try {
			parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
		} catch {
			parsed = null;
		}
		if (!parsed?.success) continue;
		let barStarts = gridStarts(grid, t.beats, t.downbeats);
		if (barStarts.length && barStarts[barStarts.length - 1]! < duration - 0.25) barStarts = [...barStarts, duration];
		const cellStarts = barStarts.slice(0, -1);
		const truth = chordAtBars(e.truth.timedChords ?? [], cellStarts);
		const hints = nchordPerBar(mono, barStarts, `${slug}-${grid}`);
		const draft = expandChords(parsed.output.chords);
		const a = attributeQualities(truth, hints, draft);
		const sheet = /SS2-\d+-[A-G]b?/.exec(slug)?.[0] ?? "?";
		cells[`${slug}|${grid}`] = { ...a, grid, sheet, class: cell.class, quals: cell.quals, truth, hints, draft };
		add(`${sheet}|${grid}`, a);
		add(`all|${grid}`, a);
		console.log(`${slug.padEnd(24)} ${grid.padEnd(4)} bearing ${a.bearing} draft right ${a.draftRight} hint right ${a.hintRight} | lost: hint-wrong followed ${a.lost.hintWrongDraftFollowed}, hint-wrong other ${a.lost.hintWrongDraftOtherWrong}, hint-right lost ${a.lost.hintRightDraftWrong}, power chord ${a.lost.powerChord} | ${cell.class}`);
	}
}
console.log("\ntotals:");
for (const [k, t] of Object.entries(totals)) {
	const lost = t.bearing - t.draftRight;
	console.log(`  ${k.padEnd(16)} bearing ${t.bearing} draft right ${t.draftRight} (${((100 * t.draftRight) / t.bearing).toFixed(0)} %) hint right ${t.hintRight} (${((100 * t.hintRight) / t.bearing).toFixed(0)} %) | lost ${lost}: hint-wrong followed ${t.lost.hintWrongDraftFollowed}, hint-wrong other ${t.lost.hintWrongDraftOtherWrong}, hint-right lost ${t.lost.hintRightDraftWrong}, power chord ${t.lost.powerChord}`);
}
writeFileSync(`${root}results/study45-attribution.json`, `${JSON.stringify({ cells, totals }, null, "\t")}\n`);
console.log(`\nresults/study45-attribution.json written ($0)`);
