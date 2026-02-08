import { ZIP_SUFFIX, DEFAULT_BASE_FILENAME } from '../utils/constants.js';

export async function buildZip(items, selectedIds, pdfFilesCount, onProgress) {
  if (!window.JSZip) {
    throw new Error('ZIP library not available.');
  }

  const zip = new window.JSZip();
  for (const entryId of selectedIds) {
    const entry = items.find((current) => current.id === entryId);
    const item = entry?.item;
    if (!item) continue;
    const response = await fetch(item.url);
    const blob = await response.blob();
    zip.file(item.filename, blob);
  }

  const baseFilename = pdfFilesCount ? 'split' : 'documents';
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      const percent = Math.round(metadata.percent);
      onProgress(percent);
    }
  });
  return { blob: zipBlob, filename: `${baseFilename}${ZIP_SUFFIX}` };
}
