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
    await runSplit();
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

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function buildZip(items, pageNumbers) {
  if (!window.JSZip) {
    throw new Error("ZIP library not available.");
  }

  const zip = new window.JSZip();
  for (const pageNum of pageNumbers) {
    const item = items[pageNum - 1];
    if (!item) continue;
    const response = await fetch(item.url);
    const blob = await response.blob();
    zip.file(item.filename, blob);
  }

  const baseFilename = pdfFile
    ? pdfFile.name.replace(/\.pdf$/i, "")
    : "split";
  const zipBlob = await zip.generateAsync(
    { type: "blob" },
    (metadata) => {
      if (!downloadSelectedButton) return;
      const percent = Math.round(metadata.percent);
      downloadSelectedButton.textContent = `Preparing ZIP (${percent}%)`;
    },
  );
  return { blob: zipBlob, filename: `${baseFilename}_pages.zip` };
}

function downloadSelected(items) {
  const selectedPages = getSelectedPages();
  if (selectedPages.length === 0) {
    alert("Please select at least one page!");
    return;
  }

  if (selectedPages.length === 1) {
    const item = items[selectedPages[0] - 1];
    if (item) {
      triggerDownload(item.url, item.filename);
    }
    return;
  }

  if (downloadSelectedButton) {
    downloadSelectedButton.disabled = true;
    downloadSelectedButton.textContent = "Preparing ZIP";
  }

  buildZip(items, selectedPages)
    .then(({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      triggerDownload(url, filename);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    })
    .catch((error) => {
      alert("Error while preparing ZIP: " + error.message);
      console.error(error);
    })
    .finally(() => {
      if (downloadSelectedButton) {
        downloadSelectedButton.disabled = false;
        updateDownloadSelectedState();
      }
    });
}

elements.uploadInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  await handleFile(file);
});

setupDragAndDrop(elements.dropZone, handleFile, setDropZoneActive);

async function runSplit() {
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
}
