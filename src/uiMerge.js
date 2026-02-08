const elements = {
  mergeDropZone: document.getElementById("merge-drop-zone"),
  mergeInput: document.getElementById("merge-upload"),
  mergeInfo: document.getElementById("merge-info"),
  mergeCount: document.getElementById("merge-count"),
  mergeList: document.getElementById("merge-list"),
  mergePreview: document.getElementById("merge-preview"),
  mergeButton: document.getElementById("merge-btn"),
  mergeResults: document.getElementById("merge-results"),
  mergeDownloadLink: document.getElementById("merge-download-link"),
  progress: document.getElementById("progress"),
  progressLabel: document.getElementById("progress-label"),
  progressFill: document.getElementById("progress-fill"),
  progressText: document.getElementById("progress-text"),
};

export function getMergeElements() {
  return elements;
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

export function setMergeDropZoneActive(isActive) {
  elements.mergeDropZone.classList.toggle("drag-over", isActive);
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function setMergeCount(count) {
  elements.mergeCount.textContent = count;
}

function clearMergeList() {
  elements.mergeList.innerHTML = "";
}

function clearMergePreviews() {
  if (!elements.mergePreview) return;
  elements.mergePreview.innerHTML = "";
}

async function renderMergePreviewItem(file) {
  if (!elements.mergePreview) return;

  const previewItem = document.createElement("div");
  previewItem.className = "preview-item";

  const canvas = document.createElement("canvas");
  const label = document.createElement("span");
  label.className = "preview-label";
  label.textContent = file.name;

  previewItem.appendChild(canvas);
  previewItem.appendChild(label);
  elements.mergePreview.appendChild(previewItem);

  if (!window.pdfjsLib) {
    label.textContent = "Preview unavailable";
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.5 });
  const context = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
}

export async function renderMergePreviews(files) {
  if (!elements.mergePreview) return;
  clearMergePreviews();
  for (const file of files) {
    try {
      await renderMergePreviewItem(file);
    } catch (error) {
      const fallback = document.createElement("div");
      fallback.className = "preview-item";
      const label = document.createElement("span");
      label.className = "preview-label";
      label.textContent = "Preview unavailable";
      fallback.appendChild(label);
      elements.mergePreview.appendChild(fallback);
    }
  }
}

function attachDragHandlers(item, onReorder) {
  item.addEventListener("dragstart", (event) => {
    item.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.dataset.index);
  });

  item.addEventListener("dragend", () => {
    item.classList.remove("is-dragging");
  });

  item.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });

  item.addEventListener("dragenter", (event) => {
    event.preventDefault();
    item.classList.add("drag-over");
  });

  item.addEventListener("dragleave", () => {
    item.classList.remove("drag-over");
  });

  item.addEventListener("drop", (event) => {
    event.preventDefault();
    item.classList.remove("drag-over");
    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    const toIndex = Number(item.dataset.index);
    if (
      !Number.isNaN(fromIndex) &&
      !Number.isNaN(toIndex) &&
      fromIndex !== toIndex
    ) {
      onReorder(fromIndex, toIndex);
    }
  });
}

function createMergeListItem(file, index, onReorder, onRemove) {
  const item = document.createElement("li");
  const text = document.createElement("span");
  text.className = "file-list-text";
  text.title = file.name;
  item.draggable = Boolean(onReorder);
  text.textContent = `${file.name} (${formatFileSize(file.size)})`;
  item.dataset.index = String(index);
  if (onReorder) {
    attachDragHandlers(item, onReorder);
  }
  if (onRemove) {
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "file-remove";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", (event) => {
      event.preventDefault();
      onRemove(index);
    });
    item.appendChild(text);
    item.appendChild(removeButton);
  } else {
    item.appendChild(text);
  }
  return item;
}

function renderMergeList(files, onReorder, onRemove) {
  files.forEach((file, index) => {
    const item = createMergeListItem(file, index, onReorder, onRemove);
    elements.mergeList.appendChild(item);
  });
}

function showMergeSection() {
  elements.mergeInfo.style.display = "block";
  elements.mergeResults.style.display = "none";
}

export function showMergeInfo(files, onReorder, onRemove) {
  setMergeCount(files.length);
  clearMergeList();
  renderMergeList(files, onReorder, onRemove);
  showMergeSection();
}

export function showMergeResults(item) {
  elements.mergeDownloadLink.href = item.url;
  elements.mergeDownloadLink.download = item.filename;
  elements.mergeDownloadLink.textContent = `PDF ${item.filename}`;
  elements.mergeDownloadLink.title = item.filename;
  elements.mergeResults.style.display = "block";
}

export function resetMergeResults() {
  elements.mergeResults.style.display = "none";
  elements.mergeDownloadLink.href = "#";
  elements.mergeDownloadLink.textContent = "Download merged PDF";
}
