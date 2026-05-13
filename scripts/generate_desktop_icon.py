"""Generate a self-made desktop icon for the Manga Auto Colorizer app."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw


PROJECT_ROOT = Path(r"D:\AIProjects\manga-auto-colorizer")
BUILD_DIR = PROJECT_ROOT / "desktop" / "build"
PNG_PATH = BUILD_DIR / "icon.png"
ICO_PATH = BUILD_DIR / "icon.ico"


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def gradient_background(size: int) -> Image.Image:
    start = (16, 16, 24)
    end = (23, 26, 46)
    image = Image.new("RGBA", (size, size))
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            mix = ((x / max(size - 1, 1)) * 0.55) + ((y / max(size - 1, 1)) * 0.45)
            mix = min(1.0, max(0.0, mix))
            pixels[x, y] = (
                lerp(start[0], end[0], mix),
                lerp(start[1], end[1], mix),
                lerp(start[2], end[2], mix),
                255,
            )
    return image


def build_icon(size: int = 512) -> Image.Image:
    image = gradient_background(size)
    draw = ImageDraw.Draw(image)

    # Soft corner glow
    draw.ellipse((size * 0.06, size * 0.04, size * 0.52, size * 0.5), fill=(255, 111, 174, 28))
    draw.ellipse((size * 0.48, size * 0.54, size * 0.95, size * 1.0), fill=(87, 215, 255, 24))

    # Manga panel frame
    frame = (size * 0.12, size * 0.14, size * 0.88, size * 0.82)
    draw.rounded_rectangle(frame, radius=int(size * 0.08), outline=(248, 244, 234, 245), width=max(10, size // 48), fill=(255, 255, 255, 18))

    # Inner panel split
    panel_mid_x = size * 0.52
    draw.line((panel_mid_x, size * 0.18, panel_mid_x, size * 0.78), fill=(248, 244, 234, 120), width=max(4, size // 160))

    # Brush handle
    handle_start = (size * 0.28, size * 0.68)
    handle_end = (size * 0.64, size * 0.32)
    draw.line((handle_start, handle_end), fill=(255, 111, 174, 255), width=max(20, size // 18))
    draw.line((handle_start, handle_end), fill=(87, 215, 255, 180), width=max(10, size // 32))

    # Brush tip
    tip = [
        (size * 0.67, size * 0.29),
        (size * 0.76, size * 0.22),
        (size * 0.73, size * 0.34),
    ]
    draw.polygon(tip, fill=(248, 244, 234, 255))
    draw.line((size * 0.70, size * 0.28, size * 0.79, size * 0.18), fill=(255, 209, 102, 255), width=max(6, size // 80))

    # Highlight star
    cx, cy = size * 0.73, size * 0.22
    points = []
    for index in range(8):
        angle = (index / 8.0) * 3.1415926 * 2
        radius = size * (0.07 if index % 2 == 0 else 0.03)
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    draw.polygon(points, fill=(255, 209, 102, 255))

    # Small status bars
    for offset, width, color in [
        (0.60, 0.18, (94, 243, 160, 255)),
        (0.68, 0.14, (87, 215, 255, 255)),
        (0.76, 0.10, (255, 111, 174, 255)),
    ]:
        y = size * offset
        draw.rounded_rectangle((size * 0.20, y, size * (0.20 + width), y + size * 0.024), radius=int(size * 0.012), fill=color)

    return image


def main() -> None:
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    icon_png = build_icon(512)
    icon_png.save(PNG_PATH)

    sizes = [16, 24, 32, 48, 64, 96, 128, 256, 512]
    icon_png.save(ICO_PATH, sizes=[(size, size) for size in sizes])

    print(f"[OK] PNG: {PNG_PATH}")
    print(f"[OK] ICO: {ICO_PATH}")


if __name__ == "__main__":
    main()
