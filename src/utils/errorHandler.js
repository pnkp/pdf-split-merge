export function showError(message, error) {
  alert(message + (error?.message ? ': ' + error.message : ''));
  if (error) {
    console.error(error);
  }
}

export function validatePdfFiles(files) {
  const pdfCandidates = files.filter((file) => file.type === 'application/pdf');
  if (pdfCandidates.length === 0) {
    throw new Error('Please choose PDF files!');
  }
  return pdfCandidates;
}

export function validateSelection(selectedIds, minRequired = 1) {
  if (selectedIds.length < minRequired) {
    throw new Error(`Please select at least ${minRequired} page(s)!`);
  }
}
