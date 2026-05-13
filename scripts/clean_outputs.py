from __future__ import annotations

import argparse
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clean generated output, logs, and reports files.")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    return parser.parse_args()


def collect_targets() -> list[Path]:
    targets: list[Path] = []
    for relative in ("output", "logs", "reports"):
        base = PROJECT_ROOT / relative
        if not base.exists():
            continue
        for path in sorted(base.rglob("*"), key=lambda item: (item.is_dir(), str(item))):
            if path.is_file():
                targets.append(path)
    return targets


def main() -> int:
    args = parse_args()
    targets = collect_targets()
    if not targets:
        print("[OK] Nothing to clean.")
        return 0

    print("The following files will be deleted one by one:")
    for path in targets:
        print(f"- {path}")

    if not args.yes:
        confirmation = input("Type YES to continue: ").strip()
        if confirmation != "YES":
            print("[WARN] Cancelled.")
            return 1

    for path in targets:
        path.unlink(missing_ok=True)
        print(f"[OK] Deleted {path}")

    for relative in ("output", "logs", "reports"):
        base = PROJECT_ROOT / relative
        for path in sorted(base.rglob("*"), reverse=True):
            if path.is_dir():
                try:
                    path.rmdir()
                    print(f"[OK] Removed empty directory {path}")
                except OSError:
                    pass
        base.mkdir(parents=True, exist_ok=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
