export function initPdfJsWorker() {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

export async function loadPdfDocument(file) {
  const arrayBuffer = await file.arrayBuffer();
  return pdfjsLib.getDocument(arrayBuffer).promise;
}
