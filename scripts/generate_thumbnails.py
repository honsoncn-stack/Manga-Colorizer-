from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate lightweight gallery thumbnails.")
    parser.add_argument("--input-dir", required=True, help="Source image directory")
    parser.add_argument("--out-dir", required=True, help="Thumbnail output directory")
    parser.add_argument("--width", type=int, default=320, help="Thumbnail width, defaults to 320")
    return parser.parse_args()


def iter_images(folder: Path) -> list[Path]:
    return sorted(path for path in folder.iterdir() if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS)


def ensure_thumbnail(source_path: Path, target_path: Path, width: int) -> bool:
    if target_path.exists() and target_path.stat().st_mtime >= source_path.stat().st_mtime:
        return False

    target_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source_path) as image:
        rgb_image = image.convert("RGB")
        if rgb_image.width > width:
            height = max(1, int(rgb_image.height * (width / rgb_image.width)))
            rgb_image = rgb_image.resize((width, height))
        rgb_image.save(target_path, format="JPEG", quality=85, optimize=True)
    return True


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input_dir).resolve()
    out_dir = Path(args.out_dir).resolve()
    if not input_dir.exists() or not input_dir.is_dir():
        raise FileNotFoundError(f"Input directory not found: {input_dir}")

    written = 0
    skipped = 0
    for source_path in iter_images(input_dir):
        target_path = out_dir / f"{source_path.stem}.jpg"
        if ensure_thumbnail(source_path, target_path, args.width):
            written += 1
            print(f"[OK] {target_path}")
        else:
            skipped += 1
            print(f"[SKIP] {target_path}")

    print(f"[DONE] written={written} skipped={skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
