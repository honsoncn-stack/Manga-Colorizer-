from __future__ import annotations

import argparse
import shutil
import zipfile
from pathlib import Path

import fitz

from library_utils import (
    BOOKS_ROOT,
    SUPPORTED_IMAGE_EXTENSIONS,
    build_index_entry,
    create_thumbnail,
    ensure_book_structure,
    ensure_library_root,
    iter_image_files,
    load_library_index,
    natural_sort_key,
    next_book_id,
    page_file_name,
    save_manifest,
    upsert_index_entry,
    utc_timestamp,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Manage the local manga reader library.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    folder_parser = subparsers.add_parser("import-folder", help="Import a folder of black-and-white pages")
    folder_parser.add_argument("--input", required=True, help="Input image folder")
    folder_parser.add_argument("--title", required=True, help="Book title")

    pdf_parser = subparsers.add_parser("import-pdf", help="Import a PDF into the local library")
    pdf_parser.add_argument("--input", required=True, help="Input PDF path")
    pdf_parser.add_argument("--title", required=True, help="Book title")

    cbz_parser = subparsers.add_parser("import-cbz", help="Import a CBZ archive into the local library")
    cbz_parser.add_argument("--input", required=True, help="Input CBZ path")
    cbz_parser.add_argument("--title", required=True, help="Book title")

    return parser.parse_args()


def new_manifest(book_id: str, title: str, source_type: str, source_path: Path, total_pages: int) -> dict[str, object]:
    timestamp = utc_timestamp()
    return {
        "book_id": book_id,
        "title": title,
        "source_type": source_type,
        "source_path": str(source_path),
        "total_pages": total_pages,
        "current_page": 1 if total_pages else 0,
        "colorized_pages": [],
        "created_at": timestamp,
        "updated_at": timestamp,
    }


def import_folder(input_dir: Path, title: str) -> dict[str, object]:
    images = iter_image_files(input_dir)
    if not images:
        raise FileNotFoundError(f"No supported images found in: {input_dir}")

    index_data = load_library_index()
    book_id = next_book_id(index_data)
    paths = ensure_book_structure(book_id)

    for page_number, source in enumerate(images, start=1):
        target = paths["pages_bw"] / page_file_name(page_number)
        shutil.copy2(source, target)
        thumb_target = paths["thumbnails"] / page_file_name(page_number)
        create_thumbnail(target, thumb_target)

    manifest = new_manifest(book_id, title, "folder", input_dir, len(images))
    save_manifest(manifest)
    upsert_index_entry(manifest)
    print(f"[OK] Imported folder as {book_id} into {BOOKS_ROOT / book_id}")
    return build_index_entry(manifest)


def import_pdf(input_pdf: Path, title: str) -> dict[str, object]:
    if not input_pdf.exists():
        raise FileNotFoundError(f"PDF not found: {input_pdf}")

    index_data = load_library_index()
    book_id = next_book_id(index_data)
    paths = ensure_book_structure(book_id)

    document = fitz.open(input_pdf)
    try:
        for page_index in range(document.page_count):
            page = document.load_page(page_index)
            pixmap = page.get_pixmap(matrix=fitz.Matrix(300 / 72, 300 / 72), alpha=False)
            target = paths["pages_bw"] / page_file_name(page_index + 1)
            pixmap.save(target)
            create_thumbnail(target, paths["thumbnails"] / page_file_name(page_index + 1))
    finally:
        document.close()

    manifest = new_manifest(book_id, title, "pdf", input_pdf, len(list(paths["pages_bw"].glob("*.png"))))
    save_manifest(manifest)
    upsert_index_entry(manifest)
    print(f"[OK] Imported PDF as {book_id} into {BOOKS_ROOT / book_id}")
    return build_index_entry(manifest)


def import_cbz(input_cbz: Path, title: str) -> dict[str, object]:
    if not input_cbz.exists():
        raise FileNotFoundError(f"CBZ not found: {input_cbz}")

    index_data = load_library_index()
    book_id = next_book_id(index_data)
    paths = ensure_book_structure(book_id)

    with zipfile.ZipFile(input_cbz) as archive:
        names = sorted(
            [
                name
                for name in archive.namelist()
                if Path(name).suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS and not name.endswith("/")
            ],
            key=natural_sort_key,
        )
        if not names:
            raise FileNotFoundError(f"No supported images found inside CBZ: {input_cbz}")
        for page_number, member in enumerate(names, start=1):
            target = paths["pages_bw"] / page_file_name(page_number)
            with archive.open(member) as source_handle, target.open("wb") as target_handle:
                shutil.copyfileobj(source_handle, target_handle)
            create_thumbnail(target, paths["thumbnails"] / page_file_name(page_number))

    manifest = new_manifest(book_id, title, "cbz", input_cbz, len(list(paths["pages_bw"].glob("*.png"))))
    save_manifest(manifest)
    upsert_index_entry(manifest)
    print(f"[OK] Imported CBZ as {book_id} into {BOOKS_ROOT / book_id}")
    return build_index_entry(manifest)


def main() -> int:
    ensure_library_root()
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    title = str(args.title).strip()
    if not title:
        raise ValueError("Title cannot be empty")

    if args.command == "import-folder":
        if not input_path.is_dir():
            raise NotADirectoryError(f"Input folder not found: {input_path}")
        import_folder(input_path, title)
    elif args.command == "import-pdf":
        import_pdf(input_path, title)
    elif args.command == "import-cbz":
        import_cbz(input_path, title)
    else:
        raise ValueError(f"Unsupported command: {args.command}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
