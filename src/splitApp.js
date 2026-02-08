import { splitPdf } from "./splitter.js";
import { initPdfJsWorker, loadPdfDocument } from "./pdfLoader.js";
import { setupDragAndDropMultiple } from "./dragDrop.js";
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
  getCreateSelectedButton,
} from "./uiSplit.js";

initPdfJsWorker();

let pdfFiles = [];
let pdfDocuments = [];
let splitEntries = [];

const elements = getSplitElements();
const downloadSelectedButton = getDownloadSelectedButton();
const createSelectedButton = getCreateSelectedButton();

async function handleFiles(files) {
  const pdfCandidates = files.filter((file) => file.type === "application/pdf");
  if (pdfCandidates.length === 0) {
    alert("Please choose PDF files!");
    return;
  }

  const newFiles = pdfCandidates;
  pdfFiles = [...pdfFiles, ...newFiles];
  setFilename(
    pdfFiles.length === 1
      ? pdfFiles[0].name
      : `${pdfFiles.length} files selected`,
  );

  try {
    const newDocuments = await Promise.all(
      newFiles.map((file) => loadPdfDocument(file)),
    );
    pdfDocuments = [...pdfDocuments, ...newDocuments];
    const totalPages = pdfDocuments.reduce(
      (sum, doc) => sum + doc.numPages,
      0,
    );
    const newTotalPages = newDocuments.reduce(
      (sum, doc) => sum + doc.numPages,
      0,
    );
    showFileInfo(totalPages);
    await runSplit({
      files: newFiles,
      documents: newDocuments,
      totalPagesAll: totalPages,
      totalPagesNew: newTotalPages,
      append: splitEntries.length > 0,
    });
  } catch (error) {
    alert("Error loading PDF file: " + error.message);
  }
}

function getSelectedIndexes() {
  const checkboxes = Array.from(
    document.querySelectorAll(".preview-checkbox:checked"),
  );
  return checkboxes
    .map((checkbox) => Number(checkbox.dataset.index))
    .filter((index) => Number.isFinite(index))
    .sort((a, b) => a - b);
}

function updateDownloadSelectedState() {
  if (!downloadSelectedButton) return;
  const selectedIndexes = getSelectedIndexes();
  downloadSelectedButton.disabled = selectedIndexes.length === 0;
  downloadSelectedButton.textContent =
    selectedIndexes.length > 0
      ? `Download selected (${selectedIndexes.length})`
      : "Download selected";
}

function updateCreateSelectedState() {
  if (!createSelectedButton) return;
  const selectedIndexes = getSelectedIndexes();
  createSelectedButton.disabled = selectedIndexes.length === 0;
  createSelectedButton.textContent =
    selectedIndexes.length > 0
      ? `Create PDF (${selectedIndexes.length} pages)`
      : "Create PDF from selected";
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
  for (const index of pageNumbers) {
    const item = items[index]?.item;
    if (!item) continue;
    const response = await fetch(item.url);
    const blob = await response.blob();
    zip.file(item.filename, blob);
  }

  const baseFilename = pdfFiles.length
    ? "split"
    : "documents";
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
  const selectedIndexes = getSelectedIndexes();
  if (selectedIndexes.length === 0) {
    alert("Please select at least one page!");
    return;
  }

  if (selectedIndexes.length === 1) {
    const entry = items[selectedIndexes[0]];
    if (entry?.item) {
      triggerDownload(entry.item.url, entry.item.filename);
    }
    return;
  }

  if (downloadSelectedButton) {
    downloadSelectedButton.disabled = true;
    downloadSelectedButton.textContent = "Preparing ZIP";
  }

  buildZip(items, selectedIndexes)
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

async function createPdfFromSelected() {
  const selectedIndexes = getSelectedIndexes();
  if (selectedIndexes.length === 0) {
    alert("Please select at least one page!");
    return;
  }

  const { PDFDocument } = window.PDFLib || {};
  if (!PDFDocument) {
    alert("PDFLib not found. Make sure the pdf-lib script is loaded.");
    return;
  }

  if (createSelectedButton) {
    createSelectedButton.disabled = true;
    createSelectedButton.textContent = "Preparing PDF";
  }

  try {
    const newPdf = await PDFDocument.create();
    for (const index of selectedIndexes) {
      const entry = splitEntries[index];
      if (!entry?.item) continue;
      const response = await fetch(entry.item.url);
      const blob = await response.blob();
      const sourcePdf = await PDFDocument.load(await blob.arrayBuffer());
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [0]);
      newPdf.addPage(copiedPage);
    }

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const baseFilename = "selected";
    triggerDownload(url, `${baseFilename}_selected.pdf`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    alert("Error while creating PDF: " + error.message);
    console.error(error);
  } finally {
    updateCreateSelectedState();
  }
}

elements.uploadInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  await handleFiles(files);
  event.target.value = "";
});

setupDragAndDropMultiple(elements.dropZone, handleFiles, setDropZoneActive);

async function runSplit({
  files,
  documents,
  totalPagesAll,
  totalPagesNew,
  append,
}) {
  if (!documents.length) {
    alert("Please select PDF files first!");
    return;
  }

  showProgressWithLabel("Splitting PDF");
  if (!append) {
    resetResults();
    if (downloadSelectedButton) {
      downloadSelectedButton.disabled = true;
      downloadSelectedButton.textContent = "Download selected";
    }
    if (createSelectedButton) {
      createSelectedButton.disabled = true;
      createSelectedButton.textContent = "Create PDF from selected";
    }
  }

  let processedPages = 0;
  const newEntries = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const document = documents[index];
      const fileTotalPages = document.numPages;
      const fileItems = await splitPdf(file, fileTotalPages, (pageNum) => {
        const overall = Math.round(
          ((processedPages + pageNum) / totalPagesNew) * 100,
        );
        updateProgress(overall);
      });

      for (let pageNum = 1; pageNum <= fileTotalPages; pageNum += 1) {
        newEntries.push({
          item: fileItems[pageNum - 1],
          pdfDocument: document,
          pageNum,
          fileName: file.name,
        });
      }

      processedPages += fileTotalPages;
    }

    splitEntries = [...splitEntries, ...newEntries];
    const entriesToRender = append ? newEntries : splitEntries;
    const startIndex = append ? splitEntries.length - newEntries.length : 0;

    hideProgress();
    showResults(totalPagesAll);
    await renderSplitTiles(entriesToRender, () => {
      updateDownloadSelectedState();
      updateCreateSelectedState();
    }, { append, startIndex });
    if (downloadSelectedButton) {
      downloadSelectedButton.onclick = () => downloadSelected(splitEntries);
    }
    if (createSelectedButton) {
      createSelectedButton.onclick = () => createPdfFromSelected();
    }
  } catch (error) {
    alert("Error while splitting PDF: " + error.message);
    console.error(error);
    hideProgress();
  }
}
