from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Blend original black ink lines back into colorized pages.")
    parser.add_argument("--bw-dir", required=True, help="Directory of preprocessed black-and-white pages")
    parser.add_argument("--color-dir", required=True, help="Directory of colorized pages")
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument("--line-strength", type=float, default=0.72, help="Ink blend strength from 0 to 1")
    parser.add_argument("--color-saturation", type=float, default=1.12, help="Post-process saturation boost")
    parser.add_argument("--color-contrast", type=float, default=1.05, help="Post-process contrast boost")
    parser.add_argument("--color-brightness", type=float, default=1.01, help="Post-process brightness boost")
    parser.add_argument("--skin-fix-strength", type=float, default=0.48, help="Anime skin tone stabilization strength")
    return parser.parse_args()


def detect_skin_mask(rgb_uint8: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(rgb_uint8, cv2.COLOR_RGB2HSV)
    ycrcb = cv2.cvtColor(rgb_uint8, cv2.COLOR_RGB2YCrCb)

    hue = hsv[:, :, 0]
    sat = hsv[:, :, 1]
    val = hsv[:, :, 2]
    cr = ycrcb[:, :, 1]
    cb = ycrcb[:, :, 2]

    return (
        (hue >= 2)
        & (hue <= 28)
        & (sat >= 18)
        & (sat <= 165)
        & (val >= 110)
        & (cr >= 128)
        & (cr <= 176)
        & (cb >= 82)
        & (cb <= 132)
    )


def stabilize_skin_tones(image: Image.Image, strength: float) -> Image.Image:
    rgb_uint8 = np.asarray(image.convert("RGB"))
    mask = detect_skin_mask(rgb_uint8)
    if int(mask.sum()) < 250:
        return image

    lab = cv2.cvtColor(rgb_uint8, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    smooth_a = cv2.bilateralFilter(a_channel, d=7, sigmaColor=18, sigmaSpace=10)
    smooth_b = cv2.bilateralFilter(b_channel, d=7, sigmaColor=18, sigmaSpace=10)

    median_a = float(np.median(a_channel[mask]))
    median_b = float(np.median(b_channel[mask]))
    target_a = (smooth_a.astype(np.float32) * 0.7) + (median_a * 0.3)
    target_b = (smooth_b.astype(np.float32) * 0.7) + (median_b * 0.3)

    a_result = a_channel.astype(np.float32)
    b_result = b_channel.astype(np.float32)
    blend = float(np.clip(strength, 0.0, 1.0))
    a_result[mask] = a_result[mask] * (1.0 - blend) + target_a[mask] * blend
    b_result[mask] = b_result[mask] * (1.0 - blend) + target_b[mask] * blend

    merged = cv2.merge(
        [
            l_channel,
            np.clip(a_result, 0, 255).astype(np.uint8),
            np.clip(b_result, 0, 255).astype(np.uint8),
        ]
    )
    stabilized = cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)
    return Image.fromarray(stabilized, mode="RGB")


def preserve_lines(
    bw_path: Path,
    color_path: Path,
    out_path: Path,
    line_strength: float,
    color_saturation: float,
    color_contrast: float,
    color_brightness: float,
    skin_fix_strength: float,
) -> None:
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
        result = ImageEnhance.Color(result).enhance(color_saturation)
        result = ImageEnhance.Contrast(result).enhance(color_contrast)
        result = ImageEnhance.Brightness(result).enhance(color_brightness)
        result = stabilize_skin_tones(result, skin_fix_strength)
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
        preserve_lines(
            bw_path,
            color_path,
            out_path,
            args.line_strength,
            args.color_saturation,
            args.color_contrast,
            args.color_brightness,
            args.skin_fix_strength,
        )
        print(f"[OK] Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
