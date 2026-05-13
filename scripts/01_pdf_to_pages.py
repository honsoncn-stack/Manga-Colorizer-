from __future__ import annotations

import argparse
from pathlib import Path

import fitz


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Split a PDF into numbered PNG pages.")
    parser.add_argument("--input", required=True, help="Input PDF path")
    parser.add_argument("--out", required=True, help="Output directory for PNG pages")
    parser.add_argument("--dpi", type=int, default=300, help="Render DPI")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    pdf_path = Path(args.input).expanduser().resolve()
    out_dir = Path(args.out).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    if not pdf_path.exists():
        raise FileNotFoundError(f"Input PDF not found: {pdf_path}")

    doc = fitz.open(pdf_path)
    zoom = args.dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    for index, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        output_path = out_dir / f"{index:03d}.png"
        pix.save(output_path)
        print(f"[OK] Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
