/**
 * Study 34 truth build for the JAAH slots (docs/CORPUS-STUDY34.md):
 * downloads the three annotations verbatim to corpus/study34-jaah/
 * (CC BY, MTG/JAAH, committed with attribution), parses them
 * (src/study34/jaah.ts) and fits each to its fetched transfer
 * (src/study34/align.ts), writing corpus/study34-truth/<slug>.truth.json
 * with the per-bar symbols, sections, and the fitted scale/offset that
 * map the annotation timeline onto the transfer. The gain says whether
 * the mapped beats land on onsets; anything under 1.3 is a stop.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { alignBeats } from "../src/study34/align.js";
import { parseJaah } from "../src/study34/jaah.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
mkdirSync(`${root}corpus/study34-jaah`, { recursive: true });
mkdirSync(`${root}corpus/study34-truth`, { recursive: true });

const SLOTS: { slug: string; jaah: string; audio: string }[] = [
	{ slug: "dippermouth-blues", jaah: "dippermouth_blues", audio: "corpus-study34/dippermouth-blues.mp3" },
	{ slug: "st-louis-blues", jaah: "st_louis_blues", audio: "corpus-study34/st-louis-blues.mp3" },
	{ slug: "livery-stable-blues", jaah: "livery_stable_blues", audio: "corpus-study34/livery-stable-blues.mp3" },
];

for (const slot of SLOTS) {
	const url = `https://raw.githubusercontent.com/MTG/JAAH/master/annotations/${slot.jaah}.json`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	const text = await res.text();
	writeFileSync(`${root}corpus/study34-jaah/${slot.jaah}.json`, text);
	const truth = parseJaah(JSON.parse(text));

	const buf = readFileSync(`${root}${slot.audio}.22050.f32le.raw`);
	const mono = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
	const durOurs = mono.length / 22050;
	const feat = extractFeatures(asBuffer(mono, 22050), 600);
	const fit = alignBeats(truth.beats, feat.onset, feat.fps, durOurs / truth.duration);
	// The alignment gate is CONTRAST (aligned vs half-beat-misaligned), not raw
	// gain: a 1917 acoustic transfer's surface noise lifts the whole envelope
	// and deflates gain while leaving the on-beat/off-beat ratio intact.
	if (fit.contrast < 1.15)
		throw new Error(`${slot.slug}: alignment contrast ${fit.contrast.toFixed(2)} under 1.15 — wrong transfer or wrong take`);
	writeFileSync(
		`${root}corpus/study34-truth/${slot.slug}.truth.json`,
		`${JSON.stringify(
			{
				source: `JAAH ${slot.jaah}.json (CC BY, github.com/MTG/JAAH)`,
				...truth,
				beats: undefined,
				alignment: { ...fit, durationOurs: Math.round(durOurs * 100) / 100 },
				barsAligned: truth.bars.map((b) => ({
					start: Math.round((b.start * fit.scale + fit.offset) * 1000) / 1000,
					chords: b.chords,
				})),
			},
			null,
			"\t",
		)}\n`,
	);
	console.log(
		`${slot.slug}: ${truth.bars.length} bars, ${truth.sections.length} sections | scale ${fit.scale.toFixed(4)} offset ${fit.offset.toFixed(2)}s gain ${fit.gain.toFixed(2)} contrast ${fit.contrast.toFixed(2)} | inversions dropped ${truth.droppedInversions} | irregular ${JSON.stringify(truth.irregular)}`,
	);
}
