# AGENTS.md

## Environment

1. The user works in Windows Codex App, not Codex CLI.
2. Do not use the `codex` command.
3. Project root: `D:\AIProjects\manga-auto-colorizer`
4. Conda env: `D:\CondaEnvs\manga-color-v2`
5. Python: `D:\CondaEnvs\manga-color-v2\python.exe`

## Project scope

1. Current mainline is the Electron desktop app.
2. UI style is a manga workbench, not a generic webpage.
3. Keep the Streamlit entry, but do not promote it as the main path.
4. New desktop code goes in `desktop/`.
5. Backend lives in `desktop/backend/server.py`.
6. Frontend lives in `desktop/frontend/`.
7. Auto-only mode only.
8. No reference mode.
9. No MangaNinjia.
10. No ComfyUI_MangaNinjia.
11. No copyrighted anime/IP assets.

## Path and safety rules

1. Use `pathlib` for Python path handling.
2. Keep all project paths and caches on D:.
3. Do not submit `input/`, `output/`, `models/`, `logs/`, or `reports/`.
4. Do not submit `node_modules/`, `dist/`, `build/`, or `release/`.
5. Do not submit model weights.
6. Do not create `input/references`.

## Development rules

1. Run `git status` before modifying files.
2. Make the smallest change that solves the problem.
3. Do not pretend a run succeeded.
4. After changes, perform a minimal verification.
5. If a run fails, read the logs and fix the cause.

## Stage 2 rules

1. Frontend UI components go in `desktop/frontend/src/components`.
2. Frontend pages go in `desktop/frontend/src/pages`.
3. Backend API changes go in `desktop/backend/server.py`.
4. Keep the auto-only workflow.
5. Keep the manga workbench visual language.
6. Use CSS/SVG/gradients/panel borders/halftone textures for styling.

## Stage 3 rules

1. Packaging uses Electron Builder.
2. Do not bundle model weights, the conda environment, or large third-party runtime dependencies into the installer.
3. Do not submit `release/`, `dist/`, `build/`, or `node_modules/`.
4. Do not submit `input/`, `output/`, `models/`, `logs/`, or `reports/`.
5. Desktop icons must be self-made.
6. After generating an installer, do not auto-run it; wait for user confirmation.
7. The main workflow remains auto-only and does not include reference mode.
