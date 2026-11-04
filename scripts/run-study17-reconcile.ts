/**
 * Study 17 arm E (docs/BRIEF-STUDY17.md): the reconciler, in Study 14's
 * measured production path (ported builder + parser, claude-fable-5-1,
 * thinking adaptive at low effort), stacked on the best mechanical arm
 * from results/study17.json. Runs only when S17-G2 passed (the runner
 * prints the trigger). Two calls; the study's whole spend; fence $2.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { RECONCILE_SYSTEM, type BarGrade, fixesAndBreaks, gradeBars } from "../src/study13/grading13.js";
import { parseReconciledChords } from "../src/study14/parseReconciledChords.js";
import { reconcileChordsMessage } from "../src/study14/reconcileChordsMessage.js";

const root = new URL("../", import.meta.url).pathname;
const study17 = JSON.parse(readFileSync(`${root}results/study17.json`, "utf8"));
const apiKey = readFileSync(`${root}.env.local`, "utf8").match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/)?.[1];
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY missing");
const gateway = createGateway({ apiKey });
const MODEL = "anthropic/claude-fable-5-1";

interface Song {
	slug: string;
	gated: boolean;
	declaredKey: string | null;
	truth: string[][];
	arms: Record<string, { perBar: string[]; grade: BarGrade } | null>;
	barNotesA: { bar: number; notes: string }[];
	barNotesB: { bar: number; notes: string }[];
}
const songs = study17.songs as Song[];
const gatedSong = songs.find((s) => s.gated)!;

// The registered winner rule: best of {B, C, Dmix} on the gated song,
// ties toward B then C (stable sort over that order).
const winner = (["B", "C", "Dmix"] as const)
	.map((arm) => ({ arm, grade: gatedSong.arms[arm]?.grade }))
	.filter((x): x is { arm: "B" | "C" | "Dmix"; grade: BarGrade } => !!x.grade)
	.sort((x, y) => y.grade.right - x.grade.right)[0]!;
if (winner.grade.right < 37) throw new Error("S17-G2 did not pass; arm E is skipped by rule");
console.log(`Arm E runs on arm ${winner.arm} (gated ${winner.grade.right}/76)`);

const cells: unknown[] = [];
for (const song of songs) {
	const chart = (mmkkCharts.songs as { slug: string; bpm: number; meter: string }[]).find(
		(c) => c.slug === song.slug,
	)!;
	const base = song.arms[winner.arm]!;
	// Note evidence: arm B's merged notes when B is the winner, else arm A's
	// (C and D produce no note events) — the registered design choice.
	const barNotes = winner.arm === "B" ? song.barNotesB : song.barNotesA;
	const notesOf = new Map(barNotes.map((b) => [b.bar, b.notes]));
	const prompt = reconcileChordsMessage({
		key: song.declaredKey,
		meter: chart.meter,
		tempo: String(chart.bpm),
		chords: base.perBar,
		bars: base.perBar.map((_, i) => ({ notes: notesOf.get(i + 1) ?? "" })),
	});
	const started = performance.now();
	let text = "";
	let tokensOut = 0;
	let apiError: string | null = null;
	try {
		const result = await generateText({
			model: gateway(MODEL),
			system: RECONCILE_SYSTEM,
			prompt,
			maxOutputTokens: 16000,
			maxRetries: 4,
			providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } },
		} as Parameters<typeof generateText>[0]);
		text = result.text;
		tokensOut = result.totalUsage.outputTokens ?? 0;
	} catch (e) {
		apiError = e instanceof Error ? e.message.slice(0, 300) : String(e);
	}
	const latencyMs = Math.round(performance.now() - started);
	const parsed = apiError
		? { chords: null, error: apiError }
		: parseReconciledChords(text, base.perBar.length);
	const grade = parsed.chords ? gradeBars(parsed.chords, song.truth) : null;
	const delta = parsed.chords ? fixesAndBreaks(base.perBar, parsed.chords, song.truth) : null;
	cells.push({
		slug: song.slug,
		gated: song.gated,
		model: MODEL,
		config: "thinking-adaptive-low (production)",
		baselineArm: winner.arm,
		outcome: parsed.chords ? "answered" : "failed",
		error: parsed.error ?? null,
		grade,
		delta,
		tokensOut,
		latencyMs,
	});
	console.log(
		`${song.slug}: ${parsed.chords ? `${grade!.right}/${grade!.bars} (arm-${winner.arm} baseline ${base.grade.right}) — fixes ${delta!.fixes}, breaks ${delta!.breaks}` : `FAILED: ${parsed.error}`} [${tokensOut}out ${latencyMs}ms]`,
	);
}
writeFileSync(`${root}results/study17-arm-e.json`, `${JSON.stringify({ version: 1, cells }, null, "\t")}\n`);
const gatedCell = (cells as { gated: boolean; grade: BarGrade | null; delta: { fixes: number; breaks: number } | null }[]).find((c) => c.gated)!;
if (gatedCell.grade && gatedCell.delta) {
	const g4 =
		gatedCell.delta.fixes >= 2 * gatedCell.delta.breaks &&
		gatedCell.grade.right > winner.grade.right;
	console.log(`\nS17-G4 (fixes >= 2x breaks AND reconciled > winner baseline): ${g4 ? "PASS" : "FAIL"}`);
} else {
	console.log("\nS17-G4: FAIL (no parsed answer on the gated song)");
}
console.log("study17-arm-e.json written");
