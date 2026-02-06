import { splitPdf } from './splitter.js';
import { initPdfJsWorker, loadPdfDocument } from './pdfLoader.js';
import { setupDragAndDrop } from './dragDrop.js';
import {
    getElements,
    hideProgress,
    renderDownloadLinks,
    resetResults,
    setFilename,
    setDropZoneActive,
    showFileInfo,
    showProgress,
    showResults,
    updateProgress
} from './ui.js';

initPdfJsWorker();

let pdfFile = null;
let pdfDocument = null;

const elements = getElements();

async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
        alert('Proszę wybrać plik PDF!');
        return;
    }

    pdfFile = file;
    setFilename(file.name);

    try {
        pdfDocument = await loadPdfDocument(file);
        showFileInfo(pdfDocument.numPages);
    } catch (error) {
        alert('Błąd wczytywania pliku PDF: ' + error.message);
    }
}

elements.uploadInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    await handleFile(file);
});

setupDragAndDrop(elements.dropZone, handleFile, setDropZoneActive);

elements.splitButton.addEventListener('click', async () => {
    if (!pdfDocument) {
        alert('Najpierw wybierz plik PDF!');
        return;
    }

    showProgress();
    resetResults();

    const totalPages = pdfDocument.numPages;

    try {
        const downloadLinksArray = await splitPdf(pdfFile, totalPages, updateProgress);

        hideProgress();
        showResults(totalPages);
        renderDownloadLinks(downloadLinksArray);

    } catch (error) {
        alert('Błąd podczas dzielenia PDF: ' + error.message);
        console.error(error);
        hideProgress();
    }
});
