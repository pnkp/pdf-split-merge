const elements = {
  results: document.getElementById("results"),
  resultCount: document.getElementById("result-count"),
  progress: document.getElementById("progress"),
  progressLabel: document.getElementById("progress-label"),
  progressFill: document.getElementById("progress-fill"),
  progressText: document.getElementById("progress-text"),
  downloadSelectedButton: document.getElementById("download-selected-btn"),
  createSelectedButton: document.getElementById("create-selected-btn"),
  splitGrid: document.getElementById("split-grid"),
  dropZone: document.getElementById("drop-zone"),
  uploadInput: document.getElementById("pdf-upload"),
};

export function getSplitElements() {
  return elements;
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

export function updateResultCount(totalPages) {
  elements.resultCount.textContent = totalPages;
}

export async function renderSplitTiles(
  entries,
  onSelectionChange,
  onRemove,
  { append = false, startIndex = 0 } = {},
) {
  if (!elements.splitGrid) return;
  if (!append) {
    elements.splitGrid.innerHTML = "";
  }

  function triggerDownload(item) {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const page = await entry.pdfDocument.getPage(entry.pageNum);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const previewItem = document.createElement("div");
    previewItem.className = "preview-item";

    const label = document.createElement("span");
    label.className = "preview-label";
    label.textContent = `${entry.fileName} - page ${entry.pageNum}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "preview-checkbox";
    checkbox.checked = true;
    checkbox.dataset.entryId = String(entry.id);
    previewItem.classList.toggle("is-selected", checkbox.checked);

    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.textContent = "Download";
    downloadButton.className = "preview-download";
    downloadButton.addEventListener("click", (event) => {
      event.preventDefault();
      triggerDownload(entry.item);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.className = "preview-remove";
    removeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (onRemove) {
        onRemove(entry.id, previewItem);
      }
    });

    previewItem.appendChild(canvas);
    previewItem.appendChild(label);
    previewItem.appendChild(checkbox);
    previewItem.appendChild(downloadButton);
    previewItem.appendChild(removeButton);
    elements.splitGrid.appendChild(previewItem);

    previewItem.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
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

export function getCreateSelectedButton() {
  return elements.createSelectedButton;
}

export function setDropZoneActive(isActive) {
  elements.dropZone.classList.toggle("drag-over", isActive);
}
