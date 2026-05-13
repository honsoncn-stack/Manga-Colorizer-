# Desktop App Plan

## Why Electron

The Streamlit prototype is useful, but the desktop target needs a more controlled shell:

- richer local navigation
- better task feedback
- durable windowed experience
- safer local file actions

## Current stack

- Electron
- React
- Vite
- FastAPI
- `external/manga-colorization-v2`

## Current scope

- Auto-only manga colorization
- No reference mode
- No MangaNinjia
- No ComfyUI_MangaNinjia

## Startup flow

1. Electron launches.
2. Electron starts the Python backend.
3. Backend waits for `/api/health`.
4. Frontend loads.
5. UI calls the backend APIs.
6. Backend launches `scripts/pipeline.py`.

## Development command

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_dev.ps1
```

## App command

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_app.ps1
```

## Packaging plan

- Build the React frontend with Vite
- Bundle Electron main/preload/backend files
- Package Windows installer with electron-builder

## Next improvements

- tighten job-status polling
- add better gallery filtering
- improve error surfacing
- keep the visual language consistent across every page
