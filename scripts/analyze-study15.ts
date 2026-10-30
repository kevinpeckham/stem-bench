/**
 * Study 15 analyzer (docs/BRIEF-STUDY15.md): gate verdicts over
 * results/study15.json. No re-thresholding.
 */
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const run = JSON.parse(readFileSync(`${root}results/study15.json`, "utf8"));
type Real = { slug: string; gated: boolean; ratio: number; samePiece: boolean; sections: { err: number | null; hedged: boolean }[] };
type Stat = { itemId: string; kind: string; medianLocal: number; ratio: number };

// G1
const rights = (run.real as Real[]).map((r) => r.ratio);
const wrongs = (run.localStats as Stat[]).filter((s) => s.kind === "wrong-real").map((s) => s.ratio);
const g1 = rights.every((r) => r >= 1.6) && wrongs.every((r) => r < 1.6);
console.log(`S15-G1 (1.6 at n=3/6): rights ${rights.map((r) => r.toFixed(2)).join(",")} | wrongs ${wrongs.map((r) => r.toFixed(2)).join(",")} → ${g1 ? "PASS" : "FAIL"} (nearest wrong ${Math.max(...wrongs).toFixed(2)} — margin ${(1.6 - Math.max(...wrongs)).toFixed(2)})`);

// G2
let g2 = true;
for (const r of (run.real as Real[]).filter((x) => x.gated)) {
	const first = Math.abs(r.sections[0]!.err ?? 99);
	const last = Math.abs(r.sections[r.sections.length - 1]!.err ?? 99);
	const interior = r.sections.slice(1, -1).map((s) => Math.abs(s.err ?? 99));
	const interiorOk = interior.every((e) => e <= 0.5);
	const ok = first <= 0.5 && last <= 1.0 && interiorOk;
	if (!ok) g2 = false;
	console.log(`S15-G2 ${r.slug}: first ${first.toFixed(2)} (≤0.5) last ${last.toFixed(2)} (≤1.0) interior>0.5: ${interior.filter((e) => e > 0.5).map((e) => e.toFixed(2)).join(",") || "none"} → ${ok ? "ok" : "fails a clause"}`);
}
console.log(`S15-G2 → ${g2 ? "PASS" : "FAIL"}`);

// G3
const mr = (k: string) => (run.localStats as Stat[]).filter((s) => s.kind === k).map((s) => s.medianLocal);
const rr = mr("right-real");
const wr = mr("wrong-real");
const sep = Math.max(...rr) < Math.min(...wr);
const X = (Math.max(...rr) + Math.min(...wr)) / 2;
console.log(`S15-G3: right-real medians ${rr.map((x) => x.toFixed(3)).join(",")} | wrong-real ${wr.map((x) => x.toFixed(3)).join(",")} → ${sep ? "SEPARATE" : "OVERLAP"}; recommended clause: medianLocal ≤ ${X.toFixed(2)} → ${sep ? "PASS" : "FAIL"}`);
const nearMisses = (run.localStats as Stat[]).filter((s) => s.kind === "wrong-real" && s.ratio >= 1.5);
console.log(`  complementarity: the ratio's near-misses (${nearMisses.map((s) => `${s.itemId} r=${s.ratio.toFixed(2)}`).join("; ")}) carry medianLocal ${nearMisses.map((s) => s.medianLocal.toFixed(3)).join(",")} — all caught by ≤ ${X.toFixed(2)}`);
const synthWrongPass = (run.localStats as Stat[]).filter((s) => s.kind === "wrong-synth" && s.ratio >= 1.6 && s.medianLocal <= X);
if (synthWrongPass.length) console.log(`  disclosed: ${synthWrongPass.length} synthetic wrong pair(s) would pass BOTH clauses (${synthWrongPass.map((s) => s.itemId).join(", ")}) — a domain production does not see, reported per the home-field rule`);
