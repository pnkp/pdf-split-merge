import { mergePdfs } from "./merger.js";
import { setupDragAndDropMultiple } from "./dragDrop.js";
import {
  getMergeElements,
  hideProgress,
  resetMergeResults,
  setMergeDropZoneActive,
  showMergeInfo,
  showMergeResults,
  showProgressWithLabel,
  updateProgress,
} from "./uiMerge.js";

let mergeFiles = [];

const elements = getMergeElements();

function mergeFileLists(existingFiles, newFiles) {
  return [...existingFiles, ...newFiles];
}

async function handleMergeFiles(files) {
  const pdfFiles = files.filter((file) => file.type === "application/pdf");
  if (pdfFiles.length === 0) {
    alert("Please choose PDF files!");
    return;
  }

  mergeFiles = mergeFileLists(mergeFiles, pdfFiles);
  showMergeInfo(mergeFiles, handleMergeReorder, handleMergeRemove);
  resetMergeResults();
}

function handleMergeReorder(fromIndex, toIndex) {
  const updated = [...mergeFiles];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  mergeFiles = updated;
  showMergeInfo(mergeFiles, handleMergeReorder, handleMergeRemove);
}

function handleMergeRemove(index) {
  mergeFiles = mergeFiles.filter((_, currentIndex) => currentIndex !== index);
  showMergeInfo(mergeFiles, handleMergeReorder, handleMergeRemove);
}

elements.mergeInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  await handleMergeFiles(files);
  event.target.value = "";
});

setupDragAndDropMultiple(
  elements.mergeDropZone,
  handleMergeFiles,
  setMergeDropZoneActive,
);

elements.mergeButton.addEventListener("click", async () => {
  if (mergeFiles.length === 0) {
    alert("Please select PDF files first!");
    return;
  }

  showProgressWithLabel("Merging PDFs");
  resetMergeResults();

  try {
    const mergedItem = await mergePdfs(mergeFiles, updateProgress);

    hideProgress();
    showMergeResults(mergedItem);
  } catch (error) {
    alert("Error while merging PDFs: " + error.message);
    console.error(error);
    hideProgress();
  }
});
