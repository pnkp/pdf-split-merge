import { downloadBlobAsFile } from '../utils/fileDownloader.js';
import { mergePdfPages } from './pdfMerger.js';
import { getSelectedIds } from '../utils/selectionManager.js';
import { validateSelection, showError } from '../utils/errorHandler.js';
import { PDF_MIME_TYPE } from '../utils/constants.js';

export async function createPdfFromSelected(
  splitEntries,
  createButton,
  updateButtonState
) {
  const selectedIds = getSelectedIds();

  try {
    validateSelection(selectedIds);

    if (createButton) {
      createButton.disabled = true;
      createButton.textContent = 'Preparing merge';
    }

    const { bytes, filename } = await mergePdfPages(splitEntries, selectedIds);
    const blob = new Blob([bytes], { type: PDF_MIME_TYPE });
    downloadBlobAsFile(blob, filename);
  } catch (error) {
    showError('Error while creating PDF', error);
  } finally {
    if (createButton) {
      updateButtonState();
    }
  }
}
