from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps


SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Normalize manga pages into RGB PNG files.")
    parser.add_argument("--input", required=True, help="Input image directory")
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument("--enhance-lines", action="store_true", help="Enhance dark lines")
    return parser.parse_args()


def iter_images(input_dir: Path) -> list[Path]:
    return sorted(path for path in input_dir.iterdir() if path.suffix.lower() in SUPPORTED_EXTENSIONS)


def preprocess_image(source: Path, target: Path, enhance_lines: bool) -> None:
    with Image.open(source) as image:
        rgb = image.convert("RGB")
        if enhance_lines:
            grayscale = ImageOps.grayscale(rgb)
            contrast = ImageEnhance.Contrast(grayscale).enhance(1.35)
            rgb = Image.merge("RGB", (contrast, contrast, contrast))
        rgb.save(target, format="PNG")


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input).expanduser().resolve()
    out_dir = Path(args.out).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory not found: {input_dir}")

    images = iter_images(input_dir)
    if not images:
        raise FileNotFoundError(f"No supported images found in: {input_dir}")

    for index, image_path in enumerate(images, start=1):
        target = out_dir / f"{index:03d}.png"
        preprocess_image(image_path, target, args.enhance_lines)
        print(f"[OK] Wrote {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
