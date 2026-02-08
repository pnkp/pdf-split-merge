const elements = {
  fileName: document.getElementById("filename"),
  pageCount: document.getElementById("page-count"),
  fileInfo: document.getElementById("file-info"),
  results: document.getElementById("results"),
  resultCount: document.getElementById("result-count"),
  progress: document.getElementById("progress"),
  progressLabel: document.getElementById("progress-label"),
  progressFill: document.getElementById("progress-fill"),
  progressText: document.getElementById("progress-text"),
  downloadSelectedButton: document.getElementById("download-selected-btn"),
  splitGrid: document.getElementById("split-grid"),
  dropZone: document.getElementById("drop-zone"),
  uploadInput: document.getElementById("pdf-upload"),
  splitButton: document.getElementById("split-btn"),
};

export function getSplitElements() {
  return elements;
}

export function setFilename(name) {
  elements.fileName.textContent = name;
}

export function showFileInfo(numPages) {
  elements.pageCount.textContent = numPages;
  elements.fileInfo.style.display = "block";
  elements.results.style.display = "none";
}

export function resetResults() {
  elements.results.style.display = "none";
  if (elements.splitGrid) {
    elements.splitGrid.innerHTML = "";
  }
}

export function showProgressWithLabel(label) {
  elements.progressLabel.textContent = label;
  elements.progress.style.display = "block";
  updateProgress(0);
}

export function hideProgress() {
  elements.progress.style.display = "none";
}

export function updateProgress(progress) {
  elements.progressFill.style.width = progress + "%";
  elements.progressText.textContent = progress + "%";
}

export function showResults(totalPages) {
  elements.results.style.display = "block";
  elements.resultCount.textContent = totalPages;
}

export async function renderSplitTiles(pdfDocument, items, onSelectionChange) {
  if (!elements.splitGrid) return;
  elements.splitGrid.innerHTML = "";

  for (let pageNum = 1; pageNum <= items.length; pageNum += 1) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const previewItem = document.createElement("div");
    previewItem.className = "preview-item";

    const label = document.createElement("span");
    label.className = "preview-label";
    label.textContent = `Page ${pageNum}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "preview-checkbox";
    checkbox.checked = true;
    checkbox.dataset.page = String(pageNum);
    previewItem.classList.toggle("is-selected", checkbox.checked);

    const downloadLink = document.createElement("a");
    downloadLink.href = items[pageNum - 1].url;
    downloadLink.download = items[pageNum - 1].filename;
    downloadLink.textContent = "Download";
    downloadLink.className = "preview-download";

    previewItem.appendChild(canvas);
    previewItem.appendChild(label);
    previewItem.appendChild(checkbox);
    previewItem.appendChild(downloadLink);
    elements.splitGrid.appendChild(previewItem);

    previewItem.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      checkbox.checked = !checkbox.checked;
      previewItem.classList.toggle("is-selected", checkbox.checked);
      if (onSelectionChange) {
        onSelectionChange();
      }
    });

    await page.render({ canvasContext: context, viewport }).promise;
  }

  if (onSelectionChange) {
    onSelectionChange();
  }
}

export function getDownloadSelectedButton() {
  return elements.downloadSelectedButton;
}

export function setDropZoneActive(isActive) {
  elements.dropZone.classList.toggle("drag-over", isActive);
}
