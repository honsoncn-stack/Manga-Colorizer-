# Reader Architecture

## Overview

The current desktop app is a local manga reader and auto-colorization workbench built from:

- Electron
- React + Vite
- FastAPI
- `external/manga-colorization-v2`

The workflow remains auto-only. There is no reference mode, MangaNinjia, ComfyUI_MangaNinjia, browser extension, or cloud upload in the current version.

## Local data layout

- Project root: `D:\AIProjects\manga-auto-colorizer`
- Reader library root: `library/`
- Imported books: `library/books/<book_id>/`

Each imported book uses:

- `manifest.json`
- `pages_bw/`
- `pages_color/`
- `thumbnails/`
- `export/`

User-imported library data is local-only and must not be committed.

## Reader flow

1. `Library` imports a local image folder, PDF, or CBZ.
2. `scripts/library_manager.py` normalizes the book into `library/books/<book_id>/`.
3. `Reader` loads `manifest.json` and page metadata through FastAPI.
4. Single-page or range colorization runs through:
   - `scripts/colorize_book_page.py`
   - `scripts/colorize_book_batch.py`
5. Export uses:
   - `scripts/export_book_pdf.py`

## Gallery performance strategy

To avoid large-image stalls, the app no longer renders the full result set at once.

The backend now provides paginated endpoints:

- `GET /api/gallery/pipeline`
- `GET /api/gallery/library`
- `GET /api/gallery/book/{book_id}`

Each endpoint supports:

- `page`
- `page_size`

The frontend:

- defaults to `24` items per page
- supports `12 / 24 / 48 / 96`
- loads only the current page
- uses `thumb_url` when available
- uses `loading="lazy"` and `decoding="async"`
- loads the full image only when preview opens

## Reader UX behavior

The reader now includes:

- auto-restore of the most recently read book
- two-page spread display for the current page and next page
- black-and-white / color view toggle
- keyboard navigation
- page jump with Enter
- current-spread colorization, which submits up to two pages at once
- lightweight page loading state
- current colorization progress display

## Library UX behavior

The library now includes:

- title search
- sort by updated / created / title
- progress bar per book
- limited rendering for large shelves

## Logs and queue

`Colorize Queue` shows:

- reader job status
- book and page context
- progress
- `reader_colorize.log`

`Logs` shows:

- pipeline log
- error log
- backend log
- reader log

Missing log files are handled gracefully.
