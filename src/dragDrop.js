export function setupDragAndDrop(dropZone, onFile, onActiveChange) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onActiveChange) {
            onActiveChange(true);
        }
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onActiveChange) {
            onActiveChange(false);
        }
    });

    dropZone.addEventListener('drop', async (e) => {
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
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onActiveChange) {
            onActiveChange(true);
        }
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onActiveChange) {
            onActiveChange(false);
        }
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onActiveChange) {
            onActiveChange(false);
        }

        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) {
            await onFiles(files);
        }
    });
}
