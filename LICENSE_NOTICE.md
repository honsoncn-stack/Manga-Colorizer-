# License Notice

This repository is currently published as the public 1.0 source snapshot of
Manga Auto Colorizer.

The project is shared so users can inspect the code, run the desktop app
locally, report bugs, and help improve the 1.0 release. This notice is not a
blanket MIT, Apache, or public-domain license for every file in the repository.

## Current permission boundary

You may use this repository for local personal testing, learning, bug
reporting, and contribution discussions.

Before redistributing modified copies, packaging this project into another
product, or using it commercially, review this file and
`THIRD_PARTY_NOTICES.md`, and verify the licenses of all third-party code,
dependencies, and model weights used in your distribution.

## Third-party code and dependencies

Third-party projects are not relicensed by this repository. They remain under
their own licenses and upstream terms.

Important boundaries:

- Model weights in the GitHub Release user kit for easier
  end-user setup. Git source commits track code and docs, not large binary
  weight files.
- User manga files, imported books, generated color pages, logs, reports, and
  exported PDFs are not included in this source repository.
- `external/manga-colorization-v2` is an upstream third-party colorization
  project and is not authored by this repository.
- Some external denoising files in that upstream project contain GPL license
  text.
- PyMuPDF is distributed under AGPL/commercial licensing terms.

See `THIRD_PARTY_NOTICES.md` for the current third-party notice list.

## Acknowledgements

The automatic colorization model is based on `manga-colorization-v2`:

https://github.com/qweasdd/manga-colorization-v2

Thanks to the original model developer for the work and support.

## User content

Users are responsible for making sure they have the right to import, process,
colorize, and export their own manga or image files. Do not upload copyrighted
source manga, complete PDFs, model weights, or private files when reporting
issues.

## Future licensing

The 1.0 goal is a free public test release with clear feedback channels. A
future 2.0 product may replace or isolate dependencies with unclear or strong
copyleft licensing before any different commercial distribution model is
chosen.

This notice is not legal advice.
