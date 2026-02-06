export async function splitPdf(file, totalPages, onProgress) {
    if (!file) {
        throw new Error('Brak pliku do podziału.');
    }

    const { PDFDocument } = window.PDFLib || {};
    if (!PDFDocument) {
        throw new Error('Nie znaleziono PDFLib. Upewnij się, że skrypt pdf-lib jest załadowany.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const sourcePdf = await PDFDocument.load(uint8Array);

    const baseFilename = file.name.replace(/\.pdf$/i, '');
    const downloadLinksArray = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageNum - 1]);
        newPdf.addPage(copiedPage);

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const filename = `${baseFilename}_strona_${pageNum}.pdf`;

        downloadLinksArray.push({ url, filename });

        if (onProgress) {
            const progress = Math.round((pageNum / totalPages) * 100);
            onProgress(progress);
        }
    }

    return downloadLinksArray;
}
