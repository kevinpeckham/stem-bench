/**
 * Study 34 (docs/CORPUS-STUDY34.md): the JAAH annotations as truth.
 * JAAH (MTG, ISMIR 2018, CC BY) gives per-part beat times and bars as
 * Harte-syntax chord strings ("|G:min |D:7 |"). This module parses one
 * annotation into per-bar symbols on the annotation's own timeline;
 * the transfer alignment (align.ts) maps that timeline onto the
 * fetched 78 transfer.
 */

/** Harte quality → the chart-symbol suffix the graders parse. */
const HARTE_QUALITY: Record<string, string> = {
	maj: "",
	min: "m",
	"7": "7",
	"9": "9",
	"13": "13",
	maj7: "maj7",
	maj9: "maj9",
	min7: "m7",
	min9: "m9",
	min6: "m6",
	maj6: "6",
	"6": "6",
	dim: "dim",
	dim7: "dim7",
	hdim7: "m7b5",
	sus4: "sus4",
	sus2: "sus2",
	aug: "aug",
	minmaj7: "mmaj7",
};

/**
 * "G:min7" → "Gm7". Parenthesized alterations are dropped (extensions
 * are ignored by the registered quality families) and Harte's
 * scale-degree inversions ("/5") are dropped with a flag, since a
 * degree is not a letter bass.
 */
export function harteToSymbol(harte: string): { symbol: string; droppedInversion: boolean } {
	const token = harte.trim();
	if (token === "N" || token === "&pause" || token === "X") return { symbol: "N.C.", droppedInversion: false };
	const m = token.match(/^([A-G][#b]?)(?::([^/()]*))?(\([^)]*\))?(\/.+)?$/);
	if (!m) return { symbol: "N.C.", droppedInversion: false };
	const quality = HARTE_QUALITY[m[2] ?? "maj"] ?? "";
	return { symbol: `${m[1]}${quality}`, droppedInversion: !!m[4] };
}

export interface JaahTruth {
	title: string;
	artist: string;
	key: string;
	metre: string;
	beatsPerBar: number;
	tuning: number;
	duration: number;
	/** Bar starts on the ANNOTATION's timeline, with chart symbols per bar. */
	bars: { start: number; chords: string[] }[];
	sections: { name: string; bar: number }[];
	beats: number[];
	droppedInversions: number;
	irregular: { part: string; surplusBeats: number }[];
}

interface JaahFile {
	title: string;
	artist: string;
	key: string;
	metre: string;
	tuning: number;
	duration: number;
	parts: { name: string; beats: number[]; chords: string[] }[];
}

export function parseJaah(j: JaahFile): JaahTruth {
	const beatsPerBar = Number(j.metre.split("/")[0]);
	if (!Number.isFinite(beatsPerBar) || beatsPerBar < 2) throw new Error(`bad metre ${j.metre}`);
	const bars: { start: number; chords: string[] }[] = [];
	const sections: { name: string; bar: number }[] = [];
	const beats: number[] = [];
	const irregular: { part: string; surplusBeats: number }[] = [];
	let dropped = 0;
	for (const part of j.parts) {
		const cells = part.chords
			.join(" ")
			.split("|")
			.map((c) => c.trim())
			.filter((c) => c.length > 0);
		// A part's beat count may run a few beats past its cells (a shouted
		// tag after the last chorded bar) or stop short of the written last
		// bar (the annotation ends at the final onset). Every part starts on
		// a downbeat, so grouping from the start is exact as long as every
		// bar still has its own downbeat and the mismatch stays under one
		// bar; the surplus is recorded, never silently regrouped.
		const wholeBars = cells.length;
		const surplus = part.beats.length - wholeBars * beatsPerBar;
		if (part.beats.length < (wholeBars - 1) * beatsPerBar + 1 || surplus > beatsPerBar || surplus <= -beatsPerBar)
			throw new Error(`${part.name}: ${cells.length} bar cells vs ${part.beats.length} beats`);
		if (surplus !== 0) irregular.push({ part: part.name, surplusBeats: surplus });
		sections.push({ name: part.name, bar: bars.length });
		for (let b = 0; b < wholeBars; b++) {
			const beatIndex = Math.min(b * beatsPerBar, part.beats.length - 1);
			const chords = cells[b]!
				.split(/\s+/)
				.filter(Boolean)
				.map((h) => {
					const r = harteToSymbol(h);
					if (r.droppedInversion) dropped++;
					return r.symbol;
				});
			bars.push({ start: part.beats[beatIndex]!, chords });
		}
		beats.push(...part.beats);
	}
	return {
		title: j.title,
		artist: j.artist,
		key: j.key,
		metre: j.metre,
		beatsPerBar,
		tuning: j.tuning,
		duration: j.duration,
		bars,
		sections,
		beats,
		droppedInversions: dropped,
		irregular,
	};
}
