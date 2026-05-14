# Manga Auto Colorizer 1.0.0 Release Notes

Manga Auto Colorizer 1.0.0 is the first public test release of the local
Windows desktop manga reader and automatic colorization workflow.

## What is included

- Electron desktop app with React frontend.
- Local library import for image folders, PDF, and CBZ.
- Reader page navigation, zoom, black-white/color toggle, and keyboard
  shortcuts.
- Per-page, next-pages, and whole-book colorization task entry points.
- Queue/status page for current task state and logs.
- Paginated Gallery for temporary color pages and library color pages.
- Full PDF export: colored pages use cached color results, uncolored pages fall
  back to the original black-white page.
- Settings, usage notes, GitHub issue templates, and public user documents.

## What is not included

- No model weights.
- No Conda environment bundle.
- No imported manga, user books, generated color pages, exported PDFs, logs, or
  reports.
- No reference mode.
- No MangaNinjia or ComfyUI_MangaNinjia integration.
- No browser extension.

## Download

For normal users, download the setup kit first, then run the installer.

Setup kit:

```text
Manga-Auto-Colorizer-1.0.0-user-kit.zip
```

Recommended artifact:

```text
Manga Auto Colorizer Setup 1.0.0.exe
```

Portable artifact:

```text
Manga Auto Colorizer 1.0.0.exe
```

## First-run notes

The app expects the local project/runtime environment and model files to be
prepared before the desktop shell is launched. Use the setup script inside
`Manga-Auto-Colorizer-1.0.0-user-kit.zip`, then run the installer.

See:

- `docs/PUBLIC_INSTALLATION.md`
- `docs/PUBLIC_USER_GUIDE.md`
- `LICENSE_NOTICE.md`
- `THIRD_PARTY_NOTICES.md`

## Feedback

Please report bugs through GitHub Issues:

https://github.com/honsoncn-stack/Manga-Colorizer-/issues

When reporting a bug, include the app version, page/module, reproduction steps,
expected result, actual result, and relevant log lines from the app's Logs page.

Do not upload copyrighted manga pages, complete PDFs, model weights, or private
files in public issue reports.
