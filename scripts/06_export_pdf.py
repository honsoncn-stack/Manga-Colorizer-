from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


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

    pil_images = []
    for path in images:
        image = Image.open(path).convert("RGB")
        pil_images.append(image)

    first, rest = pil_images[0], pil_images[1:]
    first.save(out_path, save_all=True, append_images=rest)
    for image in pil_images:
        image.close()
    print(f"[OK] Exported PDF to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
