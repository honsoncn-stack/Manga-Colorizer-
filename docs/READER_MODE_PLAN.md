# Reader Mode Plan

## Why move from a browser plugin to a reader

The desktop reader is more stable than a browser plugin because it does not depend on webpage scripts, anti-hotlink protections, cross-origin policies, or site-specific layout changes. All inputs come from local files that the app can fully control.

## Supported inputs

- Image folder
- PDF
- CBZ

Current exclusions:

- No browser extension
- No real-time webpage capture
- No cloud upload
- No reference mode

## Runtime flow

1. User imports a local book into `library/books/<book_id>/`.
2. The backend writes `manifest.json` and updates `library/library_index.json`.
3. Reader mode loads black-and-white pages from the local library.
4. On-demand colorization writes page caches into `pages_color/`.
5. Export builds `export/colorized_book.pdf` from color pages first and BW pages as fallback.

## Library structure

Each imported book uses:

- `library/books/<book_id>/manifest.json`
- `library/books/<book_id>/pages_bw/`
- `library/books/<book_id>/pages_color/`
- `library/books/<book_id>/thumbnails/`
- `library/books/<book_id>/export/`

## Color cache logic

- `pages_bw/` stores imported black-and-white source pages
- `pages_color/` stores generated color pages
- `colorized_pages` in `manifest.json` tracks which pages already have color cache
- Export prefers `pages_color/` and falls back to `pages_bw/`

## UI model

- `Library` imports and manages books
- `Reader` focuses on single-page reading and page-range colorization
- `Colorize Queue` shows the active reader job and `reader_colorize.log`
- `Gallery` can preview both classic pipeline outputs and reader-mode cached outputs

## Current non-goals

- No webpage plugin mode
- No website scraping
- No MangaNinjia
- No ComfyUI_MangaNinjia
- No reference mode
