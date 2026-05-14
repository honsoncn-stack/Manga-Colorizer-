from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from library_utils import (
    PROJECT_ROOT,
    add_colorized_page,
    load_manifest,
    log_reader,
    manifest_page_path,
    page_file_name,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Colorize a single page from a local reader-mode book.")
    parser.add_argument("--book-id", required=True, help="Book id such as book_001")
    parser.add_argument("--page", type=int, required=True, help="1-based page number")
    return parser.parse_args()


def resolve_generated_page(output_dir: Path, expected_name: str) -> Path:
    expected_path = output_dir / expected_name
    if expected_path.exists():
        return expected_path

    candidates = sorted(
        path
        for path in output_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
    )
    if len(candidates) == 1:
        log_reader(f"[PAGE] remapped generated page {candidates[0].name} -> {expected_name}")
        return candidates[0]
    raise FileNotFoundError(f"Colorized output not found: {expected_path}")


def run_step(name: str, command: list[str]) -> None:
    log_reader(f"[STEP] {name} :: {' '.join(command)}")
    result = subprocess.run(
        command,
        cwd=str(PROJECT_ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.stdout:
        for line in result.stdout.splitlines():
            log_reader(f"[{name}] {line}")
    if result.stderr:
        for line in result.stderr.splitlines():
            log_reader(f"[{name}][stderr] {line}")
    if result.returncode != 0:
        raise RuntimeError(f"{name} failed with exit code {result.returncode}")


def colorize_page(book_id: str, page_number: int) -> Path:
    manifest = load_manifest(book_id)
    total_pages = int(manifest.get("total_pages", 0))
    if page_number < 1 or page_number > total_pages:
        raise ValueError(f"Page {page_number} is outside 1..{total_pages}")

    source_page = manifest_page_path(book_id, page_number, color=False)
    if not source_page.exists():
        raise FileNotFoundError(f"Source page not found: {source_page}")

    target_page = manifest_page_path(book_id, page_number, color=True)
    target_page.parent.mkdir(parents=True, exist_ok=True)
    if target_page.exists():
        add_colorized_page(book_id, page_number)
        log_reader(f"[PAGE] skip book={book_id} page={page_number} already_colorized={target_page}")
        return target_page

    python_exe = Path(sys.executable).resolve()
    repo_dir = PROJECT_ROOT / "external" / "manga-colorization-v2"
    page_name = page_file_name(page_number)

    log_reader(f"[PAGE] start book={book_id} page={page_number}")
    with tempfile.TemporaryDirectory(prefix=f"{book_id}_{page_number:03d}_", dir=str(target_page.parent)) as temp_dir:
        temp_root = Path(temp_dir)
        input_dir = temp_root / "input"
        preprocess_dir = temp_root / "preprocessed"
        raw_dir = temp_root / "colorized_raw"
        fixed_dir = temp_root / "colorized_fixed"
        for directory in (input_dir, preprocess_dir, raw_dir, fixed_dir):
            directory.mkdir(parents=True, exist_ok=True)

        staged_page = input_dir / page_name
        shutil.copy2(source_page, staged_page)

        run_step(
            "preprocess",
            [
                str(python_exe),
                str(PROJECT_ROOT / "scripts" / "02_preprocess_pages.py"),
                "--input",
                str(input_dir),
                "--out",
                str(preprocess_dir),
                "--enhance-lines",
            ],
        )
        run_step(
            "colorize",
            [
                str(python_exe),
                str(PROJECT_ROOT / "scripts" / "03_colorize_auto.py"),
                "--input",
                str(preprocess_dir),
                "--out",
                str(raw_dir),
                "--repo",
                str(repo_dir),
                "--size",
                "768",
                "--denoiser-sigma",
                "18",
                "--no-denoise",
            ],
        )
        run_step(
            "preserve_lines",
            [
                str(python_exe),
                str(PROJECT_ROOT / "scripts" / "04_preserve_ink_lines.py"),
                "--bw-dir",
                str(preprocess_dir),
                "--color-dir",
                str(raw_dir),
                "--out",
                str(fixed_dir),
                "--line-strength",
                "0.72",
                "--color-saturation",
                "1.12",
                "--color-contrast",
                "1.05",
                "--color-brightness",
                "1.01",
                "--skin-fix-strength",
                "0.48",
            ],
        )

        fixed_page = resolve_generated_page(fixed_dir, page_name)
        shutil.copy2(fixed_page, target_page)

    add_colorized_page(book_id, page_number)
    log_reader(f"[PAGE] done book={book_id} page={page_number} -> {target_page}")
    return target_page


def main() -> int:
    args = parse_args()
    colorize_page(args.book_id, args.page)
    print(f"[OK] page={args.page}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
