/**
 * Study 2 analysis (docs/BRIEF-STUDY2.md): per model × arm — combined
 * score (invalid = 0, else checks passed/total), validity (first-try and
 * after the production retry), the S2-H1 comparative test (paired per
 * task, sign-flip permutation on R-default minus R-off combined scores),
 * and the economics (latency and token multiples). Reads every
 * results/study2-*.json present.
 */
import { readdirSync, readFileSync } from "node:fs";
import beats from "../corpus/beats.json";
import { mulberry32 } from "../src/fixture/synth.js";
import type { BeatCellRecord } from "../src/study2/runner.js";

const tasks = beats.tasks as { id: string }[];
const dir = new URL("../results/", import.meta.url).pathname;
const records: BeatCellRecord[] = readdirSync(dir)
	.filter((f) => f.startsWith("study2-") && f.endsWith(".json"))
	.flatMap((f) => JSON.parse(readFileSync(dir + f, "utf8")) as BeatCellRecord[]);
if (!records.length) throw new Error("no study2 results yet");

const models = [...new Set(records.map((r) => r.model))].sort();
/**
 * The registered combined score (BRIEF-STUDY2 "Grading"): 0 when no valid
 * reply survived the retry, else checks passed/total. A cell is excluded
 * (null) ONLY when the model never had its chance — the FIRST attempt
 * failed at the API layer. A first attempt that consumed the budget and
 * returned nothing, followed by a retry the empty assistant message makes
 * unplayable (the gateway 400s), is a scored failure of the arm, exactly
 * as production would experience it.
 */
const score = (r: BeatCellRecord | undefined): number | null => {
	if (r === undefined) return null;
	if (r.attempts[0]?.error?.startsWith("api:")) return null;
	if (r.outcome !== "valid") return 0;
	return r.checks.total ? r.checks.passed / r.checks.total : 1;
};
const cell = (m: string, t: string, a: string) =>
	records.find((r) => r.model === m && r.taskId === t && r.arm === a);

function permutationP(diffs: number[]): number {
	const rand = mulberry32(20261022);
	const observed = Math.abs(diffs.reduce((a, b) => a + b, 0));
	let extreme = 0;
	for (let i = 0; i < 20000; i++) {
		let sum = 0;
		for (const d of diffs) sum += rand() < 0.5 ? d : -d;
		if (Math.abs(sum) >= observed - 1e-12) extreme++;
	}
	return extreme / 20000;
}

console.log(
	"model".padEnd(34) +
		"\tarm\tscore\tvalid1st\tvalidFinal\trescued\tmed ms\tmean out-tok",
);
for (const m of models) {
	for (const arm of ["R-off", "R-default"] as const) {
		const rs = records.filter((r) => r.model === m && r.arm === arm);
		if (!rs.length) continue;
		// Scored cells include budget-exhausted failures (score 0); only
		// first-attempt API failures drop out.
		const scores = rs.map((r) => score(r)).filter((s): s is number => s !== null);
		const mean = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
		const v1 = rs.filter((r) => r.firstTryValid).length;
		const vf = rs.filter((r) => r.outcome === "valid").length;
		const rescued = rs.filter((r) => r.retryRescued).length;
		const lat = rs.map((r) => r.latencyMs).sort((a, b) => a - b);
		const med = lat[Math.floor(lat.length / 2)] ?? 0;
		const tout = rs.reduce((a, r) => a + r.tokensOut, 0) / Math.max(1, rs.length);
		console.log(
			`${m.padEnd(34)}\t${arm}\t${(100 * mean).toFixed(1)}%\t${v1}/${rs.length}\t${vf}/${rs.length}\t${rescued}\t${med}\t${Math.round(tout)}`,
		);
	}
}

console.log("\nS2-H1 (R-default minus R-off, paired per task; the production claim is no gain):");
for (const m of models) {
	const diffs = tasks
		.map((t) => {
			const d = score(cell(m, t.id, "R-default"));
			const o = score(cell(m, t.id, "R-off"));
			return d === null || o === null ? null : d - o;
		})
		.filter((d): d is number => d !== null);
	if (!diffs.length) continue;
	const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
	console.log(
		`  ${m.padEnd(34)} Δ ${(100 * mean).toFixed(1)} pts over ${diffs.length} tasks, p = ${permutationP(diffs).toFixed(4)}`,
	);
}

console.log("\nS2-H2 economics (R-default over R-off multiples):");
for (const m of models) {
	const agg = (arm: string, f: (r: BeatCellRecord) => number) => {
		const rs = records.filter((r) => r.model === m && r.arm === arm);
		return rs.reduce((a, r) => a + f(r), 0) / Math.max(1, rs.length);
	};
	const latOff = agg("R-off", (r) => r.latencyMs);
	const latDef = agg("R-default", (r) => r.latencyMs);
	const outOff = agg("R-off", (r) => r.tokensOut);
	const outDef = agg("R-default", (r) => r.tokensOut);
	if (!latOff || !latDef) continue;
	console.log(
		`  ${m.padEnd(34)} latency ×${(latDef / latOff).toFixed(1)} (${Math.round(latOff)} → ${Math.round(latDef)} ms), out tokens ×${(outDef / outOff).toFixed(1)} (${Math.round(outOff)} → ${Math.round(outDef)})`,
	);
}

console.log("\nMost-failed checks per arm (pooled):");
for (const arm of ["R-off", "R-default"] as const) {
	const counts = new Map<string, number>();
	for (const r of records.filter((x) => x.arm === arm)) {
		for (const f of r.checks.failures) counts.set(f, (counts.get(f) ?? 0) + 1);
	}
	const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
	console.log(`  ${arm}: ${top.map(([k, n]) => `${k}×${n}`).join("  ") || "none"}`);
}

const apiErrors = records.filter((r) => r.outcome === "api-error").length;
console.log(`\napi-error cells: ${apiErrors}`);
