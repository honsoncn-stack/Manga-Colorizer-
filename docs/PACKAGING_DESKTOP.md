# Desktop Packaging

## Overview

This project uses Electron Builder to create two Windows artifacts:

- NSIS installer
- Portable exe

## Packaging boundaries

The first release does **not** bundle:

- model weights
- the conda environment
- `torch`
- `manga-colorization-v2` weights

The packaged app still depends on the fixed local paths:

- `D:\AIProjects\manga-auto-colorizer`
- `D:\CondaEnvs\manga-color-v2`

## Commands

Build the installer and portable package:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build_desktop_installer.ps1
```

Create a desktop shortcut:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create_desktop_shortcut.ps1
```

## Output

Artifacts are written to:

- `desktop/release/`

## Common issues

- Installer will not open
- App opens to a white screen
- Backend startup fails
- D drive Python is missing
- Project root is missing
- Port `8765` is already in use
- Model weights are missing
- Node dependency installation fails
- Electron Builder packaging fails
