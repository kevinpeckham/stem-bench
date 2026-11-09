/**
 * Study 35 truth builder (run before registration): tier-3 sequence
 * truth for the eight new Josh Woodward slots. The SECTIONS constant
 * below is a transcription of each artist page's Tablature & Chords
 * symbols, auditable side by side against the verbatim blocks
 * committed in corpus/study35-chords-verbatim.json (tab-only lines are
 * not transcribed; swansong's bridge uses the artist's own
 * parenthesized symbol translations). Each song's transposition is
 * decided by the gated global key calibration (Study 34's instrument,
 * margin >= 0.02), chart shapes against the recording's chroma; a
 * refused gate means interval-invariant root grading, as for
 * jw-same-boat. Also measures the pickup column under the declared
 * grid prior (first audible sound against the placed bar one is left
 * to the study runner; here we record first sound against time zero
 * and the declared values for the record).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { chromagram } from "../src/study12/chroma.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { peakNorm } from "../src/study33/stereo.js";
import { calibrateKeyGlobal } from "../src/study34/seqalign.js";

const root = new URL("../", import.meta.url).pathname;

const SECTIONS: Record<string, Record<string, string[]>> = {
	"jw-gravity": {
		Intro: ["Em", "F", "Em", "Dm"],
		Verse: ["C", "Am", "G", "F", "C", "Am", "Em", "F"],
		Chorus: ["G/B", "C", "F", "G/B", "C", "F"],
		Bridge: ["C", "Em", "F", "G", "C", "Em", "F", "G"],
	},
	"jw-my-favorite-regret": {
		Intro: ["G", "C/G", "G", "G", "C/G", "G", "Em", "D/F#", "G", "C", "C", "D/F#", "G"],
		Verse: ["G", "Em", "C", "G", "D", "C", "G", "G", "Em", "C", "G", "D", "G"],
		Chorus: ["C", "G", "D", "G", "C", "Em", "Am", "D/F#", "G"],
		Bridge: ["F#m11", "B7", "Em", "G", "Am", "D/F#", "G/B", "Em", "Am", "D/F#", "G"],
	},
	"jw-california-lullabye": {
		Verse1: ["G", "Em", "C", "G", "G", "Em", "C", "D"],
		Chorus1: ["C", "G", "Am", "D", "Em"],
		Verse2: ["G", "Em", "C", "G", "G", "Em", "C", "D"],
		Chorus2: ["C", "G", "Am", "D", "Em", "Am", "Cm", "G"],
		Bridge: ["C", "B7", "Em", "C", "B7", "Em", "F", "Am", "G/B", "C", "D"],
		Chorus3: ["C", "G", "Am", "D", "Em", "C", "G", "Am", "D", "Em", "Am", "Cm", "G"],
		End: ["G", "Am", "G"],
	},
	"jw-swansong": {
		Verse: ["G", "D/F#", "Em"],
		Then: ["C", "G", "D/F#"],
		PreChorus: ["Am", "C", "G", "Am", "C", "D"],
		Chorus: ["Em", "C", "G", "Gmaj7", "Em", "C", "D", "G"],
		Bridge: ["Em", "B/Eb", "D", "Am", "Em", "B/Eb", "Am", "C", "D"],
		End: ["G", "Am", "C"],
	},
	"jw-afterglow": {
		Verse: ["A", "A", "E", "F", "A", "E"],
		Chorus: ["Bm", "D", "A"],
		Bridge: ["D", "A", "D", "A", "Bm", "D", "A"],
	},
	"jw-cherubs": {
		Verse: ["D", "G", "Bm", "A", "G"],
		Chorus: ["D", "G", "Bm", "G", "D"],
		Bridge: ["Em", "Bm", "Em", "Bm", "A", "Em", "Bm", "A", "G"],
		EndChorus: ["Bm", "G", "Bm", "A", "G", "Bm", "G", "Bm", "A", "G"],
	},
	"jw-goodbye-to-spring": {
		Intro: ["C", "Am", "F", "G"],
		Verse: ["C", "G", "Am", "F", "C", "F", "G", "C"],
		Chorus1: ["C", "Am", "F", "G"],
		Chorus2: ["C", "Am", "F", "G", "C", "Am", "F", "G", "Bb"],
		Bridge: ["E7", "Am", "E7", "F"],
		FinalChorus: ["C", "Am", "F", "G", "C", "Am", "F", "G", "C", "Am", "F", "G", "C", "Am", "F", "G"],
	},
	"jw-im-letting-go": {
		Intro: ["Cmaj7", "Em", "Cmaj7", "Em", "D"],
		Verse: ["Cmaj7", "Em", "Cmaj7", "Em", "D", "Cmaj7", "C", "Em", "D", "Cmaj7", "C", "D"],
		Chorus: ["G", "Em", "Bm", "D", "G", "Em", "Bm", "D"],
		Ending: ["C", "G", "D/F#", "C", "G", "D/F#", "C", "G", "D/F#", "C"],
	},
};

const meta = JSON.parse(readFileSync(`${root}corpus/study35-chords-verbatim.json`, "utf8")) as {
	songs: Record<string, { page: string; mp3: string; mp3Sha256: string; key: string; tempo: string; meter: string; licenseLine: string }>;
};

function loadRaw(path: string): Float32Array {
	const buf = readFileSync(path);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

mkdirSync(`${root}corpus/study35-truth`, { recursive: true });

for (const [slug, sections] of Object.entries(SECTIONS)) {
	const m = meta.songs[slug]!;
	const mono = peakNorm(loadRaw(`${root}corpus-study35/${slug}.mp3.22050.f32le.raw`));
	const span = audibleSpan(mono, 22050);
	const { frames } = chromagram(mono);
	const flat = Object.values(sections).flat();
	const cal = calibrateKeyGlobal(flat, frames);
	const margin = cal.score - cal.runnerUp;
	const accepted = margin >= 0.02;
	const truth = {
		tier: 3,
		source: `Artist's own chart: ${m.page} (Tablature & Chords), fetched 2026-11-09; symbols transcribed verbatim, tab-only lines excluded (full block in corpus/study35-chords-verbatim.json)`,
		license: `CC BY 4.0 (joshwoodward.com); audio from the artist's own MP3 link, sha256 ${m.mp3Sha256}`,
		declared: { key: m.key, bpm: Number.parseFloat(m.tempo), meter: m.meter.split(" ")[0], feel: m.meter.split(" ")[1] ?? null },
		sections,
		transposition: accepted
			? { value: cal.transpose, basis: `Gated global calibration (2026-11-09, pre-registration): transpose ${cal.transpose} at ${cal.score.toFixed(3)}, runner-up ${cal.runnerUp.toFixed(3)}, margin ${margin.toFixed(3)} ACCEPTED by the 0.02 gate` }
			: { value: null, basis: `Gated global calibration REFUSED (top ${cal.transpose} margin ${margin.toFixed(3)} < 0.02); roots graded transposition-invariantly (LCS over successive-root intervals)` },
		spanFirstSound: span.first,
		note: "Sequence truth only (Tier 3, Study 34 grading): LCS over collapsed roots (interval-invariant where the gate refused) and over quality families.",
	};
	writeFileSync(`${root}corpus/study35-truth/${slug}.truth.json`, `${JSON.stringify(truth, null, "\t")}\n`);
	console.log(
		`${slug}: ${flat.length} chords | declared ${m.key} ${m.tempo} ${m.meter} | transpose ${cal.transpose} margin ${margin.toFixed(3)} ${accepted ? "ACCEPT" : "REFUSE -> interval-invariant"} | first sound ${span.first.toFixed(2)}s`,
	);
}
console.log("corpus/study35-truth written");
