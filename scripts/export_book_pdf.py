from __future__ import annotations

import argparse
from io import BytesIO
from pathlib import Path

from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from library_utils import book_root, load_manifest, manifest_page_path, page_file_name


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export a local reader-mode book to a PDF.")
    parser.add_argument("--book-id", required=True, help="Book id such as book_001")
    parser.add_argument("--max-side", type=int, default=3200, help="Resize PDF pages so the long edge is no larger than this many pixels. Use 0 for original size.")
    parser.add_argument("--quality", type=int, default=88, help="JPEG quality used inside the exported PDF.")
    return parser.parse_args()


def prepare_pdf_page(source_path: Path, *, max_side: int, quality: int) -> tuple[BytesIO, int, int]:
    with Image.open(source_path) as image:
        rgb = image.convert("RGB")
        if max_side > 0 and max(rgb.size) > max_side:
            rgb.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        width, height = rgb.size
        buffer = BytesIO()
        rgb.save(buffer, format="JPEG", quality=max(1, min(quality, 95)), subsampling=0)
        buffer.seek(0)
        return buffer, width, height


def main() -> int:
    args = parse_args()
    manifest = load_manifest(args.book_id)
    total_pages = int(manifest.get("total_pages", 0))
    export_dir = book_root(args.book_id) / "export"
    export_dir.mkdir(parents=True, exist_ok=True)
    out_path = export_dir / "colorized_book.pdf"

    if total_pages <= 0:
        raise FileNotFoundError(f"Book has no pages: {args.book_id}")

    pdf = canvas.Canvas(str(out_path), pageCompression=1)
    color_pages = 0
    bw_fallback_pages = 0
    for page_number in range(1, total_pages + 1):
        color_page = manifest_page_path(args.book_id, page_number, color=True)
        bw_page = manifest_page_path(args.book_id, page_number, color=False)
        if color_page.exists():
            page_path = color_page
            color_pages += 1
        else:
            page_path = bw_page
            bw_fallback_pages += 1
        if not page_path.exists():
            raise FileNotFoundError(f"Missing page {page_file_name(page_number)} for {args.book_id}")
        image_buffer, width, height = prepare_pdf_page(page_path, max_side=args.max_side, quality=args.quality)
        pdf.setPageSize((width, height))
        pdf.drawImage(ImageReader(image_buffer), 0, 0, width=width, height=height)
        pdf.showPage()
    pdf.save()
    print(f"[OK] Exported complete PDF to {out_path}")
    print(f"[OK] Pages: total={total_pages}, color={color_pages}, bw_fallback={bw_fallback_pages}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
