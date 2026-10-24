/**
 * Study 5 lead sheets (docs/BRIEF-STUDY5.md): each metered Study 4 mix
 * spec becomes the MeasureSpec list its chart arm's summary was built
 * from — the same mapping build-fixture4.ts used — so the engraved page
 * Study 5's reader reads is the score OF the mix the listener hears.
 */
import { chordSpecOf, type MeasureSpec } from "../study3/musicxml.js";
import type { MixSpec } from "../study4/synth4.js";

export const FIFTHS: Record<string, number> = {
	"C major": 0, "G major": 1, "D major": 2, "A major": 3, "E major": 4, "B major": 5,
	"F major": -1, "Bb major": -2, "Eb major": -3, "Ab major": -4,
	"A minor": 0, "E minor": 1, "B minor": 2, "F# minor": 3, "C# minor": 4,
	"D minor": -1, "G minor": -2, "C minor": -3, "F minor": -4,
};

export function leadSheetMeasures(spec: MixSpec): MeasureSpec[] {
	const time =
		spec.meter === "4/4"
			? { beats: 4, beatType: 4 }
			: spec.meter === "3/4"
				? { beats: 3, beatType: 4 }
				: { beats: 6, beatType: 8 };
	const measures: MeasureSpec[] = [];
	for (const [si, s] of spec.sections.entries()) {
		for (const [bi, bar] of s.bars.entries()) {
			const first = bi === 0;
			measures.push({
				...(first && (si === 0 || s.key !== spec.sections[si - 1]!.key)
					? { key: { fifths: FIFTHS[s.key] ?? 0, mode: s.key.endsWith("minor") ? "minor" : "major" } }
					: {}),
				...(first && si === 0 ? { time } : {}),
				...(first && (si === 0 || s.bpm !== spec.sections[si - 1]!.bpm) ? { tempo: s.bpm } : {}),
				chords: [chordSpecOf(bar)],
			});
		}
	}
	return measures;
}
