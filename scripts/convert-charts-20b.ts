/**
 * Study 20b step 2 (docs/BRIEF-STUDY20B.md): the mechanical conversion of
 * the held-out charts (corpus/charts-src/*.md, committed verbatim; see
 * PROVENANCE.md there) into corpus/mmkk-charts-20b.json, the shape
 * mmkk-charts.json uses. Every rule is written here and nothing else is
 * applied:
 *
 * 1. A chart line `| a | b | c | d |` is a row of bars; a trailing `xN`
 *    outside the final pipe repeats the whole row N times.
 * 2. `%` repeats the previous bar's chord (across rows and repeats).
 * 3. A `## Name` heading with no rows repeats the bars of the earlier
 *    section with exactly that name. A parenthesized name ("Verse
 *    (Triads)") is its own section.
 * 4. A cell of `...` ends the chart: the recording continues (a fade)
 *    but no further bars are declared; the DTW subsequence alignment
 *    covers a chart shorter than its recording by design.
 * 5. A `key:` line inside a section is notation commentary (the chords
 *    are absolute) and is ignored.
 * 6. Chord cells are kept VERBATIM as the truth (G5(7) stays G5(7)).
 * 7. The header line `key: X , time: M , tempo: T` supplies meter and
 *    bpm.
 *
 * No cell in either chart carries two chords, so every truth bar is a
 * one-chord array.
 */
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;

interface ChartSong {
	slug: string;
	gated: false;
	bpm: number;
	meter: string;
	sections: { name: string; bars: string[][] }[];
}

function convert(slug: string): ChartSong {
	const text = readFileSync(`${root}corpus/charts-src/${slug}.md`, "utf8");
	const lines = text.split("\n");
	const header = lines.find((l) => /tempo:/.test(l));
	if (!header) throw new Error(`${slug}: no header line`);
	const bpm = Number(header.match(/tempo:\s*(\d+)/)?.[1]);
	const meter = header.match(/time:\s*([\d/]+)/)?.[1];
	if (!bpm || !meter) throw new Error(`${slug}: bad header`);

	const sections: { name: string; bars: string[][] }[] = [];
	const defined = new Map<string, string[][]>();
	let current: { name: string; rows: string[][] } | null = null;
	let previousChord = "";
	let ended = false;

	const flush = () => {
		if (!current) return;
		const bars = current.rows.flat().map((c) => [c]);
		if (current.rows.length > 0) {
			defined.set(current.name, bars);
			sections.push({ name: current.name, bars });
		} else {
			const earlier = defined.get(current.name);
			if (!earlier) throw new Error(`${current.name}: empty section with no earlier definition`);
			sections.push({ name: current.name, bars: earlier });
		}
		current = null;
	};

	for (const line of lines) {
		if (ended) break;
		const heading = line.match(/^##\s+(.+?)\s*$/);
		if (heading) {
			flush();
			current = { name: heading[1]!, rows: [] };
			continue;
		}
		if (!current) continue;
		if (/^key:/.test(line.trim())) continue; // rule 5
		if (!line.trim().startsWith("|")) continue;
		const repeat = Number(line.match(/\|\s*x(\d+)\s*$/)?.[1] ?? 1);
		const cells = line
			.replace(/x\d+\s*$/, "")
			.split("|")
			.map((c) => c.trim())
			.filter((c) => c !== "");
		const row: string[] = [];
		let stop = false;
		for (const cell of cells) {
			if (cell === "...") {
				stop = true;
				break;
			}
			const chord = cell === "%" ? previousChord : cell;
			if (!chord) throw new Error(`${slug}: % with no previous chord`);
			previousChord = chord;
			row.push(chord);
		}
		for (let r = 0; r < repeat; r++) current.rows.push(row);
		// A repeated row keeps its own cells; % was already resolved left to
		// right, so repeats carry the resolved chords (the row's last chord
		// also seeds the next row's %, as playing it would).
		if (row.length > 0) previousChord = row[row.length - 1]!;
		if (stop) {
			ended = true;
			break;
		}
	}
	flush();
	return { slug, gated: false, bpm, meter, sections };
}

const songs = [convert("peaceful-dreams"), convert("mop-heart")];
for (const s of songs) {
	const bars = s.sections.reduce((n, sec) => n + sec.bars.length, 0);
	console.log(`${s.slug}: ${s.bpm} bpm ${s.meter}, ${s.sections.length} sections, ${bars} bars`);
}
writeFileSync(`${root}corpus/mmkk-charts-20b.json`, `${JSON.stringify({ songs }, null, "\t")}\n`);
