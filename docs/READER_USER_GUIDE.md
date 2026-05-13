# Reader User Guide

## Import a local manga

1. Open the desktop app.
2. Go to `Library`.
3. Enter a title.
4. Choose one of:
   - image folder
   - PDF
   - CBZ
5. Click the matching import button.

The book will appear on the local bookshelf.

## Read pages

1. In `Library`, click `继续阅读`.
2. The `Reader` page opens the current page from the selected book.
3. Use:
   - `上一页`
   - `下一页`
   - page jump input
   - black/white toggle
   - zoom controls

## Colorize the current page

In `Reader`, click `上色当前页`.

If model weights are missing, the button remains visible but the environment state will show that weights are missing.

## Colorize multiple pages

In `Reader`, click:

- `上色后 5 页`
- or `整本上色`

The queue state and `reader_colorize.log` are visible in `Colorize Queue`.

## Export a color PDF

You can export from:

- `Library` by clicking `导出 PDF`
- or `Reader` by clicking `导出彩色 PDF`

Output path:

- `library/books/<book_id>/export/colorized_book.pdf`

If some pages are not colorized yet, export uses the BW page as fallback for those pages.

## View logs

Open `Logs` to inspect:

- `Pipeline Log`
- `Error Log`
- `Backend Log`
- `Reader Log`

## Common issues

### Import succeeds but no pages appear

Check that the source folder, PDF, or CBZ actually contains supported pages.

### Colorize button does not work

Check:

- `D:\CondaEnvs\manga-color-v2\python.exe`
- model weights under `external/manga-colorization-v2`
- `Logs` and `Colorize Queue`

### Exported PDF is missing color on some pages

That is expected if those pages have not been colorized yet. Export falls back to BW pages.

### Reader queue shows idle

No reader-mode colorization task is currently running.
