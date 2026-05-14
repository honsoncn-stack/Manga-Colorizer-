# Reader User Guide

## Import a local manga

1. Open the desktop app.
2. Go to `Library`.
3. Enter a title, or let the app auto-fill it from the selected PDF / CBZ file name.
4. Choose one of:
   - image folder
   - PDF
   - CBZ
5. Click the matching import button.

The book appears on the local bookshelf.

## Search and sort the bookshelf

In `Library`, you can:

- search by title
- sort by:
  - recently updated
  - recently imported
  - title

Each book card shows:

- total pages
- current reading page
- colorized page count
- a progress bar for colorization

## Read pages

1. In `Library`, click `继续阅读`.
2. The `Reader` page opens the current page from the selected book.
3. If you enter `Reader` directly from the sidebar, the app automatically restores the most recently read book. If the library is empty, it prompts you to import a manga first.
4. Use:
   - `上一页`
   - `下一页`
   - page jump input
   - BW / color toggle
   - zoom controls

## Reader shortcuts

The reader supports:

- `ArrowRight`: next page
- `ArrowLeft`: previous page
- `Space`: next page
- `B`: toggle BW / color
- `C`: colorize current page
- `Enter` in the page input: jump to page

## Colorize the current page

In `Reader`, click `上色当前页`.

The public Release user kit includes authorized model weights. If setup was not
completed or the weight files were moved, the button remains visible but the UI
clearly reports that the model is unavailable and colorization cannot start.

## Colorize multiple pages

In `Reader`, click:

- `上色后 5 页`
- or `整本上色`

Already colorized pages are skipped automatically. Whole-book colorization only
spends time on pages that do not have a color result yet.

The queue state and `reader_colorize.log` are visible in `Colorize Queue`.

## Export a color PDF

You can export from:

- `Library` by clicking `导出完整 PDF`
- or `Reader` by clicking `导出完整 PDF`

Output path:

- `library/books/<book_id>/export/colorized_book.pdf`

If some pages are not colorized yet, export uses the BW page as fallback for those pages. Exporting does not colorize new pages; colorize pages first, then export again.

## Browse the gallery

`Gallery` uses pagination to stay responsive when many images exist.

- default page size: `24`
- selectable page sizes:
  - `12`
  - `24`
  - `48`
  - `96`

You can switch between:

- `临时彩图`
- `书库彩页`

Reader library outputs can also be filtered by book.

Gallery does not use mouse-wheel page switching. Use `首页`, `上一页`, `下一页`, `末页`, or the page jump input.

## View logs

Open `Logs` to inspect:

- `流水线日志`
- `错误日志`
- `后端日志`
- `阅读器日志`

If a log file does not exist yet, the page shows `暂无日志` instead of failing.

When reporting bugs, copy the relevant log text into GitHub Issues:

- https://github.com/honsoncn-stack/Manga-Colorizer-/issues

Do not upload copyrighted manga files, full PDFs, model weights, or private files.

## Local cache and Git

Reader-mode outputs are cached under:

- `library/books/<book_id>/pages_color`

User-imported books and generated caches are local-only and must not be committed to Git.

## Common issues

### Import succeeds but no pages appear

Check that the source folder, PDF, or CBZ actually contains supported pages.

### Colorize button does not work

Check:

- `D:\CondaEnvs\manga-color-v2\python.exe`
- model weights installed from `Manga-Auto-Colorizer-1.0.0-user-kit.zip`
- `Logs` and `Colorize Queue`

### Exported PDF is missing color on some pages

That is expected if those pages have not been colorized yet. Export falls back to BW pages.

### Reader queue shows idle

No reader-mode colorization task is currently running.
