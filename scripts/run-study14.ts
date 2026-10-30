/**
 * Study 14 arms A–D (docs/BRIEF-STUDY14.md): zero spend, the shipped
 * code (verbatim ports at 39c25b5) over the bench's audio and truth.
 * Arm E (the two model calls) lives in run-study14-reconcile.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import fixture10 from "../corpus/fixture10.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import mixes10 from "../corpus/mixes10.json";
import { renderMix, type MixSpec } from "../src/study4/synth4.js";
import { markedChart } from "../src/study8/sections.js";
import { renderParts, type MixSpec9 } from "../src/study9/parts.js";
import { renderMix10, type MixSpec10 } from "../src/study10/synth10.js";
import { alignChart, renderChartPads } from "../src/study14/chartAlignment.js";
import { alignedPlacements } from "../src/study14/alignedPlacements.js";
import { chartBars, type ChartBar } from "../src/study14/chartBars.js";
import { chordChartBars } from "../src/study14/chordChartBars.js";

const root = new URL("../", import.meta.url).pathname;
const bandSpecs = new Map<string, MixSpec9 & MixSpec10>();
for (const m of [...mixes.mixes, ...mixes9.mixes, ...mixes10.mixes] as (MixSpec9 & MixSpec10)[]) {
	bandSpecs.set(m.id, m);
}

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
function renderBand(id: string): Float32Array {
	const item = (fixture10.bandItems as { id: string; renderer: string; seed: number }[]).find(
		(i) => i.id === id,
	)!;
	const spec = bandSpecs.get(id)!;
	if (item.renderer === "synth4") return renderMix(spec as MixSpec, item.seed);
	if (item.renderer === "parts9") return renderParts(spec as MixSpec9, item.seed).mix;
	return renderMix10(spec as MixSpec10, item.seed);
}
function specPadBars(spec: MixSpec): ChartBar[] {
	const bars: ChartBar[] = [];
	for (const s of spec.sections) {
		for (const chord of s.bars) {
			bars.push({ measure: bars.length + 1, chords: [chord], bpm: s.bpm, meter: spec.meter, key: null, section: null });
		}
	}
	return bars;
}

/** The bench transcription as the band-markdown conventions, 4 bars a row. */
function toMarkdown(song: { bpm: number; meter: string; sections: { name: string; bars: string[][] }[] }, key: string | null): string {
	const lines: string[] = [`${key ? `key: ${key} ` : ""}${song.meter} ${song.bpm} bpm`];
	for (const s of song.sections) {
		lines.push("", `## ${s.name}`);
		for (let i = 0; i < s.bars.length; i += 4) {
			const row = s.bars.slice(i, i + 4).map((chords) => (chords.every((c) => c === "") ? "N.C." : chords.filter(Boolean).join(" ")));
			lines.push(`| ${row.join(" | ")} |`);
		}
	}
	return lines.join("\n");
}

// ---- Arm B: the parsers round-trip ----
const armB: Record<string, unknown> = {};
{
	const checks: unknown[] = [];
	for (const song of mmkkCharts.songs as { slug: string; bpm: number; meter: string; sections: { name: string; bars: string[][] }[] }[]) {
		const m = (manifestMmkk.songs as { slug: string; declared: { key: { value: string }[] } }[]).find((x) => x.slug === song.slug)!;
		const md = toMarkdown(song, m.declared.key[0]?.value ?? null);
		const parsed = chordChartBars(md, { tempo: song.bpm, meter: song.meter });
		const wantBars = song.sections.flatMap((s) => s.bars);
		const wantSections = song.sections.map((s) => s.name);
		const gotSections = parsed?.bars.flatMap((b) => (b.section ? [b.section] : [])) ?? [];
		let chordsEqual = parsed !== null && parsed.bars.length === wantBars.length;
		if (parsed && chordsEqual) {
			for (const [i, want] of wantBars.entries()) {
				const got = parsed.bars[i]!.chords;
				const wantClean = want.every((c) => c === "") ? ["N.C."] : want.filter(Boolean);
				if (got.length !== wantClean.length || got.some((c, k) => c !== wantClean[k])) {
					chordsEqual = false;
					console.log(`  arm B ${song.slug} bar ${i + 1}: want [${wantClean}] got [${got}]`);
					break;
				}
			}
		}
		checks.push({
			slug: song.slug,
			parsedBars: parsed?.bars.length ?? null,
			wantBars: wantBars.length,
			chordsEqual,
			sectionsEqual: JSON.stringify(gotSections) === JSON.stringify(wantSections),
			warnings: parsed?.warnings ?? null,
		});
		console.log(`arm B ${song.slug}: bars ${parsed?.bars.length}/${wantBars.length}, chords ${chordsEqual ? "✓" : "✗"}, sections ${gotSections.length}/${wantSections.length}`);
	}
	// The summary form: Study 8's marked chart for contrast-b.
	const cb = (mixes.mixes as MixSpec[]).find((m) => m.id === "contrast-b")!;
	const summary = markedChart(cb);
	const parsed = chartBars(summary, { tempo: null, meter: null });
	const specBars = cb.sections.reduce((a, s) => a + s.bars.length, 0);
	checks.push({
		slug: "contrast-b-summary",
		parsedBars: parsed?.bars.length ?? null,
		wantBars: specBars,
		tempo: parsed?.bars[0]?.bpm,
		meter: parsed?.bars[0]?.meter,
		sections: parsed?.bars.flatMap((b) => (b.section ? [b.section] : [])),
		warnings: parsed?.warnings,
	});
	console.log(`arm B contrast-b summary: bars ${parsed?.bars.length}/${specBars}, tempo ${parsed?.bars[0]?.bpm}, meter ${parsed?.bars[0]?.meter}, sections ${JSON.stringify(parsed?.bars.flatMap((b) => (b.section ? [b.section] : [])))}`);
	// The 6/8 convention: tempo declared in eighths renders the app's bar seconds.
	const padBars: ChartBar[] = Array.from({ length: 4 }, (_, i) => ({ measure: i + 1, chords: ["Am"], bpm: 180, meter: "6/8", key: null, section: null }));
	const ref = renderChartPads(padBars, 22050);
	const barSecondsApp = ref.barStarts[1]! - ref.barStarts[0]!;
	checks.push({ slug: "six-eight-eighths", barSeconds: barSecondsApp, want: 2 });
	console.log(`arm B 6/8 at 180 eighths: bar = ${barSecondsApp.toFixed(3)} s (app convention wants 2.000)`);
	armB.checks = checks;
}

// ---- Arms A + C: the shipped aligner on real and probe audio ----
const armA: unknown[] = [];
const armC: unknown[] = [];
for (const song of mmkkCharts.songs as { slug: string; gated: boolean; bpm: number; meter: string; sections: { name: string; bars: string[][] }[] }[]) {
	const m = (manifestMmkk.songs as { slug: string; mix: unknown; declared: { key: { value: string }[] }; sections: { name: string; start: number }[] | null }[]).find((x) => x.slug === song.slug)!;
	const audio = m.mix ? loadRaw(`${root}corpus-mmkk/${song.slug}/mix.mp3.22050.f32le.raw`) : renderBand(song.slug);
	const md = toMarkdown(song, m.declared.key[0]?.value ?? null);
	const parsed = chordChartBars(md, { tempo: song.bpm, meter: song.meter })!;
	const t0 = performance.now();
	const alignment = alignChart(parsed.bars, audio, 22050);
	const ms = Math.round(performance.now() - t0);
	const placements = alignedPlacements(parsed.bars, alignment);
	const declared = (m.sections ?? []).map((s) => s.start);
	const errs = placements.sections.map((s, k) => (declared[k] !== undefined ? Math.abs(s.start - declared[k]!) : null));
	armA.push({ itemId: song.slug, kind: "right-real", cost: alignment.cost, controlCost: alignment.controlCost, ratio: placements.ratio });
	armC.push({
		slug: song.slug,
		gated: song.gated,
		ms,
		samePiece: placements.samePiece,
		ratio: placements.ratio,
		sections: placements.sections.map((s, k) => ({ ...s, declared: declared[k] ?? null, err: errs[k] })),
	});
	console.log(
		`arm C ${song.slug}${song.gated ? " (GATED)" : ""}: ratio ${placements.ratio.toFixed(1)} samePiece ${placements.samePiece} | errs ${errs.map((e) => (e === null ? "—" : e.toFixed(2))).join(",")} | hedged ${placements.sections.filter((s) => s.hedged).length}/${placements.sections.length} | ${ms}ms`,
	);
}
const PROBE_PAIRS: [string, string][] = [
	["drift-4a", "waltz-b"],
	["waltz-b", "drift-4a"],
	["contrast-b", "mod-a"],
	["mod-a", "contrast-b"],
	["swing-x", "oct-low-a"],
	["oct-low-a", "swing-x"],
];
for (const [recId, wrongChartId] of PROBE_PAIRS) {
	const audio = renderBand(recId);
	const right = alignChart(specPadBars(bandSpecs.get(recId)! as MixSpec), audio, 22050);
	const wrong = alignChart(specPadBars(bandSpecs.get(wrongChartId)! as MixSpec), audio, 22050);
	armA.push(
		{ itemId: recId, kind: "right-synth", cost: right.cost, controlCost: right.controlCost, ratio: right.controlCost / Math.max(right.cost, 1e-6) },
		{ itemId: `${recId}⊗${wrongChartId}`, kind: "wrong-synth", cost: wrong.cost, controlCost: wrong.controlCost, ratio: wrong.controlCost / Math.max(wrong.cost, 1e-6), wrongOverRight: wrong.cost / Math.max(right.cost, 1e-6) },
	);
	console.log(
		`arm A ${recId}: right tritone-ratio ${(right.controlCost / Math.max(right.cost, 1e-6)).toFixed(1)} | wrong chart ${wrongChartId}: tritone-ratio ${(wrong.controlCost / Math.max(wrong.cost, 1e-6)).toFixed(1)}, wrong/right cost ${(wrong.cost / Math.max(right.cost, 1e-6)).toFixed(1)}`,
	);
}

// ---- Arm D: edge-correction candidates on the real songs ----
const armD: unknown[] = [];
for (const song of mmkkCharts.songs as { slug: string; sections: unknown[] }[]) {
	const m = (manifestMmkk.songs as { slug: string; mix: unknown; sections: { start: number }[] | null }[]).find((x) => x.slug === song.slug)!;
	if (!m.sections) continue;
	const audio = m.mix ? loadRaw(`${root}corpus-mmkk/${song.slug}/mix.mp3.22050.f32le.raw`) : renderBand(song.slug);
	const hop = Math.round(0.05 * 22050);
	const rms: number[] = [];
	for (let i = 0; i + hop <= audio.length; i += hop) {
		let acc = 0;
		for (let k = i; k < i + hop; k++) acc += audio[k]! * audio[k]!;
		rms.push(Math.sqrt(acc / hop));
	}
	const peak = Math.max(...rms);
	const firstOnset = (rms.findIndex((v) => v > 0.1 * peak) * hop) / 22050;
	let lastIdx = rms.length - 1;
	while (lastIdx > 0 && rms[lastIdx]! <= 0.05 * peak) lastIdx--;
	const lastSound = (lastIdx * hop) / 22050;
	const c = (armC as { slug: string; sections: { start: number; declared: number | null }[] }[]).find((x) => x.slug === song.slug)!;
	const placedFirst = c.sections[0]!;
	const placedLastDeclared = m.sections[m.sections.length - 1]!.start;
	const placedLast = c.sections[c.sections.length - 1]!;
	armD.push({
		slug: song.slug,
		firstOnset: Math.round(firstOnset * 100) / 100,
		lastSound: Math.round(lastSound * 100) / 100,
		firstPlaced: placedFirst.start,
		firstDeclared: placedFirst.declared,
		lastPlaced: placedLast.start,
		lastDeclared: placedLastDeclared,
	});
	console.log(
		`arm D ${song.slug}: first onset ${firstOnset.toFixed(2)}s (placed ${placedFirst.start.toFixed(2)}, declared ${placedFirst.declared}); last sound ${lastSound.toFixed(2)}s (last section placed ${placedLast.start.toFixed(2)}, declared ${placedLastDeclared})`,
	);
}

writeFileSync(`${root}results/study14.json`, `${JSON.stringify({ version: 1, pins: { alignment: "39c25b5", reconciler: "5b2288f8" }, armA, armB, armC, armD }, null, "\t")}\n`);
console.log("\nstudy14.json written");
