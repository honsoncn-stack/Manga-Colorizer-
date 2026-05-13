from __future__ import annotations

import argparse

from colorize_book_page import colorize_page
from library_utils import load_manifest, log_reader


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Colorize a page range from a local reader-mode book.")
    parser.add_argument("--book-id", required=True, help="Book id such as book_001")
    parser.add_argument("--start-page", type=int, help="Start page number, defaults to 1")
    parser.add_argument("--end-page", type=int, help="End page number, defaults to total pages")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = load_manifest(args.book_id)
    total_pages = int(manifest.get("total_pages", 0))
    start_page = args.start_page or 1
    end_page = args.end_page or total_pages

    if start_page < 1 or end_page < start_page or end_page > total_pages:
        raise ValueError(f"Invalid page range: {start_page}..{end_page} for total pages {total_pages}")

    log_reader(f"[BATCH] start book={args.book_id} range={start_page}-{end_page}")
    success_count = 0
    failure_count = 0

    for page_number in range(start_page, end_page + 1):
        try:
            colorize_page(args.book_id, page_number)
            success_count += 1
            print(f"[OK] page={page_number}")
        except Exception as exc:  # noqa: BLE001
            failure_count += 1
            log_reader(f"[BATCH][ERROR] book={args.book_id} page={page_number} error={exc}")
            print(f"[ERROR] page={page_number} error={exc}")

    log_reader(
        f"[BATCH] done book={args.book_id} range={start_page}-{end_page} success={success_count} failed={failure_count}"
    )
    if failure_count:
        raise RuntimeError(f"Colorized {success_count} pages, failed on {failure_count} pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
