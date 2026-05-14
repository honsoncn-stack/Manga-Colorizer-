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
- GitHub Issue templates exist under `.github/ISSUE_TEMPLATE/`.
- README links to user guide, installation guide, feedback page, and release notes.
- `LICENSE_NOTICE.md` and `THIRD_PARTY_NOTICES.md` are present and linked.
- GitHub Release notes tell users where to download the installer or portable exe.
- GitHub Release user kit includes authorized `generator.zip` and `denoiser.pth`.
- `node_modules/`, `dist/`, `build/`, `release/`, `desktop/release/`, `input/`, `output/`, `models/`, `logs/`, `reports/`, and `library/books/` are not committed.
- Model weights, user manga files, exported PDFs, installers, and portable executables are not committed to Git.
