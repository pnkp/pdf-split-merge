import { splitPdf } from "./splitter.js";
import { initPdfJsWorker, loadPdfDocument } from "./pdfLoader.js";
import { setupDragAndDropMultiple } from "./dragDrop.js";
import {
  getSplitElements,
  hideProgress,
  renderSplitTiles,
  resetResults,
  setDropZoneActive,
  showProgressWithLabel,
  showResults,
  updateProgress,
  getDownloadSelectedButton,
  getCreateSelectedButton,
  updateResultCount,
} from "./uiSplit.js";

initPdfJsWorker();

let pdfFiles = [];
let pdfDocuments = [];
let splitEntries = [];
let nextEntryId = 1;

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

function getSelectedIds() {
  const allItems = Array.from(document.querySelectorAll(".preview-item"));
  const selectedIds = [];

  for (const item of allItems) {
    const checkbox = item.querySelector(".preview-checkbox");
    if (checkbox && checkbox.checked) {
      const entryId = Number(checkbox.dataset.entryId);
      if (Number.isFinite(entryId)) {
        selectedIds.push(entryId);
      }
    }
  }

  return selectedIds;
}

function updateDownloadSelectedState() {
  if (!downloadSelectedButton) return;
  const selectedIds = getSelectedIds();
  downloadSelectedButton.disabled = selectedIds.length === 0;
  downloadSelectedButton.textContent =
    selectedIds.length > 0
      ? selectedIds.length === 1
        ? "Download selected page"
        : `Download selected pages (ZIP: ${selectedIds.length})`
      : "Download selected pages";
}

function updateCreateSelectedState() {
  if (!createSelectedButton) return;
  const selectedIds = getSelectedIds();
  createSelectedButton.disabled = selectedIds.length === 0;
  createSelectedButton.textContent =
    selectedIds.length > 0
      ? `Merge selected (${selectedIds.length} pages)`
      : "Merge selected";
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
  for (const entryId of pageNumbers) {
    const entry = items.find((current) => current.id === entryId);
    const item = entry?.item;
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
  const selectedIds = getSelectedIds();
  if (selectedIds.length === 0) {
    alert("Please select at least one page!");
    return;
  }

  if (selectedIds.length === 1) {
    const entry = items.find((current) => current.id === selectedIds[0]);
    if (entry?.item) {
      triggerDownload(entry.item.url, entry.item.filename);
    }
    return;
  }

  if (downloadSelectedButton) {
    downloadSelectedButton.disabled = true;
    downloadSelectedButton.textContent = "Preparing ZIP for selected pages";
  }

  buildZip(items, selectedIds)
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
  const selectedIds = getSelectedIds();
  if (selectedIds.length === 0) {
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
    createSelectedButton.textContent = "Preparing merge";
  }

  try {
    const newPdf = await PDFDocument.create();
    for (const entryId of selectedIds) {
      const entry = splitEntries.find((current) => current.id === entryId);
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

function handleRemoveEntry(entryId, element) {
  splitEntries = splitEntries.filter((entry) => entry.id !== entryId);
  if (element) {
    element.remove();
  }
  updateResultCount(splitEntries.length);
  updateDownloadSelectedState();
  updateCreateSelectedState();
}

function handleReorder(fromId, toId) {
  const fromIndex = splitEntries.findIndex((entry) => entry.id === fromId);
  const toIndex = splitEntries.findIndex((entry) => entry.id === toId);

  if (fromIndex === -1 || toIndex === -1) return;

  const [movedEntry] = splitEntries.splice(fromIndex, 1);
  splitEntries.splice(toIndex, 0, movedEntry);

  const grid = elements.splitGrid;
  if (!grid) return;

  const items = Array.from(grid.children);
  const fromItem = items.find((item) => item.dataset.entryId === String(fromId));
  const toItem = items.find((item) => item.dataset.entryId === String(toId));

  if (!fromItem || !toItem) return;

  if (fromIndex < toIndex) {
    toItem.after(fromItem);
  } else {
    toItem.before(fromItem);
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
      createSelectedButton.textContent = "Merge selected";
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
          id: nextEntryId,
          item: fileItems[pageNum - 1],
          pdfDocument: document,
          pageNum,
          fileName: file.name,
        });
        nextEntryId += 1;
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
    }, handleRemoveEntry, { append, startIndex, onReorder: handleReorder });
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
