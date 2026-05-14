from __future__ import annotations

import importlib
import json
import subprocess
import sys
import threading
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from starlette.staticfiles import StaticFiles


PROJECT_ROOT = Path(r"D:\AIProjects\manga-auto-colorizer").resolve()
SCRIPTS_ROOT = PROJECT_ROOT / "scripts"
if str(SCRIPTS_ROOT) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_ROOT))

from library_utils import (  # noqa: E402
    BOOKS_ROOT,
    LIBRARY_INDEX_PATH,
    LIBRARY_ROOT,
    READER_LOG,
    add_colorized_page,
    book_root,
    load_library_index,
    load_manifest,
    manifest_page_path,
    remove_index_entry,
    remove_tree_one_by_one,
    save_manifest,
    update_current_page,
    upsert_index_entry,
)


PYTHON_EXE = Path(r"D:\CondaEnvs\manga-color-v2\python.exe").resolve()
APP_HOST = "127.0.0.1"
APP_PORT = 8765
APP_BASE_URL = f"http://{APP_HOST}:{APP_PORT}"

DESKTOP_ROOT = PROJECT_ROOT / "desktop"
BACKEND_ROOT = DESKTOP_ROOT / "backend"
BACKEND_LOG = BACKEND_ROOT / "logs" / "backend.log"

INPUT_PAGES = PROJECT_ROOT / "input" / "pages_bw"
INPUT_PDF = PROJECT_ROOT / "input" / "pdf"
OUTPUT_ROOT = PROJECT_ROOT / "output"
OUTPUT_FIXED = OUTPUT_ROOT / "colorized_fixed"
OUTPUT_FINAL_PDF = OUTPUT_ROOT / "final_pdf"
OUTPUT_NEEDS_REVIEW = OUTPUT_ROOT / "needs_review"
PIPELINE_THUMBS = OUTPUT_ROOT / "thumbs_gallery"
ALLOWED_DELETE_ROOTS = (INPUT_PAGES, OUTPUT_FIXED, OUTPUT_NEEDS_REVIEW)
PIPELINE_SCRIPT = PROJECT_ROOT / "scripts" / "pipeline.py"
CLEAN_SCRIPT = PROJECT_ROOT / "scripts" / "clean_outputs.py"
LIBRARY_MANAGER_SCRIPT = PROJECT_ROOT / "scripts" / "library_manager.py"
COLORIZE_BOOK_PAGE_SCRIPT = PROJECT_ROOT / "scripts" / "colorize_book_page.py"
COLORIZE_BOOK_BATCH_SCRIPT = PROJECT_ROOT / "scripts" / "colorize_book_batch.py"
EXPORT_BOOK_PDF_SCRIPT = PROJECT_ROOT / "scripts" / "export_book_pdf.py"

REPO_DIR = PROJECT_ROOT / "external" / "manga-colorization-v2"
INFERENCE_SCRIPT = REPO_DIR / "inference.py"
GENERATOR_WEIGHT = REPO_DIR / "networks" / "generator.zip"
DENOISER_WEIGHT = REPO_DIR / "denoising" / "models" / "net_rgb.pth"

PIPELINE_LOG = PROJECT_ROOT / "logs" / "pipeline.log"
ERROR_LOG = PROJECT_ROOT / "logs" / "error.log"
GALLERY_DEFAULT_PAGE_SIZE = 24
GALLERY_MAX_PAGE_SIZE = 100

PIPELINE_STEPS = [
    ("Waiting", 0),
    ("Preparing", 5),
    ("Preprocessing", 18),
    ("Colorizing", 40),
    ("Preserving Lines", 65),
    ("Quality Check", 85),
    ("Exporting PDF", 95),
    ("Done", 100),
]
STEP_ALIASES = {
    "pdf_to_pages": ("Preparing", 10),
    "preprocess_pages": ("Preprocessing", 18),
    "colorize_auto": ("Colorizing", 40),
    "preserve_ink_lines": ("Preserving Lines", 65),
    "quality_check": ("Quality Check", 85),
    "export_pdf": ("Exporting PDF", 95),
}


class ColorizeRequest(BaseModel):
    inputType: str
    inputPath: str


class OpenPathRequest(BaseModel):
    path: str


class DeletePathRequest(BaseModel):
    path: str


class ImportBookRequest(BaseModel):
    inputPath: str
    title: str


class ReaderPageRequest(BaseModel):
    pageNumber: int


class ReaderRangeRequest(BaseModel):
    startPage: int | None = None
    endPage: int | None = None


app = FastAPI(title="Manga Auto Colorizer Desktop Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LIBRARY_ROOT.mkdir(parents=True, exist_ok=True)
BOOKS_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/media/output", StaticFiles(directory=str(OUTPUT_ROOT)), name="media-output")
app.mount("/media/input/pages_bw", StaticFiles(directory=str(INPUT_PAGES)), name="media-input-pages")
app.mount("/media/library", StaticFiles(directory=str(BOOKS_ROOT)), name="media-library")

pipeline_lock = threading.Lock()
pipeline_job_state: dict[str, Any] = {
    "running": False,
    "status": "idle",
    "current_step": "Waiting",
    "progress": 0,
    "started_at": None,
    "finished_at": None,
    "last_error": "",
}
pipeline_process: subprocess.Popen[str] | None = None

reader_lock = threading.Lock()
reader_job_state: dict[str, Any] = {
    "running": False,
    "status": "idle",
    "book_id": None,
    "current_page": None,
    "current_step": "Waiting",
    "progress": 0,
    "started_at": None,
    "finished_at": None,
    "last_error": "",
    "queue": [],
    "success_count": 0,
    "failure_count": 0,
}
reader_process: subprocess.Popen[str] | None = None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def append_backend_log(message: str) -> None:
    BACKEND_LOG.parent.mkdir(parents=True, exist_ok=True)
    with BACKEND_LOG.open("a", encoding="utf-8") as handle:
        handle.write(message + "\n")


def append_project_log(path: Path, message: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(message + "\n")


def tail_lines(path: Path, limit: int = 200) -> str:
    if not path.exists():
        return ""
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        return "".join(deque(handle, maxlen=limit))


def import_ok(module_name: str) -> bool:
    try:
        importlib.import_module(module_name)
        return True
    except Exception:  # noqa: BLE001
        return False


def is_within_project(path: Path) -> bool:
    try:
        path.resolve().relative_to(PROJECT_ROOT)
        return True
    except Exception:  # noqa: BLE001
        return False


def resolve_project_path(value: str) -> Path:
    candidate = Path(value).expanduser()
    if not candidate.is_absolute():
        candidate = PROJECT_ROOT / candidate
    candidate = candidate.resolve()
    if not is_within_project(candidate):
        raise HTTPException(status_code=400, detail="Path is outside project root")
    return candidate


def library_color_page_target(target: Path) -> tuple[str, int] | None:
    try:
        relative = target.relative_to(BOOKS_ROOT)
    except ValueError:
        return None
    if len(relative.parts) != 3 or relative.parts[1] != "pages_color":
        return None
    try:
        page_number = int(target.stem)
    except ValueError:
        return None
    return relative.parts[0], page_number


def is_allowed_delete_target(target: Path) -> bool:
    if any(target.is_relative_to(root) for root in ALLOWED_DELETE_ROOTS):
        return True
    return library_color_page_target(target) is not None


def clone_pipeline_state() -> dict[str, Any]:
    with pipeline_lock:
        return dict(pipeline_job_state)


def set_pipeline_state(**changes: Any) -> dict[str, Any]:
    with pipeline_lock:
        pipeline_job_state.update(changes)
        return dict(pipeline_job_state)


def clone_reader_state() -> dict[str, Any]:
    with reader_lock:
        state = dict(reader_job_state)
        state["queue"] = list(reader_job_state.get("queue", []))
        return state


def get_manifest_or_404(book_id: str) -> dict[str, Any]:
    try:
        return load_manifest(book_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


def set_reader_state(**changes: Any) -> dict[str, Any]:
    with reader_lock:
        reader_job_state.update(changes)
        if "queue" in changes:
            reader_job_state["queue"] = list(changes["queue"] or [])
        state = dict(reader_job_state)
        state["queue"] = list(reader_job_state.get("queue", []))
        return state


def pretty_pipeline_step(step_name: str) -> tuple[str, int]:
    return STEP_ALIASES.get(step_name, (step_name.replace("_", " ").title(), 10))


def update_pipeline_step_from_line(line: str) -> None:
    if "Starting step:" in line:
        raw = line.split("Starting step:", 1)[1].strip()
        step, progress = pretty_pipeline_step(raw)
        set_pipeline_state(current_step=step, progress=progress, status="running", running=True)
        return
    if "Completed step:" in line:
        raw = line.split("Completed step:", 1)[1].strip()
        step, progress = pretty_pipeline_step(raw)
        set_pipeline_state(current_step=step, progress=min(progress + 8, 95), status="running", running=True)
        return
    if "Pipeline completed successfully" in line:
        set_pipeline_state(current_step="Done", progress=100, status="done", running=False, finished_at=utc_now())
        return
    if "Pipeline failed:" in line or "FAILED code=" in line:
        set_pipeline_state(status="failed", running=False, current_step="Failed", finished_at=utc_now())


def update_reader_state_from_line(line: str) -> None:
    if "[PAGE] start" in line:
        parts = dict(item.split("=", 1) for item in line.split() if "=" in item)
        page = int(parts.get("page", "0") or 0)
        queue = clone_reader_state().get("queue", [])
        total = max(len(queue), 1)
        completed = clone_reader_state().get("success_count", 0) + clone_reader_state().get("failure_count", 0)
        progress = min(95, int((completed / total) * 100))
        set_reader_state(current_page=page, current_step="Colorizing", progress=max(progress, 5), running=True, status="running")
        return
    if "[OK] page=" in line:
        page = int(line.split("page=", 1)[1].strip())
        state = clone_reader_state()
        success_count = int(state.get("success_count", 0)) + 1
        queue = [value for value in state.get("queue", []) if int(value) != page]
        total = success_count + int(state.get("failure_count", 0)) + len(queue)
        progress = 100 if not queue else min(95, int(((success_count + int(state.get("failure_count", 0))) / max(total, 1)) * 100))
        set_reader_state(success_count=success_count, queue=queue, progress=progress, current_page=page)
        return
    if "[ERROR] page=" in line:
        page = int(line.split("page=", 1)[1].split()[0])
        state = clone_reader_state()
        failure_count = int(state.get("failure_count", 0)) + 1
        queue = [value for value in state.get("queue", []) if int(value) != page]
        total = int(state.get("success_count", 0)) + failure_count + len(queue)
        progress = min(95, int(((int(state.get("success_count", 0)) + failure_count) / max(total, 1)) * 100))
        set_reader_state(failure_count=failure_count, queue=queue, progress=progress, current_page=page, last_error=line)
        return


def stream_pipeline_reader(stream, *, target_log: Path, is_error: bool) -> None:
    try:
        for raw_line in iter(stream.readline, ""):
            line = raw_line.rstrip("\r\n")
            if not line:
                continue
            append_backend_log(line)
            append_project_log(target_log, line)
            if not is_error:
                update_pipeline_step_from_line(line)
    finally:
        try:
            stream.close()
        except Exception:  # noqa: BLE001
            pass


def stream_reader_job(stream) -> None:
    try:
        for raw_line in iter(stream.readline, ""):
            line = raw_line.rstrip("\r\n")
            if not line:
                continue
            append_backend_log(line)
            append_project_log(READER_LOG, line)
            update_reader_state_from_line(line)
    finally:
        try:
            stream.close()
        except Exception:  # noqa: BLE001
            pass


def run_pipeline_job(command: list[str]) -> None:
    global pipeline_process
    try:
        set_pipeline_state(
            running=True,
            status="running",
            current_step="Preparing",
            progress=5,
            started_at=utc_now(),
            finished_at=None,
            last_error="",
        )
        append_backend_log(f"START {' '.join(command)}")
        process = subprocess.Popen(
            command,
            cwd=str(PROJECT_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        pipeline_process = process

        stdout_thread = threading.Thread(
            target=stream_pipeline_reader,
            args=(process.stdout,),
            kwargs={"target_log": PIPELINE_LOG, "is_error": False},
            daemon=True,
        )
        stderr_thread = threading.Thread(
            target=stream_pipeline_reader,
            args=(process.stderr,),
            kwargs={"target_log": ERROR_LOG, "is_error": True},
            daemon=True,
        )
        stdout_thread.start()
        stderr_thread.start()

        return_code = process.wait()
        stdout_thread.join(timeout=5)
        stderr_thread.join(timeout=5)

        if return_code != 0:
            message = f"Pipeline failed with exit code {return_code}"
            append_backend_log(f"FAILED code={return_code}")
            append_project_log(ERROR_LOG, message)
            set_pipeline_state(
                running=False,
                status="failed",
                current_step="Failed",
                progress=0,
                finished_at=utc_now(),
                last_error=message,
            )
            return

        append_backend_log("SUCCESS pipeline completed")
        set_pipeline_state(
            running=False,
            status="done",
            current_step="Done",
            progress=100,
            finished_at=utc_now(),
            last_error="",
        )
    except Exception as exc:  # noqa: BLE001
        message = f"Pipeline failed: {exc}"
        append_backend_log(message)
        append_project_log(ERROR_LOG, message)
        set_pipeline_state(
            running=False,
            status="failed",
            current_step="Failed",
            progress=0,
            finished_at=utc_now(),
            last_error=str(exc),
        )
    finally:
        pipeline_process = None


def run_reader_job(command: list[str], *, book_id: str, queued_pages: list[int]) -> None:
    global reader_process
    try:
        set_reader_state(
            running=True,
            status="running",
            book_id=book_id,
            current_page=queued_pages[0] if queued_pages else None,
            current_step="Preparing",
            progress=5,
            started_at=utc_now(),
            finished_at=None,
            last_error="",
            queue=queued_pages,
            success_count=0,
            failure_count=0,
        )
        append_backend_log(f"READER_START {' '.join(command)}")
        process = subprocess.Popen(
            command,
            cwd=str(PROJECT_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        reader_process = process

        stdout_thread = threading.Thread(target=stream_reader_job, args=(process.stdout,), daemon=True)
        stdout_thread.start()
        return_code = process.wait()
        stdout_thread.join(timeout=5)

        if return_code != 0:
            state = clone_reader_state()
            message = state.get("last_error") or f"Reader colorize failed with exit code {return_code}"
            set_reader_state(
                running=False,
                status="failed",
                current_step="Failed",
                progress=0,
                finished_at=utc_now(),
                last_error=message,
            )
            return

        set_reader_state(
            running=False,
            status="done",
            current_step="Done",
            progress=100,
            finished_at=utc_now(),
            last_error="",
            queue=[],
        )
    except Exception as exc:  # noqa: BLE001
        append_backend_log(f"Reader job failed: {exc}")
        append_project_log(READER_LOG, f"Reader job failed: {exc}")
        set_reader_state(
            running=False,
            status="failed",
            current_step="Failed",
            progress=0,
            finished_at=utc_now(),
            last_error=str(exc),
        )
    finally:
        reader_process = None


def run_command(command: list[str], *, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    append_backend_log(f"RUN {' '.join(command)}")
    return subprocess.run(
        command,
        cwd=str(cwd or PROJECT_ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def ensure_command_ok(result: subprocess.CompletedProcess[str], action: str) -> None:
    if result.stdout:
        append_backend_log(result.stdout.rstrip())
    if result.stderr:
        append_backend_log(result.stderr.rstrip())
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"{action} failed with exit code {result.returncode}")


def list_images() -> list[dict[str, str]]:
    images: list[dict[str, str]] = []
    if OUTPUT_FIXED.exists():
        for image_path in sorted(OUTPUT_FIXED.glob("*.png")):
            images.append(
                {
                    "name": image_path.name,
                    "path": str(image_path),
                    "source": "output",
                    "previewUrl": f"{APP_BASE_URL}/media/output/colorized_fixed/{image_path.name}",
                }
            )
    return images


def list_input_images() -> list[dict[str, str]]:
    images: list[dict[str, str]] = []
    if INPUT_PAGES.exists():
        for image_path in sorted(
            (
                path
                for path in INPUT_PAGES.iterdir()
                if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
            ),
            key=lambda item: item.name.lower(),
        ):
            images.append(
                {
                    "name": image_path.name,
                    "path": str(image_path),
                    "source": "input",
                    "previewUrl": f"{APP_BASE_URL}/media/input/pages_bw/{image_path.name}",
                }
            )
    return images


def list_pdfs() -> list[dict[str, str]]:
    pdfs: list[dict[str, str]] = []
    if OUTPUT_FINAL_PDF.exists():
        for pdf_path in sorted(OUTPUT_FINAL_PDF.glob("*.pdf")):
            pdfs.append({"name": pdf_path.name, "path": str(pdf_path)})
    return pdfs


def normalize_page_size(page_size: int | None) -> int:
    value = int(page_size or GALLERY_DEFAULT_PAGE_SIZE)
    if value < 1:
        return GALLERY_DEFAULT_PAGE_SIZE
    return min(value, GALLERY_MAX_PAGE_SIZE)


def normalize_page_number(page: int | None) -> int:
    value = int(page or 1)
    return value if value > 0 else 1


def paginate_items(items: list[dict[str, Any]], page: int | None, page_size: int | None) -> dict[str, Any]:
    normalized_page = normalize_page_number(page)
    normalized_page_size = normalize_page_size(page_size)
    total = len(items)
    total_pages = max((total + normalized_page_size - 1) // normalized_page_size, 1)
    current_page = min(normalized_page, total_pages)
    start = (current_page - 1) * normalized_page_size
    end = start + normalized_page_size
    return {
        "items": items[start:end],
        "page": current_page,
        "page_size": normalized_page_size,
        "total": total,
        "total_pages": total_pages,
        "has_prev": current_page > 1,
        "has_next": current_page < total_pages,
    }


def ensure_thumbnail(source_path: Path, thumb_path: Path, *, width: int = 320) -> Path | None:
    try:
        if thumb_path.exists() and thumb_path.stat().st_mtime >= source_path.stat().st_mtime:
            return thumb_path
        thumb_path.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source_path) as image:
            rgb_image = image.convert("RGB")
            if rgb_image.width > width:
                height = max(1, int(rgb_image.height * (width / rgb_image.width)))
                rgb_image = rgb_image.resize((width, height))
            rgb_image.save(thumb_path, format="JPEG", quality=85, optimize=True)
        return thumb_path
    except Exception:  # noqa: BLE001
        return None


def build_pipeline_gallery_item(image_path: Path) -> dict[str, Any]:
    thumb_path = ensure_thumbnail(image_path, PIPELINE_THUMBS / f"{image_path.stem}.jpg")
    return {
        "id": f"pipeline-{image_path.name}",
        "book_id": None,
        "book_title": None,
        "page_number": None,
        "filename": image_path.name,
        "image_url": f"{APP_BASE_URL}/media/output/colorized_fixed/{image_path.name}",
        "thumb_url": f"{APP_BASE_URL}/media/output/thumbs_gallery/{thumb_path.name}" if thumb_path and thumb_path.exists() else f"{APP_BASE_URL}/media/output/colorized_fixed/{image_path.name}",
        "source": "pipeline",
        "is_colorized": True,
        "file_path": str(image_path),
        "folder_path": str(image_path.parent),
        "caption": image_path.name,
    }


def versioned_url(url: str, file_path: Path | None) -> str:
    if file_path and file_path.exists():
        return f"{url}?v={file_path.stat().st_mtime_ns}"
    return url


def library_media_url(book_id: str, folder: str, filename: str, file_path: Path | None = None) -> str:
    return versioned_url(f"{APP_BASE_URL}/media/library/{book_id}/{folder}/{filename}", file_path)


def build_library_gallery_item(book_id: str, manifest: dict[str, Any], page_number: int) -> dict[str, Any] | None:
    image_path = manifest_page_path(book_id, page_number, color=True)
    if not image_path.exists():
        return None
    thumb_path = ensure_thumbnail(image_path, book_root(book_id) / "thumbnails" / "color" / f"{image_path.stem}.jpg")
    return {
        "id": f"library-{book_id}-{page_number:03d}",
        "book_id": book_id,
        "book_title": manifest.get("title", book_id),
        "page_number": page_number,
        "filename": image_path.name,
        "image_url": library_media_url(book_id, "pages_color", image_path.name, image_path),
        "thumb_url": library_media_url(book_id, "thumbnails/color", thumb_path.name, thumb_path) if thumb_path and thumb_path.exists() else library_media_url(book_id, "pages_color", image_path.name, image_path),
        "source": "library",
        "is_colorized": True,
        "file_path": str(image_path),
        "folder_path": str(image_path.parent),
        "caption": f"{manifest.get('title', book_id)} · 第 {page_number} 页",
    }


def list_library_books() -> list[dict[str, Any]]:
    books = []
    for book in load_library_index().get("books", []):
        item = dict(book)
        book_id = str(item.get("book_id", ""))
        thumbnail_path = book_root(book_id) / "thumbnails" / "001.png"
        if thumbnail_path.exists():
            item["cover_url"] = library_media_url(book_id, "thumbnails", thumbnail_path.name, thumbnail_path)
        cover_url = item.get("cover_url")
        if cover_url and str(cover_url).startswith("/"):
            item["cover_url"] = f"{APP_BASE_URL}{cover_url}"
        books.append(item)
    return books


def list_library_outputs() -> list[dict[str, Any]]:
    outputs: list[dict[str, Any]] = []
    for book in list_library_books():
        book_id = str(book["book_id"])
        try:
            manifest = load_manifest(book_id)
        except FileNotFoundError:
            continue
        total_pages = int(manifest.get("total_pages", 0))
        for page_number in range(1, total_pages + 1):
            item = build_library_gallery_item(book_id, manifest, page_number)
            if item:
                outputs.append(
                    {
                        "bookId": item["book_id"],
                        "bookTitle": item["book_title"],
                        "pageNumber": item["page_number"],
                        "name": item["filename"],
                        "path": item["file_path"],
                        "previewUrl": item["image_url"],
                        "thumbUrl": item["thumb_url"],
                    }
                )
    return outputs


def get_library_gallery_source(book_id: str | None, *, only_colorized: bool = True) -> tuple[str | None, list[dict[str, Any]]]:
    books = list_library_books()
    if not books:
        return None, []

    selected_book_id = book_id or str(books[0]["book_id"])
    try:
        manifest = load_manifest(selected_book_id)
    except FileNotFoundError:
        return None, []

    total_pages = int(manifest.get("total_pages", 0))
    items: list[dict[str, Any]] = []
    for page_number in range(1, total_pages + 1):
        item = build_library_gallery_item(selected_book_id, manifest, page_number)
        if item:
            items.append(item)
        elif not only_colorized:
            bw_path = manifest_page_path(selected_book_id, page_number, color=False)
            if bw_path.exists():
                thumb_path = ensure_thumbnail(bw_path, book_root(selected_book_id) / "thumbnails" / "bw" / f"{bw_path.stem}.jpg")
                items.append(
                    {
                        "id": f"library-bw-{selected_book_id}-{page_number:03d}",
                        "book_id": selected_book_id,
                        "book_title": manifest.get("title", selected_book_id),
                        "page_number": page_number,
                        "filename": bw_path.name,
                        "image_url": library_media_url(selected_book_id, "pages_bw", bw_path.name, bw_path),
                        "thumb_url": library_media_url(selected_book_id, "thumbnails/bw", thumb_path.name, thumb_path) if thumb_path and thumb_path.exists() else library_media_url(selected_book_id, "pages_bw", bw_path.name, bw_path),
                        "source": "library",
                        "is_colorized": False,
                        "file_path": str(bw_path),
                        "folder_path": str(bw_path.parent),
                        "caption": f"{manifest.get('title', selected_book_id)} · 第 {page_number} 页",
                    }
                )
    return selected_book_id, items


def get_recent_book() -> dict[str, Any] | None:
    books = list_library_books()
    return books[0] if books else None


@app.get("/api/health")
def api_health() -> dict[str, object]:
    return {"status": "ok", "backendUrl": APP_BASE_URL}


@app.get("/api/env")
def api_env() -> dict[str, object]:
    current_python = Path(sys.executable).resolve()
    env_info = {
        "pythonPath": str(current_python),
        "pythonPathOk": current_python == PYTHON_EXE,
        "condaEnvPath": str(PYTHON_EXE.parent),
        "torchImport": import_ok("torch"),
        "cudaAvailable": False,
        "repoExists": REPO_DIR.exists(),
        "inferenceExists": INFERENCE_SCRIPT.exists(),
        "weightsDirExists": GENERATOR_WEIGHT.parent.exists() and DENOISER_WEIGHT.parent.exists(),
        "weightsReady": GENERATOR_WEIGHT.exists() and DENOISER_WEIGHT.exists(),
        "pipelineExists": PIPELINE_SCRIPT.exists(),
        "libraryManagerExists": LIBRARY_MANAGER_SCRIPT.exists(),
        "projectRoot": str(PROJECT_ROOT),
        "libraryRoot": str(LIBRARY_ROOT),
    }
    if env_info["torchImport"]:
        import torch  # type: ignore

        env_info["cudaAvailable"] = bool(torch.cuda.is_available())
    return env_info


@app.get("/api/project-status")
def api_project_status() -> dict[str, object]:
    recent_book = get_recent_book()
    return {
        "projectRoot": str(PROJECT_ROOT),
        "inputPagesDir": str(INPUT_PAGES),
        "inputPdfDir": str(INPUT_PDF),
        "outputDir": str(OUTPUT_ROOT),
        "outputColorizedDir": str(OUTPUT_FIXED),
        "outputFinalPdfDir": str(OUTPUT_FINAL_PDF),
        "logsDir": str(PROJECT_ROOT / "logs"),
        "libraryDir": str(LIBRARY_ROOT),
        "libraryBooksDir": str(BOOKS_ROOT),
        "inputPdfDefault": "input/pdf/chapter01.pdf",
        "needsReviewCount": len(list(OUTPUT_NEEDS_REVIEW.glob("*"))) if OUTPUT_NEEDS_REVIEW.exists() else 0,
        "recentOutputCount": len(list(OUTPUT_FIXED.glob("*.png"))) if OUTPUT_FIXED.exists() else 0,
        "libraryBookCount": len(list_library_books()),
        "recentBook": recent_book,
    }


@app.get("/api/logs")
def api_logs() -> dict[str, str]:
    return {
        "pipelineLog": tail_lines(PIPELINE_LOG),
        "errorLog": tail_lines(ERROR_LOG),
        "backendLog": tail_lines(BACKEND_LOG),
        "readerLog": tail_lines(READER_LOG),
    }


@app.get("/api/results")
def api_results() -> dict[str, object]:
    return {
        "inputImages": list_input_images(),
        "images": list_images(),
        "pdfs": list_pdfs(),
        "inputImageCount": len(list_input_images()),
        "needsReviewCount": len(list(OUTPUT_NEEDS_REVIEW.glob("*"))) if OUTPUT_NEEDS_REVIEW.exists() else 0,
        "libraryOutputs": list_library_outputs(),
    }


@app.get("/api/gallery/pipeline")
def api_gallery_pipeline(page: int = 1, page_size: int = GALLERY_DEFAULT_PAGE_SIZE) -> dict[str, object]:
    items = [build_pipeline_gallery_item(image_path) for image_path in sorted(OUTPUT_FIXED.glob("*.png"))] if OUTPUT_FIXED.exists() else []
    return paginate_items(items, page, page_size)


@app.get("/api/gallery/library")
def api_gallery_library(
    page: int = 1,
    page_size: int = GALLERY_DEFAULT_PAGE_SIZE,
    book_id: str | None = None,
    only_colorized: bool = True,
) -> dict[str, object]:
    selected_book_id, items = get_library_gallery_source(book_id, only_colorized=only_colorized)
    payload = paginate_items(items, page, page_size)
    payload["selected_book_id"] = selected_book_id
    return payload


@app.get("/api/gallery/book/{book_id}")
def api_gallery_book(
    book_id: str,
    page: int = 1,
    page_size: int = GALLERY_DEFAULT_PAGE_SIZE,
    only_colorized: bool = True,
) -> dict[str, object]:
    selected_book_id, items = get_library_gallery_source(book_id, only_colorized=only_colorized)
    payload = paginate_items(items, page, page_size)
    payload["selected_book_id"] = selected_book_id
    return payload


@app.get("/api/job-status")
def api_job_status() -> dict[str, object]:
    state = clone_pipeline_state()
    state["backendUrl"] = APP_BASE_URL
    state["readerJob"] = clone_reader_state()
    return state


@app.get("/api/library/job-status")
def api_library_job_status() -> dict[str, object]:
    return clone_reader_state()


@app.post("/api/delete-file")
def api_delete_file(payload: DeletePathRequest) -> dict[str, object]:
    target = resolve_project_path(payload.path)
    if target.is_dir():
        raise HTTPException(status_code=400, detail="Only files can be deleted")
    library_target = library_color_page_target(target)
    if not is_allowed_delete_target(target):
        raise HTTPException(status_code=400, detail="File deletion is only allowed for gallery images")
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")
    library_manifest = load_manifest(library_target[0]) if library_target else None
    target.unlink()
    if library_target and library_manifest:
        _book_id, page_number = library_target
        library_manifest["colorized_pages"] = [int(value) for value in library_manifest.get("colorized_pages", []) if int(value) != page_number]
        save_manifest(library_manifest)
        upsert_index_entry(library_manifest)
    append_project_log(PIPELINE_LOG, f"[DELETE] {target}")
    return {"status": "ok", "deleted": str(target)}


@app.post("/api/colorize")
def api_colorize(payload: ColorizeRequest) -> dict[str, object]:
    state = clone_pipeline_state()
    if state.get("running"):
        raise HTTPException(status_code=409, detail="已有自动上色任务正在运行")
    if payload.inputType not in {"pages", "pdf"}:
        raise HTTPException(status_code=400, detail="inputType must be pages or pdf")
    input_path = resolve_project_path(payload.inputPath)
    if not PIPELINE_SCRIPT.exists():
        raise HTTPException(status_code=500, detail="scripts/pipeline.py not found")
    if not input_path.exists():
        raise HTTPException(status_code=400, detail=f"Input path not found: {input_path}")
    command = [str(PYTHON_EXE), str(PIPELINE_SCRIPT), "--input", str(input_path)]
    worker = threading.Thread(target=run_pipeline_job, args=(command,), daemon=True)
    worker.start()
    return {"started": True, "message": "Colorization job started", "status": "running"}


@app.post("/api/clean-outputs")
def api_clean_outputs() -> dict[str, object]:
    if not CLEAN_SCRIPT.exists():
        raise HTTPException(status_code=500, detail="scripts/clean_outputs.py not found")
    result = run_command([str(PYTHON_EXE), str(CLEAN_SCRIPT), "--yes"])
    ensure_command_ok(result, "Clean outputs")
    return {"ok": True}


@app.post("/api/open-folder")
def api_open_folder(payload: OpenPathRequest) -> dict[str, object]:
    target_path = resolve_project_path(payload.path)
    if not target_path.exists() or not target_path.is_dir():
        raise HTTPException(status_code=400, detail="Target folder does not exist or is not a directory")
    process = subprocess.Popen(["explorer.exe", str(target_path)], cwd=str(PROJECT_ROOT))
    append_backend_log(f"OPEN_FOLDER {target_path} pid={process.pid}")
    return {"ok": True, "path": str(target_path)}


@app.get("/api/library/books")
def api_library_books() -> dict[str, object]:
    return {"books": list_library_books(), "count": len(list_library_books())}


@app.post("/api/library/import-folder")
def api_library_import_folder(payload: ImportBookRequest) -> dict[str, object]:
    input_path = Path(payload.inputPath).expanduser().resolve()
    if not input_path.exists() or not input_path.is_dir():
        raise HTTPException(status_code=400, detail=f"Input folder not found: {input_path}")
    result = run_command(
        [str(PYTHON_EXE), str(LIBRARY_MANAGER_SCRIPT), "import-folder", "--input", str(input_path), "--title", payload.title]
    )
    ensure_command_ok(result, "Import folder")
    return {"ok": True, "books": list_library_books()}


@app.post("/api/library/import-pdf")
def api_library_import_pdf(payload: ImportBookRequest) -> dict[str, object]:
    input_path = Path(payload.inputPath).expanduser().resolve()
    if not input_path.exists() or input_path.suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail=f"PDF not found: {input_path}")
    result = run_command(
        [str(PYTHON_EXE), str(LIBRARY_MANAGER_SCRIPT), "import-pdf", "--input", str(input_path), "--title", payload.title]
    )
    ensure_command_ok(result, "Import PDF")
    return {"ok": True, "books": list_library_books()}


@app.post("/api/library/import-cbz")
def api_library_import_cbz(payload: ImportBookRequest) -> dict[str, object]:
    input_path = Path(payload.inputPath).expanduser().resolve()
    if not input_path.exists() or input_path.suffix.lower() != ".cbz":
        raise HTTPException(status_code=400, detail=f"CBZ not found: {input_path}")
    result = run_command(
        [str(PYTHON_EXE), str(LIBRARY_MANAGER_SCRIPT), "import-cbz", "--input", str(input_path), "--title", payload.title]
    )
    ensure_command_ok(result, "Import CBZ")
    return {"ok": True, "books": list_library_books()}


@app.get("/api/library/book/{book_id}")
def api_library_book(book_id: str) -> dict[str, object]:
    manifest = get_manifest_or_404(book_id)
    cover_path = book_root(book_id) / "thumbnails" / "001.png"
    manifest["cover_url"] = (
        library_media_url(book_id, "thumbnails", "001.png", cover_path)
        if cover_path.exists()
        else None
    )
    return manifest


@app.get("/api/library/book/{book_id}/page/{page_number}")
def api_library_page(book_id: str, page_number: int) -> dict[str, object]:
    manifest = get_manifest_or_404(book_id)
    total_pages = int(manifest.get("total_pages", 0))
    if page_number < 1 or page_number > total_pages:
        raise HTTPException(status_code=404, detail=f"Page {page_number} not found in {book_id}")
    bw_path = manifest_page_path(book_id, page_number, color=False)
    color_path = manifest_page_path(book_id, page_number, color=True)
    return {
        "book_id": book_id,
        "page_number": page_number,
        "total_pages": total_pages,
        "bw_image_url": library_media_url(book_id, "pages_bw", bw_path.name, bw_path),
        "color_image_url": library_media_url(book_id, "pages_color", color_path.name, color_path) if color_path.exists() else None,
        "is_colorized": color_path.exists(),
    }


@app.post("/api/library/book/{book_id}/colorize-page")
def api_library_colorize_page(book_id: str, payload: ReaderPageRequest) -> dict[str, object]:
    state = clone_reader_state()
    if state.get("running"):
        raise HTTPException(status_code=409, detail="已有阅读器上色任务正在运行")
    manifest = get_manifest_or_404(book_id)
    total_pages = int(manifest.get("total_pages", 0))
    if payload.pageNumber < 1 or payload.pageNumber > total_pages:
        raise HTTPException(status_code=400, detail=f"Invalid page number: {payload.pageNumber}")
    command = [str(PYTHON_EXE), str(COLORIZE_BOOK_PAGE_SCRIPT), "--book-id", book_id, "--page", str(payload.pageNumber)]
    worker = threading.Thread(target=run_reader_job, args=(command,), kwargs={"book_id": book_id, "queued_pages": [payload.pageNumber]}, daemon=True)
    worker.start()
    return {"started": True, "book_id": book_id, "page": payload.pageNumber}


@app.post("/api/library/book/{book_id}/colorize-range")
def api_library_colorize_range(book_id: str, payload: ReaderRangeRequest) -> dict[str, object]:
    state = clone_reader_state()
    if state.get("running"):
        raise HTTPException(status_code=409, detail="已有阅读器上色任务正在运行")
    manifest = get_manifest_or_404(book_id)
    total_pages = int(manifest.get("total_pages", 0))
    start_page = payload.startPage or 1
    end_page = payload.endPage or total_pages
    if start_page < 1 or end_page < start_page or end_page > total_pages:
        raise HTTPException(status_code=400, detail=f"Invalid page range: {start_page}..{end_page}")
    queued_pages = list(range(start_page, end_page + 1))
    command = [str(PYTHON_EXE), str(COLORIZE_BOOK_BATCH_SCRIPT), "--book-id", book_id]
    if payload.startPage is not None:
        command.extend(["--start-page", str(payload.startPage)])
    if payload.endPage is not None:
        command.extend(["--end-page", str(payload.endPage)])
    worker = threading.Thread(target=run_reader_job, args=(command,), kwargs={"book_id": book_id, "queued_pages": queued_pages}, daemon=True)
    worker.start()
    return {"started": True, "book_id": book_id, "start_page": start_page, "end_page": end_page}


@app.post("/api/library/book/{book_id}/set-current-page")
def api_library_set_current_page(book_id: str, payload: ReaderPageRequest) -> dict[str, object]:
    manifest = update_current_page(book_id, payload.pageNumber)
    return {"ok": True, "current_page": manifest["current_page"]}


@app.post("/api/library/book/{book_id}/export-pdf")
def api_library_export_pdf(book_id: str) -> dict[str, object]:
    manifest = get_manifest_or_404(book_id)
    total_pages = int(manifest.get("total_pages", 0))
    result = run_command([str(PYTHON_EXE), str(EXPORT_BOOK_PDF_SCRIPT), "--book-id", book_id])
    ensure_command_ok(result, "Export reader PDF")
    export_path = book_root(book_id) / "export" / "colorized_book.pdf"
    color_pages = 0
    bw_fallback_pages = 0
    for page_number in range(1, total_pages + 1):
        if manifest_page_path(book_id, page_number, color=True).exists():
            color_pages += 1
        elif manifest_page_path(book_id, page_number, color=False).exists():
            bw_fallback_pages += 1
    cache_buster = int(export_path.stat().st_mtime) if export_path.exists() else 0
    return {
        "ok": True,
        "path": str(export_path),
        "previewUrl": f"{APP_BASE_URL}/media/library/{book_id}/export/colorized_book.pdf?v={cache_buster}",
        "totalPages": total_pages,
        "colorPages": color_pages,
        "bwFallbackPages": bw_fallback_pages,
        "cacheBuster": cache_buster,
    }


@app.post("/api/library/book/{book_id}/delete")
def api_library_delete(book_id: str) -> dict[str, object]:
    root = book_root(book_id)
    if not root.exists():
        raise HTTPException(status_code=404, detail=f"Book not found: {book_id}")
    remove_tree_one_by_one(root)
    remove_index_entry(book_id)
    return {"ok": True, "deleted": book_id}


@app.post("/api/library/clear-cache")
def api_library_clear_cache() -> dict[str, object]:
    cleared_books = 0
    for book in list_library_books():
        book_id = str(book["book_id"])
        try:
            manifest = load_manifest(book_id)
        except FileNotFoundError:
            continue
        color_dir = book_root(book_id) / "pages_color"
        export_dir = book_root(book_id) / "export"
        for file_path in sorted(color_dir.glob("*")):
            if file_path.is_file():
                file_path.unlink()
        for file_path in sorted(export_dir.glob("*")):
            if file_path.is_file():
                file_path.unlink()
        manifest["colorized_pages"] = []
        save_manifest(manifest)
        cleared_books += 1
    return {"ok": True, "clearedBooks": cleared_books}


if __name__ == "__main__":
    uvicorn.run(app, host=APP_HOST, port=APP_PORT)
