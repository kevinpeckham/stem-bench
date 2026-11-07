/**
 * Study 25b (docs/BRIEF-STUDY25B.md): eat-all-the-clocks drafted on
 * the corrected 71-bar chart (chartVersion 131). One fable call;
 * gate S25B-G1 vs the true-grid hint score.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import eatV131 from "../corpus/mmkk-charts-eat-v131.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { gradeBars21 } from "../src/study21/grading21.js";
import { expandChords, isDialectBar, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { gradeStrict, strictSame } from "../src/study20/strict20.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const ANCHOR = 0.415;

function readEnvLocal(): string | null {
	try {
		const m = readFileSync(`${root}.env.local`, "utf8").match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/);
		return m?.[1]?.trim() ?? null;
	} catch {
		return null;
	}
}
const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");

const chart = (eatV131.songs as { slug: string; bpm: number; meter: string; sections: { bars: string[][] }[] }[])[0]!;
const truth: string[][] = [];
for (const s of chart.sections) for (const b of s.bars) truth.push(b);
const n = truth.length;
const period = (4 * 60) / chart.bpm;
const barStarts = Array.from({ length: n }, (_, i) => ANCHOR + i * period);

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
const dir = mkdtempSync(join(tmpdir(), "stem-bench25b-"));
const mixRawPath = `${root}corpus-mmkk/eat-all-the-clocks/mix.mp3.22050.f32le.raw`;

// Hints over the grid (also the gate's reference score).
const barsFile = join(dir, "bars.json");
const nchordFile = join(dir, "nchord.json");
writeFileSync(barsFile, JSON.stringify({ barStarts }));
const np = Bun.spawnSync([PY, NCHORD, "--raw", mixRawPath, "--out", nchordFile, "--bars", barsFile], {
	maxBuffer: 64 * 1024 * 1024,
});
if (np.exitCode !== 0) throw new Error("nchord failed");
const hintsRaw = (JSON.parse(readFileSync(nchordFile, "utf8")) as { perBar: string[] }).perBar;
const hintScore = rootScore(
	Array.from({ length: n }, (_, i) => hintsRaw[i] ?? ""),
	truth,
);
console.log(`hints on the corrected grid: ${hintScore.right}/${hintScore.bearing}`);

// Production transcription for bar notes.
const m = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
	(x) => x.slug === "eat-all-the-clocks",
)!;
const stems = m.stems
	.filter((s) => !/drum/i.test(s.name))
	.map((s) => loadRaw(`${root}corpus-mmkk/eat-all-the-clocks/${s.url.split("/").pop()}.22050.f32le.raw`));
const len = Math.max(...stems.map((s) => s.length));
const sum = new Float32Array(len);
for (const s of stems) for (let i = 0; i < s.length; i++) sum[i]! += s[i]!;
let peak = 0;
for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(sum[i]!));
if (peak > 0) for (let i = 0; i < len; i++) sum[i]! /= peak;
const rawFile = join(dir, "eat.raw");
writeFileSync(rawFile, Buffer.from(sum.buffer, sum.byteOffset, sum.byteLength));
const proc = Bun.spawnSync(["node", `${root}scripts/transcribe-child.mjs`, `${root}src/fixture/model.json`, `${root}src/fixture/weights.json`, rawFile], {
	maxBuffer: 256 * 1024 * 1024,
});
if (proc.exitCode !== 0) throw new Error("transcription failed");
const rows = JSON.parse(proc.stdout.toString()) as [number, number, number, number][];
const notes: Note[] = rows.map(([start, duration, pitch, amplitude]) => ({
	start,
	end: start + duration,
	pitch,
	amplitude,
}));

const song = {
	title: "eat all the clocks",
	bpm: chart.bpm,
	key: "Em",
	meter: chart.meter,
	barNotes: describeBars(notes, barStarts),
	hintPerBar: hintsRaw.map((c) => (c === "" ? "N.C." : c)),
};
const gateway = createGateway({ apiKey });
const result = await generateText({
	model: gateway(MODEL),
	system: system23(),
	prompt: question23(song),
	temperature: 0,
	maxOutputTokens: 8000,
	maxRetries: 4,
	providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } },
} as Parameters<typeof generateText>[0]);
const json = result.text.match(/\{[\s\S]*\}/)?.[0];
const parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
if (!parsed?.success) {
	console.log("NO VALID ANSWER");
	process.exit(2);
}
const expanded = expandChords(parsed.output.chords);
const perBar = Array.from({ length: n }, (_, i) => expanded[i] ?? "");
const roots = rootScore(perBar, truth);
const dialect = truth
	.map((t, i) => ({ t, a: perBar[i]! }))
	.filter(({ t }) => isDialectBar(t))
	.filter(({ t, a }) => t.some((x) => x !== "" && strictSame(x, a))).length;
const ok = roots.right / roots.bearing >= hintScore.right / hintScore.bearing - 0.05;
console.log(
	`B4 on the corrected chart: roots ${roots.right}/${roots.bearing} (hints ${hintScore.right}/${hintScore.bearing}) | dialect ${dialect} | tokens ${result.totalUsage?.inputTokens}/${result.totalUsage?.outputTokens}`,
);
console.log(`S25B-G1 (draft within 5pp of the hint score): ${ok ? "PASS" : "FAIL"}`);
writeFileSync(
	`${root}results/study25b.json`,
	`${JSON.stringify(
		{
			version: 1,
			model: MODEL,
			chart: "corpus/mmkk-charts-eat-v131.json (chartVersion 131)",
			anchor: ANCHOR,
			bars: n,
			hintScore,
			roots,
			dialectStrict: dialect,
			strict: gradeStrict(perBar, truth),
			allowance21: gradeBars21(perBar, truth),
			answer: parsed.output,
			tokensIn: result.totalUsage?.inputTokens ?? 0,
			tokensOut: result.totalUsage?.outputTokens ?? 0,
			gate: { "S25B-G1": ok ? "PASS" : "FAIL" },
		},
		null,
		"\t",
	)}\n`,
);
rmSync(dir, { recursive: true, force: true });
