export function setupDragAndDrop(dropZone, onFile, onActiveChange) {
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onActiveChange) {
      onActiveChange(true);
    }
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onActiveChange) {
      onActiveChange(false);
    }
  });

  dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onActiveChange) {
      onActiveChange(false);
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await onFile(files[0]);
    }
  });
}

export function setupDragAndDropMultiple(dropZone, onFiles, onActiveChange) {
  let dragCounter = 0;

  dropZone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (dragCounter === 1 && onActiveChange) {
      onActiveChange(true);
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0 && onActiveChange) {
      onActiveChange(false);
    }
  });

  dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    if (onActiveChange) {
      onActiveChange(false);
    }

    const files = Array.from(e.dataTransfer.files || []);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length > 0) {
      await onFiles(pdfFiles);
    }
  });
}
