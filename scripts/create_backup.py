from __future__ import annotations

from datetime import datetime
from pathlib import Path
import shutil


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKUP_ROOT = PROJECT_ROOT.parent
EXCLUDE_NAMES = {
    ".git",
    "__pycache__",
    "build",
    "dist",
}
EXCLUDE_PARTS = {
    "logs",
    "reports",
}


def should_ignore(path: Path) -> bool:
    if any(part in EXCLUDE_PARTS for part in path.parts):
        return True
    return path.name in EXCLUDE_NAMES


def main() -> int:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = BACKUP_ROOT / f"{PROJECT_ROOT.name}_backup_{timestamp}"
    backup_dir.mkdir(parents=True, exist_ok=False)

    for source in sorted(PROJECT_ROOT.rglob("*")):
        if should_ignore(source):
            continue
        relative = source.relative_to(PROJECT_ROOT)
        target = backup_dir / relative
        if source.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        elif source.is_file():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)

    print(f"[OK] Backup created at {backup_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
