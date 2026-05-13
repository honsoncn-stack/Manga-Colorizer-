from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from library_utils import book_root, load_manifest, manifest_page_path, page_file_name


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export a local reader-mode book to a PDF.")
    parser.add_argument("--book-id", required=True, help="Book id such as book_001")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = load_manifest(args.book_id)
    total_pages = int(manifest.get("total_pages", 0))
    export_dir = book_root(args.book_id) / "export"
    export_dir.mkdir(parents=True, exist_ok=True)
    out_path = export_dir / "colorized_book.pdf"

    if total_pages <= 0:
        raise FileNotFoundError(f"Book has no pages: {args.book_id}")

    pdf = canvas.Canvas(str(out_path))
    for page_number in range(1, total_pages + 1):
        color_page = manifest_page_path(args.book_id, page_number, color=True)
        bw_page = manifest_page_path(args.book_id, page_number, color=False)
        page_path = color_page if color_page.exists() else bw_page
        if not page_path.exists():
            raise FileNotFoundError(f"Missing page {page_file_name(page_number)} for {args.book_id}")
        with Image.open(page_path) as image:
            rgb = image.convert("RGB")
            width, height = rgb.size
            pdf.setPageSize((width, height))
            pdf.drawImage(ImageReader(rgb), 0, 0, width=width, height=height)
            pdf.showPage()
    pdf.save()
    print(f"[OK] Exported PDF to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
