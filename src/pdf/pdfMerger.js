import { MERGED_PDF_SUFFIX } from '../utils/constants.js';

export async function mergePdfPages(entries, selectedIds) {
  const { PDFDocument } = window.PDFLib || {};
  if (!PDFDocument) {
    throw new Error('PDFLib not found. Make sure the pdf-lib script is loaded.');
  }

  const newPdf = await PDFDocument.create();
  for (const entryId of selectedIds) {
    const entry = entries.find((current) => current.id === entryId);
    if (!entry?.item) continue;
    const response = await fetch(entry.item.url);
    const blob = await response.blob();
    const sourcePdf = await PDFDocument.load(await blob.arrayBuffer());
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [0]);
    newPdf.addPage(copiedPage);
  }

  const pdfBytes = await newPdf.save();
  const filename = `selected${MERGED_PDF_SUFFIX}`;
  return { bytes: pdfBytes, filename };
}
