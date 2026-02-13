import { triggerDownload, downloadBlobAsFile } from '../utils/fileDownloader.js';
import { buildZip } from './zipBuilder.js';
import { getSelectedIds } from '../utils/selectionManager.js';
import { validateSelection, showError } from '../utils/errorHandler.js';
import { PDF_MIME_TYPE } from '../utils/constants.js';

export async function downloadSelected(
  splitEntries,
  pdfFilesCount,
  downloadButton,
  updateButtonState
) {
  const selectedIds = getSelectedIds();

  try {
    validateSelection(selectedIds);

    if (selectedIds.length === 1) {
      const entry = splitEntries.find((current) => current.id === selectedIds[0]);
      if (entry?.item) {
        triggerDownload(entry.item.url, entry.item.filename);
      }
      return;
    }

    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.textContent = 'Preparing ZIP for selected pages';
    }

    const { blob, filename } = await buildZip(
      splitEntries,
      selectedIds,
      pdfFilesCount,
      (percent) => {
        if (downloadButton) {
          downloadButton.textContent = `Preparing ZIP (${percent}%)`;
        }
      }
    );

    downloadBlobAsFile(blob, filename);
  } catch (error) {
    showError('Error while preparing download', error);
  } finally {
    if (downloadButton) {
      downloadButton.disabled = false;
      updateButtonState();
    }
  }
}
