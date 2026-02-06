import { splitPdf } from './splitter.js';
import { mergePdfs } from './merger.js';
import { initPdfJsWorker, loadPdfDocument } from './pdfLoader.js';
import { setupDragAndDrop, setupDragAndDropMultiple } from './dragDrop.js';
import {
    getElements,
    hideProgress,
    renderDownloadLinks,
    resetResults,
    setFilename,
    setDropZoneActive,
    setMergeDropZoneActive,
    showMergeInfo,
    showMergeResults,
    resetMergeResults,
    showFileInfo,
    showProgressWithLabel,
    showResults,
    updateProgress
} from './ui.js';

initPdfJsWorker();

let pdfFile = null;
let pdfDocument = null;
let mergeFiles = [];

const elements = getElements();

async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
        alert('Please choose a PDF file!');
        return;
    }

    pdfFile = file;
    setFilename(file.name);

    try {
        pdfDocument = await loadPdfDocument(file);
        showFileInfo(pdfDocument.numPages);
    } catch (error) {
        alert('Error loading PDF file: ' + error.message);
    }
}

function mergeFileLists(existingFiles, newFiles) {
    return [...existingFiles, ...newFiles];
}

async function handleMergeFiles(files) {
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
        alert('Please choose PDF files!');
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

elements.uploadInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    await handleFile(file);
});

setupDragAndDrop(elements.dropZone, handleFile, setDropZoneActive);

elements.mergeInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    await handleMergeFiles(files);
    event.target.value = '';
});

setupDragAndDropMultiple(elements.mergeDropZone, handleMergeFiles, setMergeDropZoneActive);

elements.splitButton.addEventListener('click', async () => {
    if (!pdfDocument) {
        alert('Please select a PDF file first!');
        return;
    }

    showProgressWithLabel('Splitting PDF');
    resetResults();

    const totalPages = pdfDocument.numPages;

    try {
        const downloadLinksArray = await splitPdf(pdfFile, totalPages, updateProgress);

        hideProgress();
        showResults(totalPages);
        renderDownloadLinks(downloadLinksArray);

    } catch (error) {
        alert('Error while splitting PDF: ' + error.message);
        console.error(error);
        hideProgress();
    }
});

elements.mergeButton.addEventListener('click', async () => {
    if (mergeFiles.length === 0) {
        alert('Please select PDF files first!');
        return;
    }

    showProgressWithLabel('Merging PDFs');
    resetMergeResults();

    try {
        const mergedItem = await mergePdfs(mergeFiles, updateProgress);

        hideProgress();
        showMergeResults(mergedItem);
    } catch (error) {
        alert('Error while merging PDFs: ' + error.message);
        console.error(error);
        hideProgress();
    }
});
