export async function mergePdfs(files, onProgress) {
  if (!files || files.length === 0) {
    throw new Error("No files provided for merging.");
  }

  const { PDFDocument } = window.PDFLib || {};
  if (!PDFDocument) {
    throw new Error(
      "PDFLib not found. Make sure the pdf-lib script is loaded.",
    );
  }

  const mergedPdf = await PDFDocument.create();
  let processedFiles = 0;

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(
      sourcePdf,
      sourcePdf.getPageIndices(),
    );
    copiedPages.forEach((page) => mergedPdf.addPage(page));

    processedFiles += 1;
    if (onProgress) {
      const progress = Math.round((processedFiles / files.length) * 100);
      onProgress(progress);
    }
  }

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const baseFilename = files[0].name.replace(/\.pdf$/i, "");
  const filename = `${baseFilename}_merged.pdf`;

  return { url, filename };
}
