const elements = {
    fileName: document.getElementById('filename'),
    pageCount: document.getElementById('page-count'),
    fileInfo: document.getElementById('file-info'),
    results: document.getElementById('results'),
    resultCount: document.getElementById('result-count'),
    progress: document.getElementById('progress'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    downloadLinks: document.getElementById('download-links'),
    dropZone: document.getElementById('drop-zone'),
    uploadInput: document.getElementById('pdf-upload'),
    splitButton: document.getElementById('split-btn')
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
