from __future__ import annotations

from datetime import datetime
from pathlib import Path
import shutil


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DIST_ROOT = PROJECT_ROOT / "dist"
PACKAGE_NAME = "MangaAutoColorizer_LocalApp"
COPY_DIRS = [
    "app",
    "configs",
    "docs",
    "external",
    "models",
    "scripts",
    "skills",
    ".streamlit",
]
COPY_FILES = [
    "README.md",
    "AGENTS.md",
    ".gitignore",
    "requirements-app.txt",
    "requirements-automation.txt",
]
ENSURE_DIRS = [
    "input/pages_bw",
    "input/pdf",
    "output/pages_split",
    "output/preprocessed",
    "output/colorized_raw",
    "output/colorized_fixed",
    "output/final_pdf",
    "output/needs_review",
    "logs",
    "reports",
]


def copy_tree(source: Path, target: Path) -> None:
    shutil.copytree(source, target, dirs_exist_ok=True)


def main() -> int:
    DIST_ROOT.mkdir(parents=True, exist_ok=True)
    package_dir = DIST_ROOT / PACKAGE_NAME
    if package_dir.exists():
        raise FileExistsError(f"Package directory already exists: {package_dir}")

    package_dir.mkdir(parents=True, exist_ok=False)

    for relative in COPY_DIRS:
        source = PROJECT_ROOT / relative
        if source.exists():
            copy_tree(source, package_dir / relative)

    for relative in COPY_FILES:
        source = PROJECT_ROOT / relative
        if source.exists():
            shutil.copy2(source, package_dir / relative)

    for relative in ENSURE_DIRS:
        (package_dir / relative).mkdir(parents=True, exist_ok=True)

    package_readme = package_dir / "RUN_THIS_FIRST.txt"
    package_readme.write_text(
        "\n".join(
            [
                "Manga Auto Colorizer packaged local app",
                "",
                "1. Open PowerShell in this folder.",
                "2. Run scripts\\launch_app.bat",
                "3. Put black-and-white pages into input\\pages_bw or PDFs into input\\pdf.",
                "4. Use the Streamlit interface to start auto colorization.",
            ]
        ),
        encoding="utf-8",
    )

    archive_base = DIST_ROOT / f"{PACKAGE_NAME}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    archive_path = shutil.make_archive(str(archive_base), "zip", root_dir=package_dir)
    print(f"[OK] Package directory created at {package_dir}")
    print(f"[OK] Package archive created at {archive_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
