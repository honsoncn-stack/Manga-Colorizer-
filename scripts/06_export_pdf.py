from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export colorized PNG pages into a PDF.")
    parser.add_argument("--input", required=True, help="Input PNG directory")
    parser.add_argument("--out", required=True, help="Output PDF path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input).expanduser().resolve()
    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    images = sorted(input_dir.glob("*.png"))
    if not images:
        raise FileNotFoundError(f"No PNG files found in: {input_dir}")

    pdf = canvas.Canvas(str(out_path))
    for image_path in images:
        with Image.open(image_path) as image:
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
