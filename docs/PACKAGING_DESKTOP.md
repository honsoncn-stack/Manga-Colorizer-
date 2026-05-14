# Desktop Packaging

## Overview

This project uses Electron Builder to create two Windows artifacts:

- NSIS installer
- Portable exe

## Packaging boundaries

The desktop installer is paired with the Release user kit. Keep these large
runtime pieces in the user kit / local environment rather than the installer:

- the conda environment
- `torch`

For normal users, the GitHub Release also provides
`Manga-Auto-Colorizer-1.0.0-user-kit.zip`, which includes the authorized
`manga-colorization-v2` weights and setup script. The source Git commits still
do not track large weight files.

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

Create a development shortcut that launches the local Electron app:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create_dev_desktop_shortcut.ps1
```

## Output

Artifacts are written to:

- `desktop/release/`

Release artifacts should be uploaded to GitHub Release. Do not commit installers or portable executables to the source repository.

## Common issues

- Installer will not open
- App opens to a white screen
- Backend startup fails
- D drive Python is missing
- Project root is missing
- Port `8765` is already in use
- Model weights were not installed from the user kit
- Node dependency installation fails
- Electron Builder packaging fails
