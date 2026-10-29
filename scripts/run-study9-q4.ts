/**
 * Study 9 Q4 side arm (docs/BRIEF-STUDY9.md): production's song-check
 * question, chartless and candidate-less — exactly Study 4's L-blind
 * cell — over the mix and over the harmonic stem (bass + comp). Pilot:
 * the six registered items on google/gemini-3-flash (runs on the
 * registering go-ahead). Matrix: all 21 items × both Study 8 models
 * (needs Kevin's go-ahead after the pilot is committed).
 *
 *   bun scripts/run-study9-q4.ts pilot|matrix
 */
import { readFileSync, writeFileSync } from "node:fs";
import fixture from "../corpus/fixture9.json";
import { runCell4s, type Cell4Record, type FixtureMix } from "../src/study4/runner4.js";

const PILOT_ITEMS = [
	"drift-4a",
	"waltz-a",
	"contrast-b",
	"mislead-rubato",
	"mislead-double",
	"mislead-pad",
];
const PILOT_MODELS = ["google/gemini-3-flash"];
const MATRIX_MODELS = ["google/gemini-3-flash", "google/gemini-3.5-flash"];

const mode = process.argv[2];
if (mode !== "pilot" && mode !== "matrix") throw new Error("usage: run-study9-q4.ts pilot|matrix");
const apiKey = (() => {
	const env = readFileSync(new URL("../.env.local", import.meta.url).pathname, "utf8");
	return env.match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/)?.[1] ?? "";
})();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY missing from .env.local");

const items = fixture.items.filter((i) => mode === "matrix" || PILOT_ITEMS.includes(i.id));
const models = mode === "matrix" ? MATRIX_MODELS : PILOT_MODELS;

const cells: (Cell4Record & { condition: "mix" | "stem" })[] = [];
for (const model of models) {
	for (const item of items) {
		for (const condition of ["mix", "stem"] as const) {
			const asMix: FixtureMix = {
				id: item.id,
				title: item.id,
				pulseless: false,
				truth: item.truth as FixtureMix["truth"],
				mp3: condition === "mix" ? item.mixMp3 : item.harmonicMp3,
				chart: null,
				wrong: { tempo: "", key: "", meter: "" },
			};
			const rec = await runCell4s(asMix, "L-blind", model, apiKey);
			cells.push({ ...rec, condition });
			console.log(
				`${model} ${item.id} ${condition}: ${rec.outcome}${rec.answer ? ` key ${rec.answer.key} tempo ${rec.answer.tempo}` : ` (${rec.error})`}`,
			);
		}
	}
}
const out = `../results/study9-q4-${mode}.json`;
writeFileSync(
	new URL(out, import.meta.url).pathname,
	`${JSON.stringify({ version: 1, mode, models, cells }, null, "\t")}\n`,
);
console.log(`\n${out.slice(3)}: ${cells.length} cells`);
