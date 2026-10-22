/**
 * Mechanical constraint checks for Study 2 (docs/BRIEF-STUDY2.md,
 * "Grading"). Every check verifies something the prompt EXPLICITLY asked
 * for (a stated bpm, a named drum present or absent, hits on named steps,
 * a stated feel parameter) — never a style convention the prompt left
 * implicit. An invalid reply fails every check. Committed and tested
 * before any scored run.
 */
import type { ValidBeat } from "../study2/validate.js";

export type BeatCheck =
	| { kind: "bpmBetween"; min: number; max: number }
	| { kind: "swingBetween"; min: number; max: number }
	| { kind: "humanizeAtMost"; max: number }
	| { kind: "kitIs"; kit: "acoustic" | "electronic" }
	| { kind: "voicePresent"; voice: string }
	| { kind: "voiceAbsent"; voice: string }
	| { kind: "hitsOnAll"; voice: string; steps: number[] }
	| { kind: "silentOnAll"; voice: string; steps: number[] }
	| { kind: "hitsOnSome"; voice: string; steps: number[]; atLeast: number }
	| { kind: "onlyVoices"; voices: string[] }
	| { kind: "totalHitsAtMost"; max: number }
	| { kind: "ghostIn"; voice: string }
	| { kind: "ghostShareAtLeast"; share: number }
	| { kind: "accentOnlyAt"; voice: string; steps: number[] }
	| { kind: "anyHitsInRange"; voices: string[]; from: number; to: number; atLeast: number }
	| { kind: "fxAtLeast"; key: "reverb" | "delay" | "fuzz" | "wah" | "bottom" | "air"; min: number };

/** Velocity per step for a voice, max across its rows: 0 rest, 1 ghost, 2 hit, 3 accent. */
function voiceCells(beat: ValidBeat, voice: string): number[] {
	const rows = beat.rows.filter((r) => r.voice === voice);
	if (!rows.length) return [];
	const len = rows[0]!.cells.length;
	const out = new Array<number>(len).fill(0);
	const vel: Record<string, number> = { ".": 0, o: 1, x: 2, X: 3 };
	for (const r of rows) {
		for (let i = 0; i < len; i++) out[i] = Math.max(out[i]!, vel[r.cells[i]!] ?? 0);
	}
	return out;
}
const sounds = (cells: number[], i: number) => (cells[i] ?? 0) > 0;

export function runCheck(beat: ValidBeat, c: BeatCheck): boolean {
	switch (c.kind) {
		case "bpmBetween":
			return beat.bpm !== null && beat.bpm >= c.min && beat.bpm <= c.max;
		case "swingBetween":
			return beat.swing !== null && beat.swing >= c.min && beat.swing <= c.max;
		case "humanizeAtMost":
			return beat.humanize === null || beat.humanize <= c.max;
		case "kitIs":
			return beat.kit === c.kit;
		case "voicePresent":
			return voiceCells(beat, c.voice).some((v) => v > 0);
		case "voiceAbsent":
			return !voiceCells(beat, c.voice).some((v) => v > 0);
		case "hitsOnAll": {
			const cells = voiceCells(beat, c.voice);
			return cells.length > 0 && c.steps.every((s) => sounds(cells, s));
		}
		case "silentOnAll": {
			const cells = voiceCells(beat, c.voice);
			return c.steps.every((s) => !sounds(cells, s));
		}
		case "hitsOnSome": {
			const cells = voiceCells(beat, c.voice);
			return c.steps.filter((s) => sounds(cells, s)).length >= c.atLeast;
		}
		case "onlyVoices":
			return beat.rows.every((r) => c.voices.includes(r.voice) || !/[oxX]/.test(r.cells));
		case "totalHitsAtMost": {
			const total = beat.rows.reduce((a, r) => a + (r.cells.match(/[oxX]/g)?.length ?? 0), 0);
			return total <= c.max;
		}
		case "ghostIn":
			return beat.rows.some((r) => r.voice === c.voice && r.cells.includes("o"));
		case "ghostShareAtLeast": {
			const all = beat.rows.flatMap((r) => r.cells.match(/[oxX]/g) ?? []);
			return all.length > 0 && all.filter((ch) => ch === "o").length / all.length >= c.share;
		}
		case "accentOnlyAt": {
			const cells = voiceCells(beat, c.voice);
			if (!cells.length) return false;
			return (
				c.steps.every((s) => cells[s] === 3) &&
				cells.every((v, i) => v !== 3 || c.steps.includes(i))
			);
		}
		case "anyHitsInRange": {
			let n = 0;
			for (const voice of c.voices) {
				const cells = voiceCells(beat, voice);
				for (let i = c.from; i <= c.to; i++) if (sounds(cells, i)) n++;
			}
			return n >= c.atLeast;
		}
		case "fxAtLeast": {
			const value = beat.fx?.[c.key];
			return typeof value === "number" && value >= c.min;
		}
	}
}

export function runChecks(
	beat: ValidBeat | null,
	checks: BeatCheck[],
): { passed: number; total: number; failures: string[] } {
	if (!beat) return { passed: 0, total: checks.length, failures: checks.map((c) => c.kind) };
	const failures = checks.filter((c) => !runCheck(beat, c)).map((c) => c.kind);
	return { passed: checks.length - failures.length, total: checks.length, failures };
}
