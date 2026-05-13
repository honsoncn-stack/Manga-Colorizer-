from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime
from pathlib import Path

import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = PROJECT_ROOT / "logs"
PIPELINE_LOG = LOG_DIR / "pipeline.log"
ERROR_LOG = LOG_DIR / "error.log"
CONFIG_PATH = PROJECT_ROOT / "configs" / "config.yaml"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    return yaml.safe_load(CONFIG_PATH.read_text(encoding="utf-8")) or {}


def emit(message: str) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line)
    PIPELINE_LOG.parent.mkdir(parents=True, exist_ok=True)
    with PIPELINE_LOG.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def emit_error(message: str) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line, file=sys.stderr)
    ERROR_LOG.parent.mkdir(parents=True, exist_ok=True)
    with ERROR_LOG.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def parse_args() -> argparse.Namespace:
    config = load_config()
    parser = argparse.ArgumentParser(description="Run the auto-only manga colorization pipeline.")
    parser.add_argument("--input", required=True, help="Input directory of pages or a PDF file")
    parser.add_argument("--model-size", type=int, default=int(config.get("default_model_size", 768)))
    parser.add_argument(
        "--disable-denoise",
        action="store_true",
        default=bool(config.get("default_disable_denoise", True)),
        help="Disable upstream denoising for cleaner line art",
    )
    parser.add_argument("--denoiser-sigma", type=int, default=int(config.get("default_denoiser_sigma", 18)))
    parser.add_argument("--line-strength", type=float, default=float(config.get("default_line_strength", 0.72)))
    parser.add_argument("--color-saturation", type=float, default=float(config.get("default_color_saturation", 1.12)))
    parser.add_argument("--color-contrast", type=float, default=float(config.get("default_color_contrast", 1.05)))
    parser.add_argument("--color-brightness", type=float, default=float(config.get("default_color_brightness", 1.01)))
    parser.add_argument("--skin-fix-strength", type=float, default=float(config.get("default_skin_fix_strength", 0.48)))
    parser.add_argument("--blur-threshold", type=float, default=float(config.get("default_blur_threshold", 0.24)))
    return parser.parse_args()


def clean_generated_outputs() -> None:
    targets = [
        PROJECT_ROOT / "output" / "pages_split",
        PROJECT_ROOT / "output" / "preprocessed",
        PROJECT_ROOT / "output" / "preprocessed" / "colorization",
        PROJECT_ROOT / "output" / "colorized_raw",
        PROJECT_ROOT / "output" / "colorized_fixed",
        PROJECT_ROOT / "output" / "needs_review",
        PROJECT_ROOT / "output" / "final_pdf",
    ]
    for directory in targets:
        if not directory.exists():
            continue
        for file_path in sorted(directory.rglob("*")):
            if file_path.is_file():
                file_path.unlink(missing_ok=True)

    quality_report = PROJECT_ROOT / "reports" / "quality_report.json"
    if quality_report.exists():
        quality_report.unlink(missing_ok=True)


def run_step(name: str, command: list[str]) -> None:
    emit(f"Starting step: {name}")
    result = subprocess.run(
        command,
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.stdout:
        for line in result.stdout.splitlines():
            emit(f"{name}: {line}")
    if result.stderr:
        for line in result.stderr.splitlines():
            emit_error(f"{name}: {line}")
    if result.returncode != 0:
        raise RuntimeError(f"Step failed: {name}")
    emit(f"Completed step: {name}")


def main() -> int:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    python_exe = Path(sys.executable).resolve()

    pages_split_dir = PROJECT_ROOT / "output" / "pages_split"
    preprocessed_dir = PROJECT_ROOT / "output" / "preprocessed"
    colorized_raw_dir = PROJECT_ROOT / "output" / "colorized_raw"
    colorized_fixed_dir = PROJECT_ROOT / "output" / "colorized_fixed"
    final_pdf_path = PROJECT_ROOT / "output" / "final_pdf" / "chapter_colorized.pdf"
    quality_report_path = PROJECT_ROOT / "reports" / "quality_report.json"
    needs_review_dir = PROJECT_ROOT / "output" / "needs_review"
    repo_dir = PROJECT_ROOT / "external" / "manga-colorization-v2"

    try:
        if not input_path.exists():
            raise FileNotFoundError(f"Input path not found: {input_path}")

        clean_generated_outputs()

        if input_path.is_file() and input_path.suffix.lower() == ".pdf":
            run_step(
                "pdf_to_pages",
                [
                    str(python_exe),
                    str(PROJECT_ROOT / "scripts" / "01_pdf_to_pages.py"),
                    "--input",
                    str(input_path),
                    "--out",
                    str(pages_split_dir),
                    "--dpi",
                    "300",
                ],
            )
            preprocess_input = pages_split_dir
        elif input_path.is_dir():
            preprocess_input = input_path
        else:
            raise RuntimeError("Input must be a PDF file or an image directory")

        run_step(
            "preprocess_pages",
            [
                str(python_exe),
                str(PROJECT_ROOT / "scripts" / "02_preprocess_pages.py"),
                "--input",
                str(preprocess_input),
                "--out",
                str(preprocessed_dir),
                "--enhance-lines",
            ],
        )

        colorize_command = [
            str(python_exe),
            str(PROJECT_ROOT / "scripts" / "03_colorize_auto.py"),
            "--input",
            str(preprocessed_dir),
            "--out",
            str(colorized_raw_dir),
            "--repo",
            str(repo_dir),
            "--size",
            str(args.model_size),
            "--denoiser-sigma",
            str(args.denoiser_sigma),
        ]
        if args.disable_denoise:
            colorize_command.append("--no-denoise")
        run_step("colorize_auto", colorize_command)

        run_step(
            "preserve_ink_lines",
            [
                str(python_exe),
                str(PROJECT_ROOT / "scripts" / "04_preserve_ink_lines.py"),
                "--bw-dir",
                str(preprocessed_dir),
                "--color-dir",
                str(colorized_raw_dir),
                "--out",
                str(colorized_fixed_dir),
                "--line-strength",
                str(args.line_strength),
                "--color-saturation",
                str(args.color_saturation),
                "--color-contrast",
                str(args.color_contrast),
                "--color-brightness",
                str(args.color_brightness),
                "--skin-fix-strength",
                str(args.skin_fix_strength),
            ],
        )
        run_step(
            "quality_check",
            [
                str(python_exe),
                str(PROJECT_ROOT / "scripts" / "05_quality_check.py"),
                "--input",
                str(colorized_fixed_dir),
                "--reference-bw",
                str(preprocessed_dir),
                "--out-report",
                str(quality_report_path),
                "--needs-review",
                str(needs_review_dir),
                "--blur-threshold",
                str(args.blur_threshold),
            ],
        )
        run_step(
            "export_pdf",
            [
                str(python_exe),
                str(PROJECT_ROOT / "scripts" / "06_export_pdf.py"),
                "--input",
                str(colorized_fixed_dir),
                "--out",
                str(final_pdf_path),
            ],
        )
    except Exception as exc:  # noqa: BLE001
        emit_error(f"Pipeline failed: {exc}")
        return 1

    emit("Pipeline completed successfully")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
