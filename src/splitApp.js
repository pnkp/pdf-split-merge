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
  getDownloadSelectedButton,
} from "./uiSplit.js";

initPdfJsWorker();

let pdfFile = null;
let pdfDocument = null;

const elements = getSplitElements();
const downloadSelectedButton = getDownloadSelectedButton();

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

function getSelectedPages() {
  const checkboxes = Array.from(
    document.querySelectorAll(".preview-checkbox:checked"),
  );
  return checkboxes
    .map((checkbox) => Number(checkbox.dataset.page))
    .filter((page) => Number.isFinite(page))
    .sort((a, b) => a - b);
}

function updateDownloadSelectedState() {
  if (!downloadSelectedButton) return;
  const selectedPages = getSelectedPages();
  downloadSelectedButton.disabled = selectedPages.length === 0;
  downloadSelectedButton.textContent =
    selectedPages.length > 0
      ? `Download selected (${selectedPages.length})`
      : "Download selected";
}

function downloadSelected(items) {
  const selectedPages = getSelectedPages();
  if (selectedPages.length === 0) {
    alert("Please select at least one page!");
    return;
  }

  selectedPages.forEach((pageNum, index) => {
    const item = items[pageNum - 1];
    if (!item) return;
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }, index * 150);
  });
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
  if (downloadSelectedButton) {
    downloadSelectedButton.disabled = true;
    downloadSelectedButton.textContent = "Download selected";
  }

  const totalPages = pdfDocument.numPages;

  try {
    const downloadLinksArray = await splitPdf(
      pdfFile,
      totalPages,
      updateProgress,
    );

    hideProgress();
    showResults(totalPages);
    await renderSplitTiles(
      pdfDocument,
      downloadLinksArray,
      updateDownloadSelectedState,
    );
    if (downloadSelectedButton) {
      downloadSelectedButton.onclick = () =>
        downloadSelected(downloadLinksArray);
    }
  } catch (error) {
    alert("Error while splitting PDF: " + error.message);
    console.error(error);
    hideProgress();
  }
});
