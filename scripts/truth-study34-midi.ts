/**
 * Study 34 Tier 2 truth build from committed MIDIs (docs/
 * VALIDATION-STUDY34-INSTRUMENTS.md): the Cyber Hymnal's setting of
 * When the Roll Is Called Up Yonder (same source as its engraved PDF)
 * and sheetmusicsinger's typeset of the 1921 Three O'Clock in the
 * Morning. parseMidi + midiBarChords label each bar mechanically from
 * the exact pitches; half-bar harmonic rhythm is kept. Re-runnable;
 * the derived truth is committed next to the MIDIs.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseMidi } from "../src/study34/midi.js";
import { midiBarChords } from "../src/study34/midichords.js";

const root = new URL("../", import.meta.url).pathname;
mkdirSync(`${root}corpus/study34-midi`, { recursive: true });

const SLOTS = [
	{
		slug: "roll-called-up-yonder",
		midi: "/tmp/claude-1000/-home-exedev/15c4434d-c1b1-47c7-9cce-27c26b2ed169/scratchpad/sheets/hymn.mid",
		file: "roll-called-up-yonder.mid",
		source:
			"Cyber Hymnal setting of When the Roll Is Called Up Yonder (James M. Black, 1893, public domain), MIDI and matching engraved PDF via hymnary.org (CYBER/7381), fetched 2026-11-09",
		key: "Ab major",
		sections: [
			{ name: "Verse", bar: 0 },
			{ name: "Refrain", bar: 8 },
		],
		sectionsBasis: "the engraved score's Refrain mark at bar 8",
	},
	{
		slug: "three-oclock-waltz",
		midi: "/tmp/claude-1000/-home-exedev/15c4434d-c1b1-47c7-9cce-27c26b2ed169/scratchpad/sheets/waltz.mid",
		file: "three-oclock-waltz.mid",
		source:
			"sheetmusicsinger.com typeset of Three O'Clock in the Morning (Julian Robledo, 1921, public domain), MIDI and matching PDF, fetched 2026-11-09",
		key: "C major (chime intro in G)",
		sections: [
			{ name: "Chimes intro", bar: 0 },
			{ name: "Strain A", bar: 13 },
			{ name: "Strain B", bar: 46 },
			{ name: "Strain A repeat", bar: 77 },
			{ name: "Coda", bar: 110 },
		],
		sectionsBasis: "the extraction's exact repeat structure (bars 13-45 recur verbatim at 77-109); disclosed as derived, not engraved marks",
	},
];

for (const slot of SLOTS) {
	const data = readFileSync(slot.midi);
	copyFileSync(slot.midi, `${root}corpus/study34-midi/${slot.file}`);
	const { bars, num, den } = midiBarChords(parseMidi(new Uint8Array(data)));
	writeFileSync(
		`${root}corpus/study34-truth/${slot.slug}.truth.json`,
		`${JSON.stringify(
			{
				tier: 2,
				source: slot.source,
				midi: { file: `corpus/study34-midi/${slot.file}`, sha256: createHash("sha256").update(data).digest("hex") },
				extraction: "scripts/truth-study34-midi.ts (parseMidi + midiBarChords, half-bar granularity)",
				key: slot.key,
				metre: `${num}/${den}`,
				grading: "index-aligned per bar (Study 33 precedent); no time checks (docs/VALIDATION-STUDY34-INSTRUMENTS.md)",
				sections: slot.sections,
				sectionsBasis: slot.sectionsBasis,
				bars: bars.map((b) => b.chords),
			},
			null,
			"\t",
		)}\n`,
	);
	console.log(`${slot.slug}: ${bars.length} bars ${num}/${den}`);
}
