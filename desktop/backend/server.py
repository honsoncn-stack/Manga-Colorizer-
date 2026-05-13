from __future__ import annotations

import importlib
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
from pydantic import BaseModel
from starlette.staticfiles import StaticFiles


PROJECT_ROOT = Path(r"D:\AIProjects\manga-auto-colorizer").resolve()
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
PIPELINE_SCRIPT = PROJECT_ROOT / "scripts" / "pipeline.py"
CLEAN_SCRIPT = PROJECT_ROOT / "scripts" / "clean_outputs.py"
REPO_DIR = PROJECT_ROOT / "external" / "manga-colorization-v2"
INFERENCE_SCRIPT = REPO_DIR / "inference.py"
GENERATOR_WEIGHT = REPO_DIR / "networks" / "generator.zip"
DENOISER_WEIGHT = REPO_DIR / "denoising" / "models" / "net_rgb.pth"

PIPELINE_LOG = PROJECT_ROOT / "logs" / "pipeline.log"
ERROR_LOG = PROJECT_ROOT / "logs" / "error.log"

STEPS = [
    ("Waiting", 0),
    ("Preparing", 5),
    ("Preprocessing", 18),
    ("Colorizing", 40),
    ("Preserving Lines", 65),
    ("Quality Check", 85),
    ("Exporting PDF", 95),
    ("Done", 100),
]
STEP_PROGRESS = {name: progress for name, progress in STEPS}

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


app = FastAPI(title="Manga Auto Colorizer Desktop Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/media/output", StaticFiles(directory=str(OUTPUT_ROOT)), name="media-output")
app.mount("/media/input/pages_bw", StaticFiles(directory=str(INPUT_PAGES)), name="media-input-pages")

job_lock = threading.Lock()
job_state: dict[str, Any] = {
    "running": False,
    "status": "idle",
    "current_step": "Waiting",
    "progress": 0,
    "started_at": None,
    "finished_at": None,
    "last_error": "",
}
job_process: subprocess.Popen[str] | None = None


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


def clone_job_state() -> dict[str, Any]:
    with job_lock:
        return dict(job_state)


def set_job_state(**changes: Any) -> dict[str, Any]:
    with job_lock:
        job_state.update(changes)
        return dict(job_state)


def pretty_step(step_name: str) -> tuple[str, int]:
    return STEP_ALIASES.get(step_name, (step_name.replace("_", " ").title(), 10))


def update_step_from_line(line: str) -> None:
    if "Starting step:" in line:
        raw = line.split("Starting step:", 1)[1].strip()
        step, progress = pretty_step(raw)
        set_job_state(current_step=step, progress=progress, status="running", running=True)
        return
    if "Completed step:" in line:
        raw = line.split("Completed step:", 1)[1].strip()
        step, progress = pretty_step(raw)
        set_job_state(current_step=step, progress=min(progress + 8, 95), running=True, status="running")
        return
    if "Pipeline completed successfully" in line:
        set_job_state(current_step="Done", progress=100, status="done", running=False, finished_at=utc_now())
        return
    if "Pipeline failed:" in line or "FAILED code=" in line:
        set_job_state(status="failed", running=False, current_step="Failed", finished_at=utc_now())


def stream_reader(stream, *, target_log: Path, is_error: bool) -> None:
    try:
        for raw_line in iter(stream.readline, ""):
            line = raw_line.rstrip("\r\n")
            if not line:
                continue
            append_backend_log(line)
            append_project_log(target_log, line)
            if not is_error:
                update_step_from_line(line)
    finally:
        try:
            stream.close()
        except Exception:  # noqa: BLE001
            pass


def run_pipeline_job(command: list[str]) -> None:
    global job_process

    try:
        set_job_state(
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
        job_process = process

        stdout_thread = threading.Thread(
            target=stream_reader,
            args=(process.stdout,),
            kwargs={"target_log": PIPELINE_LOG, "is_error": False},
            daemon=True,
        )
        stderr_thread = threading.Thread(
            target=stream_reader,
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
            set_job_state(
                running=False,
                status="failed",
                current_step="Failed",
                progress=0,
                finished_at=utc_now(),
                last_error=message,
            )
            return

        append_backend_log("SUCCESS pipeline completed")
        set_job_state(
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
        set_job_state(
            running=False,
            status="failed",
            current_step="Failed",
            progress=0,
            finished_at=utc_now(),
            last_error=str(exc),
        )
    finally:
        job_process = None


def list_images() -> list[dict[str, str]]:
    images: list[dict[str, str]] = []
    if OUTPUT_FIXED.exists():
        for image_path in sorted(OUTPUT_FIXED.glob("*.png")):
            images.append(
                {
                    "name": image_path.name,
                    "path": str(image_path),
                    "previewUrl": f"{APP_BASE_URL}/media/output/colorized_fixed/{image_path.name}",
                }
            )
    return images


def list_input_images() -> list[dict[str, str]]:
    images: list[dict[str, str]] = []
    if INPUT_PAGES.exists():
        for image_path in sorted(
            p
            for p in INPUT_PAGES.iterdir()
            if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
        ):
            images.append(
                {
                    "name": image_path.name,
                    "path": str(image_path),
                    "previewUrl": f"{APP_BASE_URL}/media/input/pages_bw/{image_path.name}",
                }
            )
    return images


def list_pdfs() -> list[dict[str, str]]:
    pdfs: list[dict[str, str]] = []
    if OUTPUT_FINAL_PDF.exists():
        for pdf_path in sorted(OUTPUT_FINAL_PDF.glob("*.pdf")):
            pdfs.append(
                {
                    "name": pdf_path.name,
                    "path": str(pdf_path),
                }
            )
    return pdfs


@app.get("/api/health")
def api_health() -> dict[str, object]:
    return {"status": "ok", "backendUrl": APP_BASE_URL}


@app.get("/api/env")
def api_env() -> dict[str, object]:
    current_python = Path(sys.executable).resolve()
    python_path_ok = current_python == PYTHON_EXE
    env_info = {
        "pythonPath": str(current_python),
        "pythonPathOk": python_path_ok,
        "condaEnvPath": str(PYTHON_EXE.parent),
        "torchImport": import_ok("torch"),
        "cudaAvailable": False,
        "repoExists": REPO_DIR.exists(),
        "inferenceExists": INFERENCE_SCRIPT.exists(),
        "weightsDirExists": GENERATOR_WEIGHT.parent.exists() and DENOISER_WEIGHT.parent.exists(),
        "weightsReady": GENERATOR_WEIGHT.exists() and DENOISER_WEIGHT.exists(),
        "pipelineExists": PIPELINE_SCRIPT.exists(),
        "projectRoot": str(PROJECT_ROOT),
    }

    if env_info["torchImport"]:
        import torch  # type: ignore

        env_info["cudaAvailable"] = bool(torch.cuda.is_available())

    return env_info


@app.get("/api/project-status")
def api_project_status() -> dict[str, object]:
    return {
        "projectRoot": str(PROJECT_ROOT),
        "inputPagesDir": str(INPUT_PAGES),
        "inputPdfDir": str(INPUT_PDF),
        "outputDir": str(OUTPUT_ROOT),
        "outputColorizedDir": str(OUTPUT_FIXED),
        "outputFinalPdfDir": str(OUTPUT_FINAL_PDF),
        "logsDir": str(PROJECT_ROOT / "logs"),
        "inputPdfDefault": "input/pdf/chapter01.pdf",
        "needsReviewCount": len(list(OUTPUT_NEEDS_REVIEW.glob("*"))) if OUTPUT_NEEDS_REVIEW.exists() else 0,
        "recentOutputCount": len(list(OUTPUT_FIXED.glob("*.png"))) if OUTPUT_FIXED.exists() else 0,
    }


@app.get("/api/logs")
def api_logs() -> dict[str, str]:
    return {
        "pipelineLog": tail_lines(PIPELINE_LOG),
        "errorLog": tail_lines(ERROR_LOG),
        "backendLog": tail_lines(BACKEND_LOG),
    }


@app.get("/api/results")
def api_results() -> dict[str, object]:
    return {
        "inputImages": list_input_images(),
        "images": list_images(),
        "pdfs": list_pdfs(),
        "inputImageCount": len(list_input_images()),
        "needsReviewCount": len(list(OUTPUT_NEEDS_REVIEW.glob("*"))) if OUTPUT_NEEDS_REVIEW.exists() else 0,
    }


@app.get("/api/job-status")
def api_job_status() -> dict[str, object]:
    state = clone_job_state()
    state["backendUrl"] = APP_BASE_URL
    return state


@app.post("/api/colorize")
def api_colorize(payload: ColorizeRequest) -> dict[str, object]:
    state = clone_job_state()
    if state.get("running"):
        raise HTTPException(status_code=409, detail="已有任务正在运行")

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

    process = subprocess.Popen(
        [str(PYTHON_EXE), str(CLEAN_SCRIPT), "--yes"],
        cwd=str(PROJECT_ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    stdout, stderr = process.communicate()
    if stdout:
        append_backend_log(stdout.rstrip())
    if stderr:
        append_backend_log(stderr.rstrip())
    if process.returncode != 0:
        raise HTTPException(status_code=500, detail=f"Clean outputs failed with exit code {process.returncode}")
    return {"ok": True}


@app.post("/api/open-folder")
def api_open_folder(payload: OpenPathRequest) -> dict[str, object]:
    target_path = resolve_project_path(payload.path)
    if not target_path.exists() or not target_path.is_dir():
        raise HTTPException(status_code=400, detail="Target folder does not exist or is not a directory")

    process = subprocess.Popen(["explorer.exe", str(target_path)], cwd=str(PROJECT_ROOT))
    append_backend_log(f"OPEN_FOLDER {target_path} pid={process.pid}")
    return {"ok": True, "path": str(target_path)}


if __name__ == "__main__":
    uvicorn.run(app, host=APP_HOST, port=APP_PORT)
