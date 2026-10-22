/**
 * Builds the committed Study 3 fixture (docs/BRIEF-STUDY3.md): each score
 * spec becomes MusicXML (src/study3/musicxml.ts), the production summary
 * of that XML (the ground truth), and the rendered artifacts the models
 * read — PNG per page (resvg over Verovio SVG, 1600 px wide) and a
 * multi-page PDF (pdfkit + svg-to-pdfkit, US letter). The honesty probe
 * renders its PNG at a destructively low 220 px. Everything lands in
 * corpus/scores/ and corpus/fixture3.json, committed, so scored runs
 * reproduce from the repo alone.
 */
import { readFileSync, writeFileSync } from "node:fs";
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";
import { Resvg } from "@resvg/resvg-js";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import scores from "../corpus/scores.json";
import { chordSpecOf, scoreXml, type MeasureSpec, type ScoreSpec } from "../src/study3/musicxml.js";
import { musicXmlSummary } from "../src/study3/musicXmlSummary.js";

interface RawMeasure {
	key?: [number, "major" | "minor"];
	time?: [number, number];
	tempo?: number;
	mark?: string;
	words?: string;
	repeat?: "forward" | "backward";
	ending?: 1 | 2;
	special?: "segno" | "coda" | "fine";
	chords: string[];
}
interface RawScore {
	id: string;
	title: string;
	partName: string;
	unreadable?: boolean;
	measures: RawMeasure[];
}

function toSpec(raw: RawScore): ScoreSpec {
	const measures: MeasureSpec[] = raw.measures.map((m) => ({
		...(m.key ? { key: { fifths: m.key[0], mode: m.key[1] } } : {}),
		...(m.time ? { time: { beats: m.time[0], beatType: m.time[1] } } : {}),
		...(m.tempo !== undefined ? { tempo: m.tempo } : {}),
		...(m.mark ? { mark: m.mark } : {}),
		...(m.words ? { words: m.words } : {}),
		...(m.repeat ? { repeat: m.repeat } : {}),
		...(m.ending ? { ending: m.ending } : {}),
		...(m.special ? { special: m.special } : {}),
		chords: m.chords.map(chordSpecOf),
	}));
	return { id: raw.id, title: raw.title, partName: raw.partName, measures };
}

const module_ = await createVerovioModule();
const out: {
	id: string;
	title: string;
	unreadable: boolean;
	measures: number;
	pages: number;
	summary: string;
	png: string[];
	pdf: string;
}[] = [];

for (const raw of scores.scores as RawScore[]) {
	const spec = toSpec(raw);
	const xml = scoreXml(spec);
	const summary = musicXmlSummary(xml);
	const tk = new VerovioToolkit(module_);
	tk.setOptions({
		pageWidth: 2100,
		// Long scores get a shorter page so Verovio paginates (scale does
		// not change what fits: page units scale with it). The corpus
		// needs multi-page items for the PDF arm to mean anything.
		pageHeight: raw.measures.length > 40 ? 1500 : 2970,
		pageMarginLeft: 250,
		pageMarginRight: 250,
		pageMarginTop: 120,
		pageMarginBottom: 120,
		scale: 42,
	});
	if (!tk.loadData(xml)) throw new Error(`verovio refused ${raw.id}`);
	const pages = tk.getPageCount();
	const pngWidth = raw.unreadable ? 80 : 1600;
	const pngs: string[] = [];
	const svgs: string[] = [];
	for (let p = 1; p <= pages; p++) {
		const svg = tk.renderToSVG(p);
		svgs.push(svg);
		// White background: the SVG is transparent, and a transparent PNG
		// composites to black-on-black for the model (pilot anatomy:
		// "the provided image is completely black").
		const png = new Resvg(svg, {
			background: "#ffffff",
			fitTo: { mode: "width", value: pngWidth },
		}).render().asPng();
		const file = `corpus/scores/${raw.id}-p${p}.png`;
		writeFileSync(new URL(`../${file}`, import.meta.url).pathname, png);
		pngs.push(file);
	}
	// The PDF: one US-letter page per Verovio page, the SVG scaled to fit.
	const pdfPath = `corpus/scores/${raw.id}.pdf`;
	await new Promise<void>((resolve, reject) => {
		const doc = new PDFDocument({ size: "LETTER", margin: 0, autoFirstPage: false });
		const chunks: Buffer[] = [];
		doc.on("data", (c: Buffer) => chunks.push(c));
		doc.on("end", () => {
			writeFileSync(new URL(`../${pdfPath}`, import.meta.url).pathname, Buffer.concat(chunks));
			resolve();
		});
		doc.on("error", reject);
		if (raw.unreadable) {
			// The probe's PDF must be as unreadable as its PNG: a vector SVG
			// stays crisp at any zoom (the pilot read it perfectly), so the
			// probe embeds the destroyed raster instead.
			for (const png of pngs) {
				doc.addPage();
				doc.image(new URL(`../${png}`, import.meta.url).pathname, 18, 18, { width: 576 });
			}
		} else {
			for (const svg of svgs) {
				doc.addPage();
				SVGtoPDF(doc, svg, 18, 18, { width: 576, height: 756, preserveAspectRatio: "xMidYMin meet" });
			}
		}
		doc.end();
	});
	console.log(
		`${raw.id}: ${raw.measures.length} measures, ${pages} page(s), summary ${summary.split("\n").length} lines${raw.unreadable ? " (probe)" : ""}`,
	);
	out.push({
		id: raw.id,
		title: raw.title,
		unreadable: raw.unreadable ?? false,
		measures: raw.measures.length,
		pages,
		summary,
		png: pngs,
		pdf: pdfPath,
	});
}
writeFileSync(
	new URL("../corpus/fixture3.json", import.meta.url).pathname,
	`${JSON.stringify({ version: 1, corpus: scores.seed, items: out }, null, "\t")}\n`,
);
const probe = out.find((o) => o.unreadable);
console.log(
	`\nfixture3.json: ${out.length} items (${out.filter((o) => o.pages > 1).length} multi-page), probe ${probe?.id} at 80 px`,
);
