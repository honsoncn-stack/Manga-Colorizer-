from __future__ import annotations

import json
from pathlib import Path

import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_yaml(path: Path) -> dict:
    if not path.exists():
        return {}
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def tail_text(path: Path, max_lines: int) -> str:
    if not path.exists():
        return ""
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(lines[-max_lines:])


def list_preview_images(directory: Path, limit: int) -> list[Path]:
    if not directory.exists():
        return []
    return sorted(directory.glob("*.png"))[:limit]


def read_quality_report(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {}
