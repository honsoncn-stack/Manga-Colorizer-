# Third-Party Notices

This file records the main third-party components currently used or expected by
Manga Auto Colorizer 1.0. It is a practical release notice, not a complete legal
audit.

## Upstream colorization project

- Component: `external/manga-colorization-v2`
- Upstream repository: https://github.com/qweasdd/manga-colorization-v2
- Role: automatic manga page colorization pipeline
- Notice: this project is not authored by this repository. The local checkout
  does not include a clear top-level license file. Follow the upstream project
  terms and verify permission before redistributing it or model weights.

The source repository must not include downloaded model weights, including
files such as `*.pth`, `*.pt`, `*.ckpt`, `*.safetensors`, `*.onnx`, or `*.pkl`.

## GPL-marked denoising files

Some files under `external/manga-colorization-v2/denoising/` contain GNU GPL
license text from their original authors. Treat those files as GPL-covered
third-party code when distributing or modifying them.

## Python dependencies

The application relies on Python packages installed into a local Conda
environment. Key packages include:

- FastAPI / Uvicorn for the local backend.
- Pillow, OpenCV, NumPy, PyYAML, and related image-processing utilities.
- PyMuPDF for PDF import/rendering. PyMuPDF is offered under AGPL/commercial
  licensing terms.
- ReportLab for PDF generation.
- Torch / torchvision for model execution.

Dependency versions and licenses should be checked from the installed
environment before each public binary release.

## Node and Electron dependencies

The desktop shell and frontend use Electron, React, Vite, lucide-react, and
Electron Builder, plus their transitive npm dependencies. Most npm packages in
the current lockfiles are permissive licenses such as MIT, ISC, BSD, or Apache,
but the lockfiles should still be reviewed before release.

## Content not distributed by this repository

The repository and source commits must not contain:

- imported manga, PDFs, CBZ files, or other user content;
- generated color pages, thumbnails, logs, reports, or exported PDFs;
- model weights or model archives;
- Conda environments, `node_modules`, build output, installers, or release
  archives.

## Release practice

Public GitHub Releases should include only the intended installer/portable
artifacts and release notes. Source control should contain code, scripts,
documentation, and issue templates only.
