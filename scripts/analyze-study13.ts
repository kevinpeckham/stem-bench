/**
 * Study 13 analyzer (docs/BRIEF-STUDY13.md): the trigger restated and
 * S13-G2 per model over the committed results. No re-thresholding.
 */
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const arm1 = JSON.parse(readFileSync(`${root}results/study13-arm1.json`, "utf8"));
const arm2 = JSON.parse(readFileSync(`${root}results/study13-arm2.json`, "utf8"));

for (const s of arm1.songs as { slug: string; gated: boolean; grade: { right: number; bars: number; strictFirstRight: number; powerAllowance: number } }[]) {
	const pct = (100 * s.grade.right) / s.grade.bars;
	console.log(
		`arm 1 ${s.slug}${s.gated ? " (GATED)" : " (exploratory)"}: ${s.grade.right}/${s.grade.bars} (${pct.toFixed(1)}%), strict-first ${s.grade.strictFirstRight}, power allowance ${s.grade.powerAllowance}`,
	);
}
const gated1 = (arm1.songs as { gated: boolean; grade: { right: number; bars: number } }[]).find((s) => s.gated)!;
console.log(`trigger (< 90%): ${((100 * gated1.grade.right) / gated1.grade.bars).toFixed(1)}% → arm 2 ran\n`);

for (const c of arm2.cells as {
	slug: string;
	gated: boolean;
	model: string;
	outcome: string;
	grade: { right: number; bars: number } | null;
	delta: { fixes: number; breaks: number; changed: number } | null;
}[]) {
	if (!c.gated) {
		console.log(
			`arm 2 ${c.slug} ${c.model} (exploratory): ${c.outcome}${c.grade ? ` ${c.grade.right}/${c.grade.bars}, fixes ${c.delta!.fixes}, breaks ${c.delta!.breaks}` : ""}`,
		);
		continue;
	}
	const baseline = gated1.grade.right;
	const pass =
		c.outcome === "answered" &&
		c.grade!.right >= baseline &&
		c.delta!.fixes >= 2 * c.delta!.breaks &&
		c.delta!.fixes > 0;
	console.log(
		`S13-G2 ${c.model}: ${c.outcome === "answered" ? `${c.grade!.right}/${c.grade!.bars} (baseline ${baseline}), fixes ${c.delta!.fixes}, breaks ${c.delta!.breaks}, changed ${c.delta!.changed}` : c.outcome} → ${pass ? "PASS" : "FAIL"}`,
	);
}
