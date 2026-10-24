/**
 * Builds the committed Study 5 fixture (docs/BRIEF-STUDY5.md): for each
 * METERED Study 4 mix, the matching lead sheet engraves through Study
 * 3's exact pipeline (Verovio, white-background PNG at 1600 px, vector
 * PDF) into corpus/scores5/, and the production musicXmlSummary of the
 * same XML is the reader's ground truth. fixture5.json carries the mix
 * truth, the truth summary, and the artifact paths.
 */
import { writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";
import { Resvg } from "@resvg/resvg-js";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import mixes from "../corpus/mixes.json";
import { scoreXml } from "../src/study3/musicxml.js";
import { musicXmlSummary } from "../src/study3/musicXmlSummary.js";
import { leadSheetMeasures } from "../src/study5/leadsheet.js";
import { truthOf, type MixSpec } from "../src/study4/synth4.js";

mkdirSync(new URL("../corpus/scores5", import.meta.url).pathname, { recursive: true });
const module_ = await createVerovioModule();
const out: unknown[] = [];
for (const spec of mixes.mixes as MixSpec[]) {
	if (spec.pulseless) continue;
	const xml = scoreXml({
		id: spec.id,
		title: spec.title,
		partName: "Lead Sheet",
		measures: leadSheetMeasures(spec),
	});
	const summary = musicXmlSummary(xml);
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
	if (!tk.loadData(xml)) throw new Error(`verovio refused ${spec.id}`);
	const pages = tk.getPageCount();
	const pngs: string[] = [];
	const svgs: string[] = [];
	for (let p = 1; p <= pages; p++) {
		const svg = tk.renderToSVG(p);
		svgs.push(svg);
		const png = new Resvg(svg, { background: "#ffffff", fitTo: { mode: "width", value: 1600 } })
			.render()
			.asPng();
		const file = `corpus/scores5/${spec.id}-p${p}.png`;
		writeFileSync(new URL(`../${file}`, import.meta.url).pathname, png);
		pngs.push(file);
	}
	const pdfPath = `corpus/scores5/${spec.id}.pdf`;
	await new Promise<void>((resolve, reject) => {
		const doc = new PDFDocument({ size: "LETTER", margin: 0, autoFirstPage: false });
		const chunks: Buffer[] = [];
		doc.on("data", (c: Buffer) => chunks.push(c));
		doc.on("end", () => {
			writeFileSync(new URL(`../${pdfPath}`, import.meta.url).pathname, Buffer.concat(chunks));
			resolve();
		});
		doc.on("error", reject);
		for (const svg of svgs) {
			doc.addPage();
			SVGtoPDF(doc, svg, 18, 18, { width: 576, height: 756, preserveAspectRatio: "xMidYMin meet" });
		}
		doc.end();
	});
	out.push({
		id: spec.id,
		title: spec.title,
		truth: truthOf(spec),
		measures: leadSheetMeasures(spec).length,
		truthSummary: summary,
		png: pngs,
		pdf: pdfPath,
		pages,
	});
	console.log(`${spec.id}: ${pages} page(s), summary ${summary.split("\n").length} lines`);
}
writeFileSync(
	new URL("../corpus/fixture5.json", import.meta.url).pathname,
	`${JSON.stringify({ version: 1, corpus: mixes.seed, items: out }, null, "\t")}\n`,
);
console.log(`\nfixture5.json: ${out.length} items`);
