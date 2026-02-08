import { URL_REVOKE_DELAY } from './constants.js';

export function triggerDownload(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function downloadBlobAsFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), URL_REVOKE_DELAY);
}
