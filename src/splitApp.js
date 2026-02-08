import { splitPdf } from "./splitter.js";
import { initPdfJsWorker, loadPdfDocument } from "./pdfLoader.js";
import { setupDragAndDrop } from "./dragDrop.js";
import {
  getSplitElements,
  hideProgress,
  renderSplitTiles,
  resetResults,
  setFilename,
  setDropZoneActive,
  showFileInfo,
  showProgressWithLabel,
  showResults,
  updateProgress,
} from "./uiSplit.js";

initPdfJsWorker();

let pdfFile = null;
let pdfDocument = null;

const elements = getSplitElements();

async function handleFile(file) {
  if (!file || file.type !== "application/pdf") {
    alert("Please choose a PDF file!");
    return;
  }

  pdfFile = file;
  setFilename(file.name);

  try {
    pdfDocument = await loadPdfDocument(file);
    showFileInfo(pdfDocument.numPages);
  } catch (error) {
    alert("Error loading PDF file: " + error.message);
  }
}

elements.uploadInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  await handleFile(file);
});

setupDragAndDrop(elements.dropZone, handleFile, setDropZoneActive);

elements.splitButton.addEventListener("click", async () => {
  if (!pdfDocument) {
    alert("Please select a PDF file first!");
    return;
  }

  showProgressWithLabel("Splitting PDF");
  resetResults();

  const totalPages = pdfDocument.numPages;

  try {
    const downloadLinksArray = await splitPdf(
      pdfFile,
      totalPages,
      updateProgress,
    );

    hideProgress();
    showResults(totalPages);
    await renderSplitTiles(pdfDocument, downloadLinksArray);
  } catch (error) {
    alert("Error while splitting PDF: " + error.message);
    console.error(error);
    hideProgress();
  }
});
