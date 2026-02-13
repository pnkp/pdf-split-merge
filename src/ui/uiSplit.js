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
  modal: document.getElementById("preview-modal"),
  modalCanvas: document.getElementById("modal-canvas"),
  modalPageInfo: document.getElementById("modal-page-info"),
  modalClose: document.querySelector(".modal-close"),
  modalOverlay: document.querySelector(".modal-overlay"),
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
  { append = false, startIndex = 0, onReorder = null } = {},
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
    previewItem.draggable = true;
    previewItem.dataset.entryId = String(entry.id);

    const label = document.createElement("span");
    label.className = "preview-label";
    label.textContent = `${entry.fileName} - page ${entry.pageNum}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "preview-checkbox";
    checkbox.checked = true;
    checkbox.dataset.entryId = String(entry.id);
    previewItem.classList.toggle("is-selected", checkbox.checked);

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "preview-zoom-btn";
    previewButton.innerHTML = "&#128269;";
    previewButton.title = "Preview";
    previewButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await showPagePreview(entry);
    });

    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.textContent = "Download";
    downloadButton.className = "preview-download";
    downloadButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
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
    previewItem.appendChild(previewButton);
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

    setupDragAndDropForItem(previewItem, onReorder);

    await page.render({ canvasContext: context, viewport }).promise;
  }

  if (onSelectionChange) {
    onSelectionChange();
  }
}

function setupDragAndDropForItem(item, onReorder) {
  item.addEventListener("dragstart", (e) => {
    item.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.dataset.entryId);
  });

  item.addEventListener("dragend", () => {
    item.classList.remove("is-dragging");
    document.querySelectorAll(".preview-item.drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });
  });

  item.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const draggingItem = document.querySelector(".preview-item.is-dragging");
    if (!draggingItem || draggingItem === item) return;

    item.classList.add("drag-over");
  });

  item.addEventListener("dragleave", () => {
    item.classList.remove("drag-over");
  });

  item.addEventListener("drop", (e) => {
    e.preventDefault();
    item.classList.remove("drag-over");

    const draggingItem = document.querySelector(".preview-item.is-dragging");
    if (!draggingItem || draggingItem === item) return;

    const fromId = parseInt(draggingItem.dataset.entryId);
    const toId = parseInt(item.dataset.entryId);

    if (onReorder && fromId !== toId) {
      onReorder(fromId, toId);
    }
  });
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

export async function showPagePreview(entry) {
  if (!elements.modal || !elements.modalCanvas || !elements.modalPageInfo) return;

  const page = await entry.pdfDocument.getPage(entry.pageNum);

  const maxWidth = window.innerWidth * 0.85;
  const maxHeight = window.innerHeight * 0.75;

  let viewport = page.getViewport({ scale: 1 });

  const scaleX = maxWidth / viewport.width;
  const scaleY = maxHeight / viewport.height;
  const scale = Math.min(scaleX, scaleY, 3);

  viewport = page.getViewport({ scale });

  elements.modalCanvas.width = viewport.width;
  elements.modalCanvas.height = viewport.height;

  const context = elements.modalCanvas.getContext("2d");
  await page.render({ canvasContext: context, viewport }).promise;

  elements.modalPageInfo.textContent = `${entry.fileName} - Page ${entry.pageNum}`;
  elements.modal.style.display = "flex";

  document.body.style.overflow = "hidden";
}

export function hidePagePreview() {
  if (!elements.modal) return;
  elements.modal.style.display = "none";
  document.body.style.overflow = "";
}

function setupModalListeners() {
  if (elements.modalClose) {
    elements.modalClose.addEventListener("click", hidePagePreview);
  }

  if (elements.modalOverlay) {
    elements.modalOverlay.addEventListener("click", hidePagePreview);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && elements.modal?.style.display === "flex") {
      hidePagePreview();
    }
  });
}

setupModalListeners();
