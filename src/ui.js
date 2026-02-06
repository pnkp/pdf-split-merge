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

export function showMergeInfo(files) {
    elements.mergeCount.textContent = files.length;
    elements.mergeList.innerHTML = '';
    files.forEach((file) => {
        const item = document.createElement('li');
        item.textContent = `${file.name} (${formatFileSize(file.size)})`;
        elements.mergeList.appendChild(item);
    });
    elements.mergeInfo.style.display = 'block';
    elements.mergeResults.style.display = 'none';
}

export function showMergeResults(item) {
    elements.mergeDownloadLink.href = item.url;
    elements.mergeDownloadLink.download = item.filename;
    elements.mergeDownloadLink.textContent = `📄 ${item.filename}`;
    elements.mergeResults.style.display = 'block';
}

export function resetMergeResults() {
    elements.mergeResults.style.display = 'none';
    elements.mergeDownloadLink.href = '#';
    elements.mergeDownloadLink.textContent = 'Download merged PDF';
}
