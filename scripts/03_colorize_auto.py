from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run manga-colorization-v2 auto colorization.")
    parser.add_argument("--input", default="output/preprocessed", help="Input file or directory")
    parser.add_argument("--out", default="output/colorized_raw", help="Output directory")
    parser.add_argument("--repo", default="external/manga-colorization-v2", help="Repository directory")
    return parser.parse_args()


def collect_images(root: Path) -> dict[str, Path]:
    return {
        path.name: path
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    }


def resolve_generated_root(input_path: Path) -> Path:
    if input_path.is_dir():
        return input_path / "colorization"
    return input_path.parent


def copy_generated_images(input_path: Path, out_dir: Path, started_at: float) -> int:
    generated_root = resolve_generated_root(input_path)
    if not generated_root.exists():
        return 0

    after = collect_images(generated_root)
    copied = 0
    for name, path in sorted(after.items()):
        if path.stat().st_mtime < started_at:
            continue
        if input_path.is_file():
            expected_name = f"{input_path.stem}_colorized.png"
            if path.name != expected_name:
                continue
        target = out_dir / name
        shutil.copy2(path, target)
        copied += 1
        print(f"[OK] Copied generated image to {target}")
    return copied


def main() -> int:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    out_dir = Path(args.out).expanduser().resolve()
    repo_dir = Path(args.repo).expanduser().resolve()
    inference_script = repo_dir / "inference.py"
    generator_path = repo_dir / "networks" / "generator.zip"
    extractor_path = repo_dir / "networks" / "extractor.pth"
    denoiser_path = repo_dir / "denoising" / "models" / "net_rgb.pth"
    out_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise FileNotFoundError(f"Input path not found: {input_path}")
    if not inference_script.exists():
        raise FileNotFoundError(f"Inference script not found: {inference_script}")
    if not generator_path.exists():
        raise FileNotFoundError(
            f"Missing generator weight: {generator_path}. Run scripts/download_weights_manga_colorization_v2.py first."
        )
    if not extractor_path.exists():
        print(f"[WARN] Optional extractor weight not found: {extractor_path}")
    if not denoiser_path.exists():
        raise FileNotFoundError(
            f"Missing denoiser weight: {denoiser_path}. Run scripts/download_weights_manga_colorization_v2.py first."
        )

    started_at = time.time()
    command = [sys.executable, str(inference_script), "-p", str(input_path)]
    print(f"[OK] Running: {' '.join(command)}")
    result = subprocess.run(
        command,
        cwd=repo_dir,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip())
    if result.returncode != 0:
        raise RuntimeError(f"inference.py failed with exit code {result.returncode}")

    copied = copy_generated_images(input_path, out_dir, started_at)

    if copied == 0:
        raise RuntimeError("No generated images were detected after inference")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
