from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Blend original black ink lines back into colorized pages.")
    parser.add_argument("--bw-dir", required=True, help="Directory of preprocessed black-and-white pages")
    parser.add_argument("--color-dir", required=True, help="Directory of colorized pages")
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument("--line-strength", type=float, default=0.85, help="Ink blend strength from 0 to 1")
    return parser.parse_args()


def preserve_lines(bw_path: Path, color_path: Path, out_path: Path, line_strength: float) -> None:
    with Image.open(bw_path) as bw_image, Image.open(color_path) as color_image:
        bw = bw_image.convert("L")
        color = color_image.convert("RGB").resize(bw.size)
        bw_arr = np.asarray(bw, dtype=np.float32) / 255.0
        color_arr = np.asarray(color, dtype=np.float32) / 255.0
        ink_mask = 1.0 - bw_arr
        ink_mask = np.clip(ink_mask * line_strength, 0.0, 1.0)
        ink_mask = ink_mask[..., None]
        blended = color_arr * (1.0 - ink_mask)
        result = Image.fromarray(np.clip(blended * 255.0, 0, 255).astype(np.uint8), mode="RGB")
        result.save(out_path, format="PNG")


def main() -> int:
    args = parse_args()
    bw_dir = Path(args.bw_dir).expanduser().resolve()
    color_dir = Path(args.color_dir).expanduser().resolve()
    out_dir = Path(args.out).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    for bw_path in sorted(bw_dir.glob("*.png")):
        color_path = color_dir / bw_path.name
        if not color_path.exists():
            print(f"[WARN] Missing colorized file for {bw_path.name}")
            continue
        out_path = out_dir / bw_path.name
        preserve_lines(bw_path, color_path, out_path, args.line_strength)
        print(f"[OK] Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
