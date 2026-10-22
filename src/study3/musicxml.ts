/**
 * Study 3 score generator (docs/BRIEF-STUDY3.md, "The corpus"): a compact
 * committed spec becomes a MusicXML lead sheet — one part, treble clef,
 * chord symbols above simple chord-tone note content — which Verovio then
 * engraves. Tempo marks render as plain words ("120 bpm") beside a
 * machine-readable <sound tempo>, because the metronome glyph does not
 * survive rasterization (build smoke, 2026-10-22). Deterministic: the XML
 * is a pure function of the spec.
 */

export interface ChordSpec {
	step: string;
	alter?: number;
	/** MusicXML harmony kind: major, minor, dominant, major-seventh, minor-seventh, suspended-fourth, suspended-second, power, half-diminished, major-sixth, dominant-ninth, none… */
	kind: string;
	bassStep?: string;
	bassAlter?: number;
}

export interface MeasureSpec {
	key?: { fifths: number; mode: "major" | "minor" };
	time?: { beats: number; beatType: number };
	/** Renders as the words `"<n> bpm"` plus <sound tempo>. */
	tempo?: number;
	/** Rehearsal mark, e.g. "A Verse". */
	mark?: string;
	/** Plain words, e.g. "Chorus". */
	words?: string;
	repeat?: "forward" | "backward";
	ending?: 1 | 2;
	special?: "segno" | "coda" | "fine";
	/** Chords in order; empty array = an N.C. measure (whole rest + N.C. harmony). */
	chords: ChordSpec[];
}

export interface ScoreSpec {
	id: string;
	title: string;
	partName: string;
	measures: MeasureSpec[];
}

/** Semitone intervals per harmony kind, for picking the melody's chord tones. */
const KIND_TONES: Record<string, number[]> = {
	major: [0, 4, 7],
	minor: [0, 3, 7],
	dominant: [0, 4, 7, 10],
	"major-seventh": [0, 4, 7, 11],
	"minor-seventh": [0, 3, 7, 10],
	"suspended-fourth": [0, 5, 7],
	"suspended-second": [0, 2, 7],
	power: [0, 7],
	"half-diminished": [0, 3, 6, 10],
	"major-sixth": [0, 4, 7, 9],
	"dominant-ninth": [0, 4, 7, 10],
	diminished: [0, 3, 6],
	none: [],
};

/** The corpus writes chords as strings; this maps suffix → MusicXML kind. */
const SUFFIX_KIND: Record<string, string> = {
	"": "major",
	m: "minor",
	"7": "dominant",
	maj7: "major-seventh",
	m7: "minor-seventh",
	sus4: "suspended-fourth",
	sus2: "suspended-second",
	"5": "power",
	m7b5: "half-diminished",
	"6": "major-sixth",
	"9": "dominant-ninth",
	dim: "diminished",
};

/** "Ebmaj7", "A7/C#", "N.C." → a ChordSpec. Throws on a token the corpus should not contain. */
export function chordSpecOf(token: string): ChordSpec {
	if (/^n\.?c\.?$/i.test(token)) return { step: "C", kind: "none" };
	const m = token.match(/^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/);
	if (!m) throw new Error(`bad chord token: ${token}`);
	const kind = SUFFIX_KIND[m[3] ?? ""];
	if (kind === undefined) throw new Error(`bad chord suffix: ${token}`);
	return {
		step: m[1]!,
		...(m[2] === "#" ? { alter: 1 } : m[2] === "b" ? { alter: -1 } : {}),
		kind,
		...(m[4] ? { bassStep: m[4] } : {}),
		...(m[5] === "#" ? { bassAlter: 1 } : m[5] === "b" ? { bassAlter: -1 } : {}),
	};
}

const STEP_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const PC_SPELLING: [string, number][] = [
	["C", 0], ["C", 1], ["D", 0], ["E", -1], ["E", 0], ["F", 0],
	["F", 1], ["G", 0], ["A", -1], ["A", 0], ["B", -1], ["B", 0],
];

function pitchXml(pc: number, octave: number): string {
	const [step, alter] = PC_SPELLING[((pc % 12) + 12) % 12]!;
	return `<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch>`;
}

/** The measure's note content: chord tones in simple durations filling the bar (divisions = 4). */
function notesXml(m: MeasureSpec, time: { beats: number; beatType: number }, index: number): string {
	const chord = m.chords[0];
	if (!chord || chord.kind === "none") {
		const dur = time.beatType === 8 ? time.beats * 2 : time.beats * 4;
		return `<note><rest measure="yes"/><duration>${dur}</duration></note>`;
	}
	const root = ((STEP_PC[chord.step] ?? 0) + (chord.alter ?? 0) + 12) % 12;
	const tones = KIND_TONES[chord.kind] ?? KIND_TONES.major!;
	const tone = (k: number) => root + (tones[k % tones.length] ?? 0);
	const octaveOf = (pc: number) => (pc % 12 < 7 ? 5 : 4);
	const note = (pc: number, dur: number, type: string, dotted = false) =>
		`<note>${pitchXml(pc, octaveOf(pc))}<duration>${dur}</duration><type>${type}</type>${dotted ? "<dot/>" : ""}</note>`;
	if (time.beatType === 8) {
		// 6/8: two dotted quarters.
		return note(tone(index), 6, "quarter", true) + note(tone(index + 2), 6, "quarter", true);
	}
	if (time.beats === 3) {
		// 3/4: a dotted half.
		return note(tone(index), 12, "half", true);
	}
	// 4/4: two halves.
	return note(tone(index), 8, "half") + note(tone(index + 1), 8, "half");
}

function harmonyXml(c: ChordSpec): string {
	if (c.kind === "none") return `<harmony><kind text="N.C.">none</kind></harmony>`;
	return `<harmony><root><root-step>${c.step}</root-step>${c.alter ? `<root-alter>${c.alter}</root-alter>` : ""}</root><kind>${c.kind}</kind>${
		c.bassStep
			? `<bass><bass-step>${c.bassStep}</bass-step>${c.bassAlter ? `<bass-alter>${c.bassAlter}</bass-alter>` : ""}</bass>`
			: ""
	}</harmony>`;
}

export function scoreXml(spec: ScoreSpec): string {
	let time = { beats: 4, beatType: 4 };
	const measures = spec.measures
		.map((m, i) => {
			if (m.time) time = m.time;
			const attributes =
				i === 0 || m.key || m.time
					? `<attributes>${i === 0 ? "<divisions>4</divisions>" : ""}${
							m.key ? `<key><fifths>${m.key.fifths}</fifths><mode>${m.key.mode}</mode></key>` : ""
						}${m.time ? `<time><beats>${m.time.beats}</beats><beat-type>${m.time.beatType}</beat-type></time>` : ""}${
							i === 0 ? `<clef><sign>G</sign><line>2</line></clef>` : ""
						}</attributes>`
					: "";
			const directions = [
				m.tempo !== undefined
					? `<direction placement="above"><direction-type><words>${m.tempo} bpm</words></direction-type><sound tempo="${m.tempo}"/></direction>`
					: "",
				m.mark
					? `<direction placement="above"><direction-type><rehearsal>${m.mark}</rehearsal></direction-type></direction>`
					: "",
				m.words
					? `<direction placement="above"><direction-type><words>${m.words}</words></direction-type></direction>`
					: "",
				m.special === "segno"
					? `<direction placement="above"><direction-type><segno/></direction-type></direction>`
					: m.special === "coda"
						? `<direction placement="above"><direction-type><coda/></direction-type></direction>`
						: m.special === "fine"
							? `<direction placement="above"><direction-type><words>Fine</words></direction-type></direction>`
							: "",
			].join("");
			const left =
				m.repeat === "forward"
					? `<barline location="left"><bar-style>heavy-light</bar-style>${m.ending ? `<ending number="${m.ending}" type="start"/>` : ""}<repeat direction="forward"/></barline>`
					: m.ending
						? `<barline location="left"><ending number="${m.ending}" type="start"/></barline>`
						: "";
			const right =
				m.repeat === "backward"
					? `<barline location="right"><bar-style>light-heavy</bar-style>${m.ending ? `<ending number="${m.ending}" type="stop"/>` : ""}<repeat direction="backward"/></barline>`
					: m.ending
						? `<barline location="right"><ending number="${m.ending}" type="${m.ending === 1 ? "stop" : "discontinue"}"/></barline>`
						: i === spec.measures.length - 1
							? `<barline location="right"><bar-style>light-heavy</bar-style></barline>`
							: "";
			const harmonies = m.chords.length
				? m.chords.map(harmonyXml).join("")
				: harmonyXml({ step: "", kind: "none" });
			return `<measure number="${i + 1}">${left}${attributes}${directions}${harmonies}${notesXml(m, time, i)}${right}</measure>`;
		})
		.join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
 <work><work-title>${spec.title}</work-title></work>
 <part-list><score-part id="P1"><part-name>${spec.partName}</part-name></score-part></part-list>
 <part id="P1">
${measures}
 </part>
</score-partwise>`;
}
