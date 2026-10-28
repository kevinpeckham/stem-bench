/**
 * Builds the committed Study 6b fixture (docs/BRIEF-STUDY6B.md, "Corpus"):
 * each corpus/scores6b.json spec becomes MusicXML (src/study3/musicxml.ts),
 * engraves through Study 3's pipeline (Verovio SVG → pdfkit +
 * svg-to-pdfkit, US letter; D-pdf arm only, so no PNGs), in two
 * conditions:
 *
 * - clean: `corpus/scores6b/<id>.pdf`, the current generator — Verovio's
 *   SMuFL text accidentals (\uea64 flat, \uea66 sharp) rewritten to chart
 *   ASCII (b, #) before pdfkit, as build-fixture3.ts/5.ts do since the
 *   Study 3 correction;
 * - corrupted: `corpus/scores6b/<id>-corrupt.pdf`, the registered
 *   generator option `dropChordAccidentals: true`: the SVG goes to pdfkit
 *   WITHOUT that rewrite, which is exactly the archived Study 3/5
 *   generator's path (pdfkit's WinAnsi text font has no music glyphs, so
 *   svg-to-pdfkit silently drops ♭/♯ from every chord symbol, while key
 *   signatures, drawn as glyph paths, stay engraved). The build does not
 *   trust that silence: it also engraves the page with the accidental
 *   codepoints deleted outright and requires the two to DRAW the same
 *   thing — their uncompressed content streams equal once no-ops are
 *   removed (`drawnContent`: the glyph-less path leaves an empty
 *   `BT /F1 720 Tf 0 Tr ET` in Helvetica where each accidental was, and a
 *   font resource for it, so the bytes differ while the page does not) —
 *   and it requires the SVG's only text accidentals to sit in chord
 *   symbols (`class="harm"`).
 *
 * corpus/fixture6b.json carries per item: group, pilot, the clean truth
 * summary (production musicXmlSummary of the clean XML), the corrupted
 * truth summary (musicXmlSummary of the XML with every chord's
 * alteration removed: what a faithful read of the corrupted page says),
 * the mechanical detectability label, and both PDF paths. PDF metadata
 * dates are fixed so the build is deterministic.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import scores from "../corpus/scores6b.json";
import { scoreXml } from "../src/study3/musicxml.js";
import { musicXmlSummary } from "../src/study3/musicXmlSummary.js";
import { accidentalChords, detectable, toSpec6b, type RawScore6b } from "../src/study6b/corpus.js";

const root = new URL("../", import.meta.url).pathname;
mkdirSync(`${root}corpus/scores6b`, { recursive: true });

/** The current generator's fix (build-fixture3.ts, verbatim). */
function asciiAccidentals(svg: string): string {
	return svg.replace(/[\u266d\uea64]/g, "b").replace(/[\u266f\uea66]/g, "#");
}
const TEXT_ACCIDENTAL = /[\u266d\u266f\uea64\uea66]/g;

const FIXED_DATE = new Date("2026-10-28T00:00:00Z");

/** Study 3's PDF step; `dropChordAccidentals` takes the archived glyph-less path. */
function engravePdf(
	svgs: string[],
	opts: { dropChordAccidentals: boolean; deleteCodepoints?: boolean; uncompressed?: boolean },
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({
			...(opts.uncompressed ? { compress: false } : {}),
			size: "LETTER",
			margin: 0,
			autoFirstPage: false,
			info: { CreationDate: FIXED_DATE, ModDate: FIXED_DATE },
		});
		const chunks: Buffer[] = [];
		doc.on("data", (c: Buffer) => chunks.push(c));
		doc.on("end", () => resolve(Buffer.concat(chunks)));
		doc.on("error", reject);
		for (const svg of svgs) {
			doc.addPage();
			const text = opts.dropChordAccidentals
				? opts.deleteCodepoints
					? svg.replace(TEXT_ACCIDENTAL, "")
					: svg
				: asciiAccidentals(svg);
			SVGtoPDF(doc, text, 18, 18, { width: 576, height: 756, preserveAspectRatio: "xMidYMin meet" });
		}
		doc.end();
	});
}

/**
 * What a PDF draws: its content streams with two kinds of no-op removed —
 * text objects that show no glyph, and fill-state settings (color space,
 * color, graphics state) that are overridden or restored before anything
 * is painted (svg-to-pdfkit writes one before each text object, empty or
 * not).
 */
function drawnContent(pdf: Buffer): string {
	const STATE = String.raw`/DeviceRGB cs\n[^\n]* scn\n/Gs\d+ gs\n\s*`;
	return [...pdf.toString("latin1").matchAll(/stream\n([\s\S]*?)\nendstream/g)]
		.map((m) =>
			m[1]!
				.replace(/BT\n[\s\S]*?\nET\n?/g, (block) => (/T[jJ]\b/.test(block) ? block : ""))
				.replace(new RegExp(`(?:${STATE})+(?=Q\\b)`, "g"), "")
				.replace(new RegExp(`${STATE}(?=/DeviceRGB cs)`, "g"), ""),
		)
		.join("\n");
}

const module_ = await createVerovioModule();
const out: unknown[] = [];
for (const raw of scores.scores as RawScore6b[]) {
	const xml = scoreXml(toSpec6b(raw));
	const summary = musicXmlSummary(xml);
	const corruptSummary = musicXmlSummary(scoreXml(toSpec6b(raw, { dropChordAccidentals: true })));
	const tk = new VerovioToolkit(module_);
	tk.setOptions({
		pageWidth: 2100,
		pageHeight: 2970,
		pageMarginLeft: 250,
		pageMarginRight: 250,
		pageMarginTop: 120,
		pageMarginBottom: 120,
		scale: 42,
	});
	if (!tk.loadData(xml)) throw new Error(`verovio refused ${raw.id}`);
	const pages = tk.getPageCount();
	const svgs: string[] = [];
	for (let p = 1; p <= pages; p++) svgs.push(tk.renderToSVG(p));
	// Every text accidental Verovio wrote must sit in a chord symbol.
	for (const svg of svgs) {
		const all = svg.match(TEXT_ACCIDENTAL)?.length ?? 0;
		const inHarm = [...svg.matchAll(/<g\b[^>]*class="harm"[^>]*>[\s\S]*?<\/g>/g)].reduce(
			(n, g) => n + (g[0].match(TEXT_ACCIDENTAL)?.length ?? 0),
			0,
		);
		if (all !== inHarm) throw new Error(`${raw.id}: ${all - inHarm} text accidental(s) outside chord symbols`);
	}
	const clean = await engravePdf(svgs, { dropChordAccidentals: false });
	const corrupt = await engravePdf(svgs, { dropChordAccidentals: true });
	const glyphless = await engravePdf(svgs, { dropChordAccidentals: true, uncompressed: true });
	const deleted = await engravePdf(svgs, { dropChordAccidentals: true, deleteCodepoints: true, uncompressed: true });
	if (drawnContent(glyphless) !== drawnContent(deleted))
		throw new Error(`${raw.id}: the glyph-less path drew something where the accidentals were`);
	const cleanDrawn = drawnContent(await engravePdf(svgs, { dropChordAccidentals: false, uncompressed: true }));
	if (accidentalChords(raw).length > 0 && cleanDrawn === drawnContent(glyphless))
		throw new Error(`${raw.id}: the corrupted page draws the same as the clean one`);
	const pdf = `corpus/scores6b/${raw.id}.pdf`;
	const pdfCorrupt = `corpus/scores6b/${raw.id}-corrupt.pdf`;
	writeFileSync(root + pdf, clean);
	writeFileSync(root + pdfCorrupt, corrupt);
	const isDetectable = detectable(raw);
	console.log(
		`${raw.id} (${raw.group}${raw.pilot ? ", pilot" : ""}): ${raw.measures.length} measures, ${pages} page(s), ${raw.measures.flatMap((m) => m.chords).length} chords, ${isDetectable ? "DETECTABLE" : "undetectable"}`,
	);
	out.push({
		id: raw.id,
		title: raw.title,
		group: raw.group,
		pilot: raw.pilot ?? false,
		measures: raw.measures.length,
		pages,
		detectable: isDetectable,
		summary,
		corruptSummary,
		pdf,
		pdfCorrupt,
	});
}
writeFileSync(
	`${root}corpus/fixture6b.json`,
	`${JSON.stringify({ version: 1, corpus: scores.seed, items: out }, null, "\t")}\n`,
);
console.log(`\nfixture6b.json: ${out.length} items, ${out.length * 2} PDFs`);
