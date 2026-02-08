import { splitPdf } from "./pdf/splitter.js";
import { initPdfJsWorker, loadPdfDocument } from "./pdf/pdfLoader.js";
import { setupDragAndDropMultiple } from "./ui/dragDrop.js";
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
} from "./ui/uiSplit.js";
import { downloadSelected } from "./pdf/downloadHandler.js";
import { createPdfFromSelected } from "./pdf/mergeHandler.js";
import {
  getSelectedIds,
  updateButtonState,
  getDownloadButtonText,
  getMergeButtonText,
} from "./utils/selectionManager.js";
import { validatePdfFiles, showError } from "./utils/errorHandler.js";

initPdfJsWorker();

let pdfFiles = [];
let pdfDocuments = [];
let splitEntries = [];
let nextEntryId = 1;

const elements = getSplitElements();
const downloadSelectedButton = getDownloadSelectedButton();
const createSelectedButton = getCreateSelectedButton();

async function handleFiles(files) {
  try {
    const newFiles = validatePdfFiles(files);
    pdfFiles = [...pdfFiles, ...newFiles];

    const newDocuments = await Promise.all(
      newFiles.map((file) => loadPdfDocument(file))
    );
    pdfDocuments = [...pdfDocuments, ...newDocuments];
    const totalPages = pdfDocuments.reduce(
      (sum, doc) => sum + doc.numPages,
      0
    );
    const newTotalPages = newDocuments.reduce(
      (sum, doc) => sum + doc.numPages,
      0
    );
    await runSplit({
      files: newFiles,
      documents: newDocuments,
      totalPagesAll: totalPages,
      totalPagesNew: newTotalPages,
      append: splitEntries.length > 0,
    });
  } catch (error) {
    showError("Error loading PDF file", error);
  }
}

function updateDownloadSelectedState() {
  if (!downloadSelectedButton) return;
  const selectedIds = getSelectedIds();
  updateButtonState(
    downloadSelectedButton,
    selectedIds,
    "Download selected pages",
    getDownloadButtonText
  );
}

function updateCreateSelectedState() {
  if (!createSelectedButton) return;
  const selectedIds = getSelectedIds();
  updateButtonState(
    createSelectedButton,
    selectedIds,
    "Merge selected",
    getMergeButtonText
  );
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
    await renderSplitTiles(
      entriesToRender,
      () => {
        updateDownloadSelectedState();
        updateCreateSelectedState();
      },
      handleRemoveEntry,
      { append, startIndex }
    );
    if (downloadSelectedButton) {
      downloadSelectedButton.onclick = () =>
        downloadSelected(
          splitEntries,
          pdfFiles.length,
          downloadSelectedButton,
          updateDownloadSelectedState
        );
    }
    if (createSelectedButton) {
      createSelectedButton.onclick = () =>
        createPdfFromSelected(
          splitEntries,
          createSelectedButton,
          updateCreateSelectedState
        );
    }
  } catch (error) {
    showError("Error while splitting PDF", error);
    hideProgress();
  }
}
