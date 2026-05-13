from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run quality checks on colorized pages.")
    parser.add_argument("--input", required=True, help="Colorized image directory")
    parser.add_argument("--reference-bw", required=True, help="Reference black-and-white directory")
    parser.add_argument("--out-report", required=True, help="Output JSON report")
    parser.add_argument("--needs-review", required=True, help="Directory for flagged files")
    parser.add_argument("--blur-threshold", type=float, default=0.24, help="Minimum line variance ratio to pass")
    return parser.parse_args()


def laplacian_variance(image: np.ndarray) -> float:
    return float(cv2.Laplacian(image, cv2.CV_64F).var())


def analyze_file(color_path: Path, bw_path: Path, blur_threshold: float) -> tuple[dict[str, object], bool]:
    record: dict[str, object] = {"file": color_path.name, "issues": []}
    flagged = False
    try:
        with Image.open(color_path) as color_image:
            color_rgb = color_image.convert("RGB")
            width, height = color_rgb.size
            record["size"] = {"width": width, "height": height}
            if width < 256 or height < 256:
                record["issues"].append("size_abnormal")
                flagged = True

            hsv = color_rgb.convert("HSV")
            sat = np.asarray(hsv, dtype=np.float32)[:, :, 1]
            avg_sat = float(np.mean(sat) / 255.0)
            record["avg_saturation"] = round(avg_sat, 4)
            if avg_sat < 0.08:
                record["issues"].append("low_saturation")
                flagged = True

            color_np = cv2.cvtColor(np.asarray(color_rgb), cv2.COLOR_RGB2GRAY)
    except Exception as exc:  # noqa: BLE001
        record["issues"].append(f"image_open_failed:{exc}")
        return record, True

    if not bw_path.exists():
        record["issues"].append("missing_reference_bw")
        return record, True

    try:
        with Image.open(bw_path) as bw_image:
            bw_gray = np.asarray(bw_image.convert("L"))
    except Exception as exc:  # noqa: BLE001
        record["issues"].append(f"reference_open_failed:{exc}")
        return record, True

    if bw_gray.shape != color_np.shape:
        record["issues"].append("size_mismatch_vs_reference")
        flagged = True

    color_var = laplacian_variance(color_np)
    bw_var = laplacian_variance(bw_gray)
    record["laplacian_variance"] = round(color_var, 2)
    record["reference_laplacian_variance"] = round(bw_var, 2)
    if bw_var > 0 and color_var < bw_var * blur_threshold:
        record["issues"].append("blurred_lines")
        flagged = True

    size_bytes = color_path.stat().st_size
    record["file_size_bytes"] = size_bytes
    if size_bytes < 30_000:
        record["issues"].append("file_size_abnormal")
        flagged = True

    return record, flagged


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input).expanduser().resolve()
    reference_dir = Path(args.reference_bw).expanduser().resolve()
    report_path = Path(args.out_report).expanduser().resolve()
    review_dir = Path(args.needs_review).expanduser().resolve()
    review_dir.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    records: list[dict[str, object]] = []
    input_files = sorted(input_dir.glob("*.png"))
    reference_files = sorted(reference_dir.glob("*.png"))
    reference_names = {path.name for path in reference_files}

    missing_files = sorted(reference_names - {path.name for path in input_files})
    for missing in missing_files:
        records.append({"file": missing, "issues": ["missing_output_file"]})

    for color_path in input_files:
        bw_path = reference_dir / color_path.name
        record, flagged = analyze_file(color_path, bw_path, args.blur_threshold)
        if flagged:
            shutil.copy2(color_path, review_dir / color_path.name)
        records.append(record)

    summary = {
        "total_outputs": len(input_files),
        "missing_outputs": len(missing_files),
        "flagged_outputs": sum(1 for record in records if record.get("issues")),
        "records": records,
    }
    report_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] Wrote report to {report_path}")
    print(f"[OK] Needs review directory: {review_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
