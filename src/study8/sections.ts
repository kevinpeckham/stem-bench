/**
 * Study 8 (docs/BRIEF-STUDY8.md): production's `detectSectionsWithAi`
 * ported verbatim (stem-shovel origin/dev at v0.192.0, commit 95ed19aa —
 * system, question, SectionsAnswerSchema, the summary-chart CHART_NOTE
 * branch), the section ground truth derived from the committed mix
 * specs, the marked-chart generator, and the mechanical grading.
 * Pinned by tests/study8.test.ts.
 */
import * as v from "valibot";
import { scoreXml } from "../study3/musicxml.js";
import { musicXmlSummary } from "../study3/musicXmlSummary.js";
import { leadSheetMeasures } from "../study5/leadsheet.js";
import { barSeconds, type MixSpec } from "../study4/synth4.js";

export const SectionsAnswerSchema = v.object({
	sections: v.pipe(
		v.array(
			v.object({
				at: v.pipe(v.number(), v.minValue(0)),
				name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40)),
			}),
		),
		v.maxLength(64),
	),
	notes: v.optional(v.pipe(v.string(), v.maxLength(400)), ""),
});
export type SectionsAnswer = v.InferOutput<typeof SectionsAnswerSchema>;

/** The production chart note for a text-summary chart (the branch the bench sends). */
const CHART_NOTE_SUMMARY =
	"The song's own chart comes with the recording, as a measure-by-measure summary (key signatures, time signatures, tempo marks, repeats, rehearsal marks and chord symbols). First make sure it is the chart of this recording (the same piece: its harmony, meter and form match what you hear); if it plainly is not, set it aside, answer from the recording alone and say so in \"notes\".";

export function system8(withChart: boolean): string {
	return `You are a musician with perfect time who knows song form. Listen to the whole recording and split it into its sections (Intro, Verse, Pre-chorus, Chorus, Bridge, Solo, Interlude, Breakdown, Outro; "Verse 2" and "Chorus 2" for repeats when that helps). Report:
- "sections": the list in order, each {"at": seconds from the start where it begins, "name": its name}. The first begins at 0. A section is a stretch with its own material or function, usually 4 to 32 bars; place each boundary on the downbeat where the new section starts, precise to the tenth of a second. A pickup belongs to the section it leads into.
- "notes": one short sentence on anything uncertain.
Reply with JSON only, no prose, exactly: {"sections": [{"at": 0, "name": "Intro"}, {"at": 14.2, "name": "Verse"}], "notes": "..."}${
		withChart
			? `
${CHART_NOTE_SUMMARY} Take the sections from the chart where it marks them (rehearsal marks, words such as "Verse" or "Chorus", double bars, repeats and endings), and use the recording to place each in seconds, following the bars at the tempo you hear and counting repeats as played. If the recording departs from the chart, follow the recording and say so in "notes".`
			: ""
	}`;
}

export function question8(
	context: { tempo: string | null; meter: string | null; vocabulary: string[] },
	chartText: string | null,
): string {
	const facts = [
		context.tempo ? `tempo ${context.tempo} bpm` : null,
		context.meter ? `time signature ${context.meter}` : null,
	].filter(Boolean);
	const q = [
		facts.length ? `The song's settings say: ${facts.join(", ")}.` : null,
		context.vocabulary.length
			? `This band names its sections with words like: ${context.vocabulary.slice(0, 12).join(", ")}. Use those where they fit.`
			: null,
		"Where does each section of this song begin, and what is it?",
	]
		.filter(Boolean)
		.join(" ");
	return chartText ? `${q}\n\nThe chart, from the song:\n${chartText}` : q;
}

export interface SectionTruth {
	/** Section starts in seconds, including 0; names where the spec has them. */
	sections: { at: number; name: string | null }[];
}

export function sectionTruth(spec: MixSpec): SectionTruth {
	let t = 0;
	const sections: { at: number; name: string | null }[] = [];
	for (const s of spec.sections) {
		sections.push({ at: t, name: s.name ?? null });
		t += s.bars.length * barSeconds(spec.meter, s.bpm);
	}
	return { sections };
}

/** The chart-arm text: the lead sheet with a rehearsal mark at every section start. */
export function markedChart(spec: MixSpec): string {
	const measures = leadSheetMeasures(spec);
	let bar = 0;
	const names = ["A", "B", "C", "D", "E"];
	for (const [i, s] of spec.sections.entries()) {
		measures[bar]!.mark = s.name ?? names[i] ?? `S${i + 1}`;
		bar += s.bars.length;
	}
	return musicXmlSummary(
		scoreXml({ id: spec.id, title: spec.title, partName: "Lead Sheet", measures }),
	);
}

export interface Grade8 {
	boundariesTotal: number;
	boundariesFound: number;
	falseBoundaries: number;
	namesTotal: number;
	namesCorrect: number;
	sectionCountDelta: number;
}

/** Boundaries (section starts after 0) within ±4 s; names by case-insensitive prefix. */
export function grade8(answer: SectionsAnswer, truth: SectionTruth): Grade8 {
	const truthBoundaries = truth.sections.filter((s) => s.at > 0.5);
	const answered = answer.sections.filter((s) => s.at > 0.5);
	let found = 0;
	let namesTotal = 0;
	let namesCorrect = 0;
	for (const b of truthBoundaries) {
		const match = answered.find((a) => Math.abs(a.at - b.at) <= 4);
		if (match) found++;
		if (b.name) {
			namesTotal++;
			if (match && match.name.toLowerCase().startsWith(b.name.toLowerCase())) namesCorrect++;
		}
	}
	const falseBoundaries = answered.filter(
		(a) => !truthBoundaries.some((b) => Math.abs(a.at - b.at) <= 4),
	).length;
	return {
		boundariesTotal: truthBoundaries.length,
		boundariesFound: found,
		falseBoundaries,
		namesTotal,
		namesCorrect,
		sectionCountDelta: answer.sections.length - truth.sections.length,
	};
}

export function parseSections(text: string): { answer: SectionsAnswer | null; error: string | null } {
	const json = text.match(/\{[\s\S]*\}/)?.[0];
	if (!json) return { answer: null, error: "The model did not answer in the expected form" };
	let parsed: v.SafeParseResult<typeof SectionsAnswerSchema> | null = null;
	try {
		parsed = v.safeParse(SectionsAnswerSchema, JSON.parse(json));
	} catch {
		parsed = null;
	}
	if (!parsed?.success) return { answer: null, error: "The model's answer did not make sense" };
	return { answer: parsed.output, error: null };
}
