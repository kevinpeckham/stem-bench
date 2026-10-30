/**
 * Study 14 analyzer (docs/BRIEF-STUDY14.md): gate verdicts over
 * results/study14.json and study14-arm-e.json. No re-thresholding.
 */
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const run = JSON.parse(readFileSync(`${root}results/study14.json`, "utf8"));
const armE = JSON.parse(readFileSync(`${root}results/study14-arm-e.json`, "utf8"));

// G1: parsers
const checks = run.armB.checks as { slug: string; chordsEqual?: boolean; sectionsEqual?: boolean; parsedBars: number | null; wantBars?: number; barSeconds?: number; want?: number }[];
const mmkk = checks.filter((c) => c.chordsEqual !== undefined);
const summary = checks.find((c) => c.slug === "contrast-b-summary")!;
const sixEight = checks.find((c) => c.slug === "six-eight-eighths")!;
const g1 =
	mmkk.every((c) => c.chordsEqual && c.sectionsEqual && c.parsedBars === c.wantBars) &&
	summary.parsedBars === summary.wantBars &&
	Math.abs((sixEight.barSeconds ?? 0) - (sixEight.want ?? 2)) < 1e-6;
console.log(`S14-G1 (parsers round-trip + 6/8 convention): ${g1 ? "PASS" : "FAIL"}`);

// G2: the tritone control
const armA = run.armA as { itemId?: string; recording?: string; kind: string; ratio: number }[];
const rightSynth = armA.filter((a) => a.kind === "right-synth").map((a) => a.ratio);
const wrongSynth = armA.filter((a) => a.kind === "wrong-synth").map((a) => a.ratio);
const rightReal = armA.filter((a) => a.kind === "right-real").map((a) => a.ratio);
const wrongReal = armA.filter((a) => a.kind === "wrong-real").map((a) => a.ratio);
console.log(`\nTritone ratios — right synth ${rightSynth.map((r) => r.toFixed(1)).join(",")} | wrong synth ${wrongSynth.map((r) => r.toFixed(1)).join(",")} | right REAL ${rightReal.map((r) => r.toFixed(2)).join(",")} | wrong REAL ${wrongReal.map((r) => r.toFixed(2)).join(",")}`);
const g2 = rightSynth.concat(rightReal).every((r) => r >= 3) && wrongSynth.concat(wrongReal).every((r) => r < 3);
console.log(`S14-G2 (the shipped 3 separates everywhere): ${g2 ? "PASS" : "FAIL"} — real right charts ${rightReal.map((r) => r.toFixed(2)).join(" and ")} sit BELOW 3; real wrongs top at ${Math.max(...wrongReal).toFixed(2)}; the real-domain midpoint ≈ ${((Math.max(...wrongReal) + Math.min(...rightReal)) / 2).toFixed(2)}`);

// G3: the shipped aligner on letter-lands
const letter = (run.armC as { slug: string; samePiece: boolean; sections: { err: number | null; hedged: boolean }[] }[]).find((c) => c.slug === "letter-lands")!;
const nonEdge = letter.sections.slice(1, -1).map((s) => s.err ?? 99);
const within = nonEdge.filter((e) => e <= 0.5).length;
const edgesHedged = letter.sections[0]!.hedged && letter.sections[letter.sections.length - 1]!.hedged;
const g3 = within >= 6 && letter.samePiece && edgesHedged;
console.log(`\nS14-G3: non-edge boundaries ≤0.5 s: ${within}/${nonEdge.length}; samePiece ${letter.samePiece}; edges hedged ${edgesHedged} → ${g3 ? "PASS" : "FAIL"} (the aligner clause passes; samePiece fails via the constant)`);

// G4: the production-config reconciler
const gatedE = (armE.cells as { gated: boolean; grade: { right: number; bars: number } | null; delta: { fixes: number; breaks: number } | null; outcome: string }[]).find((c) => c.gated)!;
const g4 = gatedE.outcome === "answered" && gatedE.grade!.right >= 29 && gatedE.delta!.fixes >= 2 * gatedE.delta!.breaks && gatedE.delta!.fixes > 0;
console.log(`\nS14-G4 (production thinking config): ${gatedE.grade?.right}/${gatedE.grade?.bars} (baseline 29), fixes ${gatedE.delta?.fixes}, breaks ${gatedE.delta?.breaks} → ${g4 ? "PASS" : "FAIL"} (thinking-off run was 41/76 at 12/0)`);

console.log(`\nVERDICT: G1 ${g1 ? "PASS" : "FAIL"}, G2 ${g2 ? "PASS" : "FAIL"}, G3 ${g3 ? "PASS" : "FAIL"}, G4 ${g4 ? "PASS" : "FAIL"}`);
