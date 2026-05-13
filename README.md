# Manga Auto Colorizer

`Manga Auto Colorizer` is a Windows local desktop app for black-and-white manga auto colorization and reader-mode browsing. The current mainline is `Electron + React + Vite + FastAPI`, and the color model remains `external/manga-colorization-v2`.

## Current scope

- Auto-only colorization
- Local reader mode
- Local inputs only: image folders, PDF, CBZ
- No reference mode
- No MangaNinjia
- No ComfyUI_MangaNinjia
- No browser extension
- No cloud upload

## Environment

- Project root: `D:\AIProjects\manga-auto-colorizer`
- Conda env: `D:\CondaEnvs\manga-color-v2`
- Python: `D:\CondaEnvs\manga-color-v2\python.exe`

## Desktop app

Recommended entry:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_dev.ps1
```

Packaged app entry:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_packaged_app.ps1
```

Desktop app structure:

- `desktop/electron/` - Electron main process and preload bridge
- `desktop/frontend/` - React + Vite UI
- `desktop/backend/` - FastAPI backend

## Reader mode

Reader mode turns the app into a local manga bookshelf and reader instead of a browser-dependent plugin.

- Import image folders
- Import PDF
- Import CBZ
- Read black-and-white pages locally
- Colorize the current page, next 5 pages, or the whole book
- Export mixed color/BW PDF per imported book

### Library storage

- Library root: `library/`
- Book storage: `library/books/`
- Library index: `library/library_index.json`

User-imported books and generated book caches are not committed to Git.

## Reader mode workflow

1. Open the desktop app.
2. Go to `Library`.
3. Import a local image folder, PDF, or CBZ.
4. Open the imported book in `Reader`.
5. Colorize the current page or a page range.
6. Export `colorized_book.pdf` from the book's `export/` folder.

## CLI utilities

Import a folder into the local library:

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts/library_manager.py import-folder --input input/pages_bw --title "Demo Book"
```

Import a PDF:

```powershell
python scripts/library_manager.py import-pdf --input input/pdf/chapter01.pdf --title "Demo PDF"
```

Import a CBZ:

```powershell
python scripts/library_manager.py import-cbz --input input/cbz/demo.cbz --title "Demo CBZ"
```

Colorize one page from a book:

```powershell
python scripts/colorize_book_page.py --book-id book_001 --page 1
```

Colorize a range:

```powershell
python scripts/colorize_book_batch.py --book-id book_001 --start-page 3 --end-page 8
```

Export a reader book PDF:

```powershell
python scripts/export_book_pdf.py --book-id book_001
```

## Legacy pipeline mode

The original pipeline is still available for folder/PDF batch colorization:

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts/pipeline.py --input input/pages_bw
python scripts/pipeline.py --input input/pdf/chapter01.pdf
```

## Phase 2: art and interaction

The desktop UI now includes:

- Dashboard
- Library
- Reader
- Colorize Queue
- Gallery
- Logs
- Settings
- About

Features already in the desktop UI:

- Reader bookshelf
- Drag-and-pick local imports
- Progress feedback
- Reader queue log
- Image preview
- Output gallery

## Phase 3: packaging and release

Build installer and portable package:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build_desktop_installer.ps1
```

Create desktop shortcut:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create_desktop_shortcut.ps1
```

Build output directory:

- `desktop/release/`

Notes:

- The installer does not bundle model weights.
- The installer does not bundle the conda environment.
- The packaged app still depends on `D:\AIProjects\manga-auto-colorizer`.
- The packaged app still depends on `D:\CondaEnvs\manga-color-v2`.

## Documents

- `docs/READER_MODE_PLAN.md`
- `docs/READER_USER_GUIDE.md`
- `docs/PACKAGING_DESKTOP.md`
- `docs/RELEASE_CHECKLIST.md`

## Git rules

Do not commit:

- `library/books/`
- `library/library_index.json`
- `input/`
- `output/`
- `models/`
- `logs/`
- `reports/`
- `node_modules/`
- `dist/`
- `release/`
- model weights
