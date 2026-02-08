# PDF Split & Merge

A simple in-browser tool to split PDFs into single pages, select what you need, and download pages as separate files, a ZIP, or a merged PDF. All processing happens locally in your browser.

## Features

- Split one or many PDFs into single-page files
- Select pages to download or merge
- Download selected pages as individual files or a ZIP
- Merge selected pages into one PDF
- Drag-and-drop upload

## Tech stack

- PDF.js (rendering)
- pdf-lib (create/merge PDFs)
- JSZip (bundle downloads)
- Vanilla HTML/CSS/JS

## Run locally

1) Install dependencies (only Prettier for formatting).

```bash
npm install
```

2) Serve the project with any static server, for example:

```bash
npx serve .
```

3) Open the local URL in your browser.

## Usage

1) Drag and drop one or more PDFs (or click to choose files).
2) Wait for processing and previews.
3) Select the pages you want.
4) Download selected pages or merge them into one PDF.

## Scripts

- `npm run format` - format code with Prettier

## Project structure

- `index.html` - main page
- `style.css` - styling
- `src/` - app logic

## Privacy

Files never leave your device. Processing happens entirely in the browser.
