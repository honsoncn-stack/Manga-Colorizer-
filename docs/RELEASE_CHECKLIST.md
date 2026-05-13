# Release Checklist

## Before release

- `git status` is clean.
- `python scripts/check_env.py` passes.
- `python scripts/doctor.py` passes.
- Electron dev mode starts.
- Dashboard renders normally.
- Colorize has no reference mode.
- Gallery opens.
- Logs opens.
- Settings opens.
- `desktop/build/icon.ico` exists.
- `npm run build:frontend` succeeds.
- `npm run dist` succeeds.
- The installer or portable exe exists in `desktop/release/`.
- `node_modules/`, `dist/`, `build/`, `release/`, `input/`, `output/`, `models/`, `logs/`, and `reports/` are not committed.
