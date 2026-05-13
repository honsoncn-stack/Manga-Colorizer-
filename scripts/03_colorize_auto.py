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


def copy_generated_images(repo_dir: Path, before: dict[str, Path], out_dir: Path, started_at: float) -> int:
    after = collect_images(repo_dir)
    copied = 0
    for name, path in sorted(after.items()):
        if name in before and before[name] == path:
            continue
        if path.stat().st_mtime < started_at:
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
    out_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise FileNotFoundError(f"Input path not found: {input_path}")
    if not inference_script.exists():
        raise FileNotFoundError(f"Inference script not found: {inference_script}")

    before = collect_images(repo_dir)
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

    copied = copy_generated_images(repo_dir, before, out_dir, started_at)

    if copied == 0:
        raise RuntimeError("No generated images were detected after inference")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
