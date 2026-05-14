from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
LIBRARY_ROOT = PROJECT_ROOT / "library"
BOOKS_ROOT = LIBRARY_ROOT / "books"
LIBRARY_INDEX_PATH = LIBRARY_ROOT / "library_index.json"
READER_LOG = PROJECT_ROOT / "logs" / "reader_colorize.log"
SUPPORTED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def utc_timestamp() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def ensure_library_root() -> None:
    LIBRARY_ROOT.mkdir(parents=True, exist_ok=True)
    BOOKS_ROOT.mkdir(parents=True, exist_ok=True)


def natural_sort_key(value: str) -> list[Any]:
    parts = re.split(r"(\d+)", value.lower())
    return [int(part) if part.isdigit() else part for part in parts]


def page_file_name(page_number: int) -> str:
    return f"{page_number:03d}.png"


def load_library_index() -> dict[str, Any]:
    ensure_library_root()
    if not LIBRARY_INDEX_PATH.exists():
        return {"books": [], "updated_at": None}
    return json.loads(LIBRARY_INDEX_PATH.read_text(encoding="utf-8"))


def save_library_index(data: dict[str, Any]) -> None:
    ensure_library_root()
    data["updated_at"] = utc_timestamp()
    LIBRARY_INDEX_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def next_book_id(index_data: dict[str, Any]) -> str:
    existing_ids = {str(book.get("book_id", "")) for book in index_data.get("books", [])}
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    for _ in range(100):
        candidate = f"book_{timestamp}_{uuid4().hex[:8]}"
        if candidate not in existing_ids and not book_root(candidate).exists():
            return candidate
    raise RuntimeError("Could not allocate a unique book id")


def book_root(book_id: str) -> Path:
    return BOOKS_ROOT / book_id


def book_manifest_path(book_id: str) -> Path:
    return book_root(book_id) / "manifest.json"


def ensure_book_structure(book_id: str) -> dict[str, Path]:
    root = book_root(book_id)
    paths = {
        "root": root,
        "manifest": root / "manifest.json",
        "pages_bw": root / "pages_bw",
        "pages_color": root / "pages_color",
        "thumbnails": root / "thumbnails",
        "export": root / "export",
    }
    for path in paths.values():
        if path.suffix:
            continue
        path.mkdir(parents=True, exist_ok=True)
    return paths


def load_manifest(book_id: str) -> dict[str, Any]:
    manifest_path = book_manifest_path(book_id)
    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest not found for {book_id}: {manifest_path}")
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def save_manifest(manifest: dict[str, Any]) -> None:
    manifest["updated_at"] = utc_timestamp()
    manifest_path = book_manifest_path(str(manifest["book_id"]))
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def build_index_entry(manifest: dict[str, Any]) -> dict[str, Any]:
    book_id = str(manifest["book_id"])
    thumb_name = page_file_name(1)
    thumbnail_path = book_root(book_id) / "thumbnails" / thumb_name
    cover_url = None
    if thumbnail_path.exists():
        cover_url = f"/media/library/{book_id}/thumbnails/{thumb_name}?v={thumbnail_path.stat().st_mtime_ns}"
    return {
        "book_id": book_id,
        "title": manifest.get("title", book_id),
        "source_type": manifest.get("source_type", "folder"),
        "total_pages": int(manifest.get("total_pages", 0)),
        "current_page": int(manifest.get("current_page", 1)),
        "colorized_count": len(manifest.get("colorized_pages", [])),
        "cover_url": cover_url,
        "updated_at": manifest.get("updated_at"),
        "created_at": manifest.get("created_at"),
    }


def upsert_index_entry(manifest: dict[str, Any]) -> None:
    index_data = load_library_index()
    entry = build_index_entry(manifest)
    books = index_data.get("books", [])
    replaced = False
    for position, current in enumerate(books):
        if current.get("book_id") == entry["book_id"]:
            books[position] = entry
            replaced = True
            break
    if not replaced:
        books.append(entry)
    books.sort(key=lambda item: str(item.get("updated_at") or ""), reverse=True)
    index_data["books"] = books
    save_library_index(index_data)


def remove_index_entry(book_id: str) -> None:
    index_data = load_library_index()
    index_data["books"] = [book for book in index_data.get("books", []) if book.get("book_id") != book_id]
    save_library_index(index_data)


def iter_image_files(folder: Path) -> list[Path]:
    return sorted(
        [path for path in folder.iterdir() if path.is_file() and path.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS],
        key=lambda path: natural_sort_key(path.name),
    )


def create_thumbnail(source: Path, target: Path, max_size: int = 360) -> None:
    with Image.open(source) as image:
        thumbnail = image.convert("RGB")
        thumbnail.thumbnail((max_size, max_size))
        thumbnail.save(target, format="PNG")


def manifest_page_path(book_id: str, page_number: int, *, color: bool = False) -> Path:
    subdir = "pages_color" if color else "pages_bw"
    return book_root(book_id) / subdir / page_file_name(page_number)


def update_current_page(book_id: str, page_number: int) -> dict[str, Any]:
    manifest = load_manifest(book_id)
    manifest["current_page"] = page_number
    save_manifest(manifest)
    upsert_index_entry(manifest)
    return manifest


def add_colorized_page(book_id: str, page_number: int) -> dict[str, Any]:
    manifest = load_manifest(book_id)
    existing = {int(value) for value in manifest.get("colorized_pages", [])}
    existing.add(page_number)
    manifest["colorized_pages"] = sorted(existing)
    save_manifest(manifest)
    upsert_index_entry(manifest)
    return manifest


def log_reader(message: str) -> None:
    READER_LOG.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with READER_LOG.open("a", encoding="utf-8") as handle:
        handle.write(f"[{timestamp}] {message}\n")


def remove_tree_one_by_one(root: Path) -> None:
    if not root.exists():
        return
    for file_path in sorted((path for path in root.rglob("*") if path.is_file()), key=lambda path: len(path.parts), reverse=True):
        file_path.unlink()
    for dir_path in sorted((path for path in root.rglob("*") if path.is_dir()), key=lambda path: len(path.parts), reverse=True):
        dir_path.rmdir()
    root.rmdir()
