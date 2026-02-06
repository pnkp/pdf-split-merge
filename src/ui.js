const elements = {
    fileName: document.getElementById('filename'),
    pageCount: document.getElementById('page-count'),
    fileInfo: document.getElementById('file-info'),
    results: document.getElementById('results'),
    resultCount: document.getElementById('result-count'),
    progress: document.getElementById('progress'),
    progressLabel: document.getElementById('progress-label'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    downloadLinks: document.getElementById('download-links'),
    downloadAllButton: document.getElementById('download-all-btn'),
    dropZone: document.getElementById('drop-zone'),
    uploadInput: document.getElementById('pdf-upload'),
    splitButton: document.getElementById('split-btn'),
    mergeDropZone: document.getElementById('merge-drop-zone'),
    mergeInput: document.getElementById('merge-upload'),
    mergeInfo: document.getElementById('merge-info'),
    mergeCount: document.getElementById('merge-count'),
    mergeList: document.getElementById('merge-list'),
    mergeButton: document.getElementById('merge-btn'),
    mergeResults: document.getElementById('merge-results'),
    mergeDownloadLink: document.getElementById('merge-download-link')
};

export function getElements() {
    return elements;
}

export function setFilename(name) {
    elements.fileName.textContent = name;
}

export function showFileInfo(numPages) {
    elements.pageCount.textContent = numPages;
    elements.fileInfo.style.display = 'block';
    elements.results.style.display = 'none';
}

export function resetResults() {
    elements.results.style.display = 'none';
    elements.downloadLinks.innerHTML = '';
    setDownloadAllHandler(null);
}

export function showProgress() {
    elements.progress.style.display = 'block';
    updateProgress(0);
}

export function hideProgress() {
    elements.progress.style.display = 'none';
}

export function setProgressLabel(label) {
    elements.progressLabel.textContent = label;
}

export function showProgressWithLabel(label) {
    setProgressLabel(label);
    showProgress();
}

export function updateProgress(progress) {
    elements.progressFill.style.width = progress + '%';
    elements.progressText.textContent = progress + '%';
}

export function showResults(totalPages) {
    elements.results.style.display = 'block';
    elements.resultCount.textContent = totalPages;
}

export function renderDownloadLinks(items) {
    items.forEach((item) => {
        const linkDiv = document.createElement('div');
        linkDiv.className = 'download-item';

        const downloadLink = document.createElement('a');
        downloadLink.href = item.url;
        downloadLink.download = item.filename;
        downloadLink.textContent = `📄 ${item.filename}`;
        downloadLink.className = 'download-link';

        linkDiv.appendChild(downloadLink);
        elements.downloadLinks.appendChild(linkDiv);
    });
}

export function setDownloadAllHandler(handler) {
    if (!elements.downloadAllButton) return;
    elements.downloadAllButton.onclick = handler;
    elements.downloadAllButton.style.display = handler ? 'block' : 'none';
}

export function setDropZoneActive(isActive) {
    elements.dropZone.classList.toggle('drag-over', isActive);
}

export function setMergeDropZoneActive(isActive) {
    elements.mergeDropZone.classList.toggle('drag-over', isActive);
}

function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
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
    elements.mergeList.innerHTML = '';
}

function attachDragHandlers(item, onReorder) {
    item.addEventListener('dragstart', (event) => {
        item.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.dataset.index);
    });

    item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
    });

    item.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    });

    item.addEventListener('dragenter', (event) => {
        event.preventDefault();
        item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
    });

    item.addEventListener('drop', (event) => {
        event.preventDefault();
        item.classList.remove('drag-over');
        const fromIndex = Number(event.dataTransfer.getData('text/plain'));
        const toIndex = Number(item.dataset.index);
        if (!Number.isNaN(fromIndex) && !Number.isNaN(toIndex) && fromIndex !== toIndex) {
            onReorder(fromIndex, toIndex);
        }
    });
}

function createMergeListItem(file, index, onReorder, onRemove) {
    const item = document.createElement('li');
    const text = document.createElement('span');
    text.className = 'file-list-text';
    text.title = file.name;
    item.draggable = Boolean(onReorder);
    text.textContent = `${file.name} (${formatFileSize(file.size)})`;
    item.dataset.index = String(index);
    if (onReorder) {
        attachDragHandlers(item, onReorder);
    }
    if (onRemove) {
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'file-remove';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', (event) => {
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
    elements.mergeInfo.style.display = 'block';
    elements.mergeResults.style.display = 'none';
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
    elements.mergeDownloadLink.textContent = `📄 ${item.filename}`;
    elements.mergeDownloadLink.title = item.filename;
    elements.mergeResults.style.display = 'block';
}

export function resetMergeResults() {
    elements.mergeResults.style.display = 'none';
    elements.mergeDownloadLink.href = '#';
    elements.mergeDownloadLink.textContent = 'Download merged PDF';
}
