/**
 * The production reply validation, ported (stem-shovel
 * src/lib/val/TextToBeatSchema.ts and the validity-determining steps of
 * src/lib/utils/parseTextToBeatReply.ts at v0.143.0): the first JSON
 * object, the schema, and the row-length check, with error messages
 * verbatim (the retry loop hands them back to the model, so the words are
 * part of the protocol). The port stops before drumPresetProject, which
 * cannot reject a schema-valid, length-checked reply (it only reshapes) —
 * disclosed in docs/BRIEF-STUDY2.md. Silent rows are dropped the way
 * production drops them, so a padded row that never sounds does not count
 * as a voice being present.
 */
import * as v from "valibot";
import { DRUM_DELAY_TIMES, DRUM_VOICE_IDS, type DrumSteps } from "./drums.js";

export const TextToBeatReplySchema = v.object({
	bpm: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(40), v.maxValue(240)))),
	swing: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
	note: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
	kit: v.optional(v.nullable(v.picklist(["acoustic", "electronic"]))),
	humanize: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
	fx: v.optional(
		v.nullable(
			v.object({
				reverb: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
				delay: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
				delayTime: v.optional(v.nullable(v.picklist(DRUM_DELAY_TIMES.map((d) => d.label)))),
				fuzz: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
				wah: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
				tilt: v.optional(v.nullable(v.pipe(v.number(), v.minValue(-100), v.maxValue(100)))),
				air: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
				bottom: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
			}),
		),
	),
	rows: v.pipe(
		v.array(
			v.object({
				voice: v.picklist(DRUM_VOICE_IDS),
				cells: v.pipe(v.string(), v.regex(/^[.oxX]+$/, "cells must be . o x X only")),
				pan: v.optional(v.nullable(v.pipe(v.number(), v.minValue(-100), v.maxValue(100)))),
			}),
		),
		v.minLength(1),
		v.maxLength(12),
	),
});
export type TextToBeatReply = v.InferOutput<typeof TextToBeatReplySchema>;

export interface ValidBeat {
	bpm: number | null;
	swing: number | null;
	humanize: number | null;
	kit: "acoustic" | "electronic" | null;
	note: string;
	fx: NonNullable<TextToBeatReply["fx"]> | null;
	/** Sounding rows only, cells as the reply's character strings. */
	rows: { voice: string; cells: string }[];
}

/** Throws with production's exact message on an invalid reply. */
export function validateBeatReply(text: string, steps: DrumSteps): ValidBeat {
	const json = text.match(/\{[\s\S]*\}/)?.[0];
	if (!json) throw new Error("no JSON object in the reply");
	let raw: unknown;
	try {
		raw = JSON.parse(json);
	} catch {
		throw new Error("the JSON does not parse");
	}
	const parsed = v.safeParse(TextToBeatReplySchema, raw);
	if (!parsed.success) {
		const issue = parsed.issues[0]!;
		const path = issue.path?.map((p) => String(p.key)).join(".") ?? "";
		throw new Error(`${path ? `${path}: ` : ""}${issue.message}`);
	}
	const reply = parsed.output;
	for (const row of reply.rows) {
		if (row.cells.length !== steps)
			throw new Error(
				`${row.voice}: ${row.cells.length} characters, but every row must be exactly ${steps}`,
			);
	}
	const sounding = reply.rows.filter((r) => /[oxX]/.test(r.cells));
	return {
		bpm: reply.bpm ?? null,
		swing: reply.swing ?? null,
		humanize: reply.humanize ?? null,
		kit: reply.kit ?? null,
		note: reply.note ?? "",
		fx: reply.fx ?? null,
		rows: (sounding.length ? sounding : reply.rows).map((r) => ({
			voice: r.voice,
			cells: r.cells,
		})),
	};
}
