from __future__ import annotations

import shutil
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXPECTED_PYTHON = Path(r"D:\CondaEnvs\manga-color-v2\python.exe")


def emit(level: str, message: str) -> None:
    print(f"[{level}] {message}")


def check_exists(path: Path, label: str) -> bool:
    if path.exists():
        emit("OK", f"{label}: {path}")
        return True
    emit("ERROR", f"{label} missing: {path}")
    return False


def check_writable(path: Path, label: str) -> bool:
    try:
        path.mkdir(parents=True, exist_ok=True)
        test_file = path / ".doctor_write_test.tmp"
        test_file.write_text("ok", encoding="utf-8")
        test_file.unlink()
        emit("OK", f"{label} writable: {path}")
        return True
    except Exception as exc:  # noqa: BLE001
        emit("ERROR", f"{label} not writable: {path} ({exc})")
        return False


def main() -> int:
    failed = False

    if shutil.which("git"):
        emit("OK", "git is available")
    else:
        emit("ERROR", "git is not available")
        failed = True

    if (PROJECT_ROOT / "AGENTS.md").exists():
        emit("OK", f"Project root looks correct: {PROJECT_ROOT}")
    else:
        emit("ERROR", f"Project root validation failed: {PROJECT_ROOT}")
        failed = True

    for path, label in [
        (EXPECTED_PYTHON, "Python executable"),
        (PROJECT_ROOT / "external" / "manga-colorization-v2", "manga-colorization-v2 repo"),
        (PROJECT_ROOT / "external" / "manga-colorization-v2" / "inference.py", "inference.py"),
        (PROJECT_ROOT / "models" / "downloads", "weight download directory"),
    ]:
        if not check_exists(path, label):
            failed = True

    for path, label in [
        (PROJECT_ROOT / "input" / "pages_bw", "input/pages_bw"),
        (PROJECT_ROOT / "input" / "pdf", "input/pdf"),
        (PROJECT_ROOT / "input" / "cbz", "input/cbz"),
        (PROJECT_ROOT / "output", "output"),
        (PROJECT_ROOT / "logs", "logs"),
        (PROJECT_ROOT / "reports", "reports"),
        (PROJECT_ROOT / "library" / "books", "library/books"),
    ]:
        if not check_writable(path, label):
            failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
