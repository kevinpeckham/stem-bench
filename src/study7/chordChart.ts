/**
 * The band-chart variant for Study 7's chord arms (docs/BRIEF-STUDY7.md):
 * a mix spec rendered the way a band writes its chart document —
 * section headings and bar lines, four bars to a line — with, BY
 * CONSTRUCTION, no key signatures, no tempo marks, no "bpm" strings and
 * no time signature, so `chartStatedAnswer` must null the applied tempo
 * and meter (asserted by test: the generator's output never matches the
 * production regexes).
 */
import type { MixSpec } from "../study4/synth4.js";

export function chordChart(spec: MixSpec): string {
	const lines: string[] = [`# ${spec.title}`];
	const names = ["A", "B", "C", "D"];
	for (const [i, section] of spec.sections.entries()) {
		lines.push("", `## Section ${names[i] ?? i + 1}`);
		for (let b = 0; b < section.bars.length; b += 4) {
			lines.push(`| ${section.bars.slice(b, b + 4).join(" | ")} |`);
		}
	}
	return lines.join("\n");
}
