/**
 * Study 9 zero-spend run (docs/BRIEF-STUDY9.md): the four committed
 * instruments over every fixture item. Stems are rendered from the
 * committed specs + seeds, shuffled per the fixture's recorded order so
 * no instrument sees roles, and each instrument's raw output is written
 * to results/study9-instruments.json for the committed analyzer. No
 * model calls.
 */
import { writeFileSync } from "node:fs";
import fixture from "../corpus/fixture9.json";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import { renderParts, type MixSpec9 } from "../src/study9/parts.js";
import { dActivity, dKeyAgree, dProd, dStemTempo } from "../src/study9/instruments.js";

const specs = new Map<string, MixSpec9>(
	[...(mixes.mixes as MixSpec9[]), ...(mixes9.mixes as MixSpec9[])].map((m) => [m.id, m]),
);

/**
 * The registered secondary grid: what a production port would have —
 * D-prod's own tempo and meter, bars anchored at 0, out to the render's
 * end. (The primary read uses the fixture's truth grid.)
 */
function detectedGrid(bpm: number, meter: string, durationSec: number): number[] {
	const beats = meter === "3/4" ? 3 : 4;
	const barSec = (beats * 60) / Math.max(1, bpm);
	const starts: number[] = [];
	for (let t = 0; t <= durationSec - barSec / 2; t += barSec) starts.push(t);
	starts.push(durationSec);
	return starts;
}

const records: unknown[] = [];
for (const item of fixture.items) {
	const spec = specs.get(item.id);
	if (!spec) throw new Error(`no spec for ${item.id}`);
	const { parts } = renderParts(spec, item.seed);
	const stems = item.stemOrder.map((i: number) => parts[i]!.samples);
	const prod = dProd(stems);
	const stemTempo = dStemTempo(stems);
	const activityTruthGrid = dActivity(stems, item.barStarts);
	const activityDetectedGrid = dActivity(
		stems,
		detectedGrid(prod.tempo.bpm, prod.meter.value, item.truth.durationSec),
	);
	const keyAgree = dKeyAgree(stems);
	records.push({
		itemId: item.id,
		class: item.class,
		extra: item.extra,
		prod,
		stemTempo,
		activityTruthGrid: {
			boundaries: activityTruthGrid.boundaries,
			activeSets: activityTruthGrid.activeSets,
		},
		activityDetectedGrid: { boundaries: activityDetectedGrid.boundaries },
		keyAgree,
	});
	console.log(
		`${item.id}: prod ${prod.tempo.bpm} ${prod.meter.value} ${prod.key.value} | stem-tempo ${stemTempo.tempo.bpm}${stemTempo.octaveFlag ? " ⚑oct" : ""} | act ${activityTruthGrid.boundaries.map((b) => b.toFixed(0)).join(",") || "—"} | agree ${keyAgree.agreement.toFixed(2)} (${keyAgree.tonalStems} tonal)`,
	);
}
writeFileSync(
	new URL("../results/study9-instruments.json", import.meta.url).pathname,
	`${JSON.stringify({ version: 1, fixture: fixture.corpus, records }, null, "\t")}\n`,
);
console.log(`\nstudy9-instruments.json: ${records.length} items`);
