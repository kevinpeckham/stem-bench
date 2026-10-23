/**
 * Builds the committed Study 4 fixture (docs/BRIEF-STUDY4.md): each mix
 * spec renders to audio (src/study4/synth4.ts), encodes to MP3 via
 * ffmpeg (production sends MP3 mixes), and — for metered items — gets a
 * matching lead-sheet summary for the chart arm, built by the Study 3
 * generator and summarized by the ported production musicXmlSummary.
 * Writes corpus/mixes/<id>.mp3 and corpus/fixture4.json (truth, chart
 * text, wrong-candidate transforms).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mixes from "../corpus/mixes.json";
import { parseChord, renderChord } from "../src/grading/symbols.js";
import { chordSpecOf, scoreXml, type MeasureSpec } from "../src/study3/musicxml.js";
import { musicXmlSummary } from "../src/study3/musicXmlSummary.js";
import { renderMix, truthOf, type MixSpec } from "../src/study4/synth4.js";

const FIFTHS: Record<string, number> = {
	"C major": 0, "G major": 1, "D major": 2, "A major": 3, "E major": 4, "B major": 5,
	"F major": -1, "Bb major": -2, "Eb major": -3, "Ab major": -4,
	"A minor": 0, "E minor": 1, "B minor": 2, "F# minor": 3, "C# minor": 4,
	"D minor": -1, "G minor": -2, "C minor": -3, "F minor": -4,
};

/** The registered wrong-candidate transforms (docs/BRIEF-STUDY4.md). */
export function wrongCandidates(truth: ReturnType<typeof truthOf>): {
	tempo: string;
	key: string;
	meter: string;
} {
	const bpm = truth.tempo ?? 120; // a pulseless song gets a concrete invented tempo
	const wrongTempo = truth.tempo === null ? 120 : bpm <= 100 ? bpm * 2 : Math.round(bpm / 2);
	const p = parseChord(truth.key.split(" ")[0]!);
	const mode = truth.key.endsWith("minor") ? "minor" : "major";
	const wrongKey = `${renderChord(((p.pc ?? 0) + 5) % 12, "")} ${mode}`;
	const meterMap: Record<string, string> = { "4/4": "3/4", "3/4": "6/8", "6/8": "4/4", free: "4/4" };
	return { tempo: String(wrongTempo), key: wrongKey, meter: meterMap[truth.meter]! };
}

function chartSummary(spec: MixSpec): string | null {
	if (spec.pulseless) return null;
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
	return musicXmlSummary(
		scoreXml({ id: spec.id, title: spec.title, partName: "Lead Sheet", measures }),
	);
}

mkdirSync(new URL("../corpus/mixes", import.meta.url).pathname, { recursive: true });
const dir = join(tmpdir(), `stem-bench4-${process.pid}`);
mkdirSync(dir, { recursive: true });
const out: unknown[] = [];
for (const [i, raw] of (mixes.mixes as MixSpec[]).entries()) {
	const spec = raw;
	const truth = truthOf(spec);
	const audio = renderMix(spec, 4000 + i);
	const rawFile = join(dir, `${spec.id}.raw`);
	writeFileSync(rawFile, Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength));
	const mp3 = `corpus/mixes/${spec.id}.mp3`;
	execFileSync("ffmpeg", [
		"-y", "-loglevel", "error",
		"-f", "f32le", "-ar", "22050", "-ac", "1", "-i", rawFile,
		"-codec:a", "libmp3lame", "-q:a", "4",
		new URL(`../${mp3}`, import.meta.url).pathname,
	]);
	const chart = chartSummary(spec);
	out.push({
		id: spec.id,
		title: spec.title,
		pulseless: spec.pulseless ?? false,
		truth,
		mp3,
		chart,
		wrong: wrongCandidates(truth),
	});
	console.log(
		`${spec.id}: ${truth.durationSec.toFixed(0)}s, ${truth.meter}, tempo ${truth.tempo ?? "null"}, ${truth.tempoChanges.length} tempo / ${truth.keyChanges.length} key changes${chart ? `, chart ${chart.split("\n").length} lines` : ""}`,
	);
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(
	new URL("../corpus/fixture4.json", import.meta.url).pathname,
	`${JSON.stringify({ version: 1, corpus: mixes.seed, items: out }, null, "\t")}\n`,
);
console.log(`\nfixture4.json: ${out.length} items`);
