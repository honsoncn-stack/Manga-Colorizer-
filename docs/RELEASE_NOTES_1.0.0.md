# Manga Auto Colorizer 1.0.0 Release Notes

Manga Auto Colorizer 1.0.0 is the first public test release of the local
Windows desktop manga reader and automatic colorization workflow.

## What is included

- Electron desktop app with React frontend.
- Local library import for image folders, PDF, and CBZ.
- Reader double-page navigation, zoom, black-white/color toggle, and keyboard
  shortcuts.
- Current-spread, next-spreads, and whole-book colorization task entry points.
- Queue/status page for current task state and logs.
- Paginated Gallery for temporary color pages and library color pages.
- Full PDF export: colored pages use cached color results, uncolored pages fall
  back to the original black-white page.
- Settings, usage notes, GitHub issue templates, and public user documents.

## What is not included

- Authorized model weights are shipped in the public Release user kit for easier
  end-user setup. Git source commits do not track large binary weight files.
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

If the computer does not already have Miniconda or Anaconda, place
`Miniconda3-latest-Windows-x86_64.exe` next to the setup script before running
it. The script also accepts similarly named `Miniconda3...Windows...x86_64.exe`
installers in the same folder.

Manual setup without the script is also documented for users who already have
Conda, Python, or Torch configured. See `docs/MANUAL_INSTALLATION.md`.

When the setup script runs interactively, it scans common D: drive Conda
environment folders and lets the user choose an existing environment by number.
Users can also paste an environment folder or its `python.exe` path. The script
checks Python modules first, installs only missing app packages, and checks
whether Torch is CUDA-capable before deciding to skip it. If Torch is missing,
the script warns that the download can be large and asks before installing it.
If an NVIDIA GPU is detected but the selected environment has CPU-only Torch,
the script asks whether to reinstall CUDA Torch. See `docs/ENV_REUSE_GUIDE.md`.
GPU acceleration in 1.0 is NVIDIA CUDA only. AMD / Intel GPU users can still use
the app through CPU mode; non-NVIDIA acceleration is reserved for a future
experimental release.

Automation users can pass `-NonInteractive`.

Useful official links:

- Miniconda: https://www.anaconda.com/docs/getting-started/miniconda/install
- Git for Windows: https://git-scm.com/downloads/win
- PyTorch: https://pytorch.org/get-started/locally/
- Visual C++ Redistributable: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist

The automatic colorization model is based on `manga-colorization-v2`:

https://github.com/qweasdd/manga-colorization-v2

Thanks to the original model developer for the work and authorization support.

See:

- `docs/SYSTEM_REQUIREMENTS.md`
- `docs/ENV_REUSE_GUIDE.md`
- `docs/MANUAL_INSTALLATION.md`
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
