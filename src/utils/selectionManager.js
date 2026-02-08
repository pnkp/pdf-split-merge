export function getSelectedIds() {
  const checkboxes = Array.from(
    document.querySelectorAll('.preview-checkbox:checked')
  );
  return checkboxes
    .map((checkbox) => Number(checkbox.dataset.entryId))
    .filter((entryId) => Number.isFinite(entryId))
    .sort((a, b) => a - b);
}

export function updateButtonState(button, selectedIds, singleText, multipleTextFn) {
  if (!button) return;
  button.disabled = selectedIds.length === 0;
  button.textContent =
    selectedIds.length > 0 ? multipleTextFn(selectedIds) : singleText;
}

export function getDownloadButtonText(selectedIds) {
  if (selectedIds.length === 0) {
    return 'Download selected pages';
  }
  if (selectedIds.length === 1) {
    return 'Download selected page';
  }
  return `Download selected pages (ZIP: ${selectedIds.length})`;
}

export function getMergeButtonText(selectedIds) {
  return selectedIds.length > 0
    ? `Merge selected (${selectedIds.length} pages)`
    : 'Merge selected';
}
