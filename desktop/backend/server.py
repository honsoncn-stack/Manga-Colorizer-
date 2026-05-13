from __future__ import annotations

import importlib
import os
import subprocess
import sys
from collections import deque
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.staticfiles import StaticFiles


PROJECT_ROOT = Path(r"D:\AIProjects\manga-auto-colorizer")
PYTHON_EXE = Path(r"D:\CondaEnvs\manga-color-v2\python.exe")
APP_HOST = "127.0.0.1"
APP_PORT = 8765
BACKEND_ROOT = PROJECT_ROOT / "desktop" / "backend"
BACKEND_LOG = BACKEND_ROOT / "logs" / "backend.log"

INPUT_PAGES = PROJECT_ROOT / "input" / "pages_bw"
INPUT_PDF = PROJECT_ROOT / "input" / "pdf"
OUTPUT_FIXED = PROJECT_ROOT / "output" / "colorized_fixed"
OUTPUT_FINAL_PDF = PROJECT_ROOT / "output" / "final_pdf"
OUTPUT_NEEDS_REVIEW = PROJECT_ROOT / "output" / "needs_review"
PIPELINE_SCRIPT = PROJECT_ROOT / "scripts" / "pipeline.py"
CLEAN_SCRIPT = PROJECT_ROOT / "scripts" / "clean_outputs.py"
REPO_DIR = PROJECT_ROOT / "external" / "manga-colorization-v2"
INFERENCE_SCRIPT = REPO_DIR / "inference.py"
GENERATOR_WEIGHT = REPO_DIR / "networks" / "generator.zip"
DENOISER_WEIGHT = REPO_DIR / "denoising" / "models" / "net_rgb.pth"


class ColorizeRequest(BaseModel):
    inputType: str
    inputPath: str


class OpenFolderRequest(BaseModel):
    target: str


app = FastAPI(title="Manga Auto Colorizer Desktop Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static-output", StaticFiles(directory=str(PROJECT_ROOT / "output")), name="static-output")


def append_backend_log(message: str) -> None:
    BACKEND_LOG.parent.mkdir(parents=True, exist_ok=True)
    with BACKEND_LOG.open("a", encoding="utf-8") as handle:
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


def resolve_project_path(relative_path: str) -> Path:
    candidate = (PROJECT_ROOT / relative_path).resolve()
    project_root_resolved = PROJECT_ROOT.resolve()
    if os.path.commonpath([str(candidate), str(project_root_resolved)]) != str(project_root_resolved):
        raise HTTPException(status_code=400, detail="Path is outside project root")
    return candidate


def list_images() -> list[dict[str, str]]:
    images = []
    if OUTPUT_FIXED.exists():
        for image_path in sorted(OUTPUT_FIXED.glob("*.png")):
            images.append(
                {
                    "name": image_path.name,
                    "path": str(image_path),
                    "previewUrl": f"http://{APP_HOST}:{APP_PORT}/static-output/colorized_fixed/{image_path.name}",
                }
            )
    return images


def list_pdfs() -> list[dict[str, str]]:
    pdfs = []
    if OUTPUT_FINAL_PDF.exists():
        for pdf_path in sorted(OUTPUT_FINAL_PDF.glob("*.pdf")):
            pdfs.append({"name": pdf_path.name, "path": str(pdf_path)})
    return pdfs


@app.get("/api/health")
def api_health() -> dict[str, object]:
    return {"status": "ok", "backendUrl": f"http://{APP_HOST}:{APP_PORT}"}


@app.get("/api/env")
def api_env() -> dict[str, object]:
    current_python = Path(sys.executable).resolve()
    python_path_ok = current_python == PYTHON_EXE.resolve()
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
        "outputColorizedDir": str(OUTPUT_FIXED),
        "outputFinalPdfDir": str(OUTPUT_FINAL_PDF),
        "inputPdfDefault": "input/pdf/chapter01.pdf",
        "needsReviewCount": len(list(OUTPUT_NEEDS_REVIEW.glob("*"))) if OUTPUT_NEEDS_REVIEW.exists() else 0,
        "recentOutputCount": len(list(OUTPUT_FIXED.glob("*.png"))) if OUTPUT_FIXED.exists() else 0,
    }


@app.get("/api/logs")
def api_logs() -> dict[str, str]:
    return {
        "pipelineLog": tail_lines(PROJECT_ROOT / "logs" / "pipeline.log"),
        "errorLog": tail_lines(PROJECT_ROOT / "logs" / "error.log"),
        "backendLog": tail_lines(BACKEND_LOG),
    }


@app.get("/api/results")
def api_results() -> dict[str, object]:
    return {
        "images": list_images(),
        "pdfs": list_pdfs(),
        "needsReviewCount": len(list(OUTPUT_NEEDS_REVIEW.glob("*"))) if OUTPUT_NEEDS_REVIEW.exists() else 0,
    }


@app.post("/api/colorize")
def api_colorize(payload: ColorizeRequest) -> dict[str, object]:
    input_path = resolve_project_path(payload.inputPath)
    if not PIPELINE_SCRIPT.exists():
        raise HTTPException(status_code=500, detail="scripts/pipeline.py not found")

    command = [str(PYTHON_EXE), str(PIPELINE_SCRIPT), "--input", str(input_path)]
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
    stdout, stderr = process.communicate()
    if stdout:
        append_backend_log(stdout.rstrip())
    if stderr:
        append_backend_log(stderr.rstrip())

    if process.returncode != 0:
        append_backend_log(f"FAILED code={process.returncode}")
        raise HTTPException(status_code=500, detail=f"Pipeline failed with exit code {process.returncode}")

    append_backend_log("SUCCESS pipeline completed")
    return {"started": True, "message": "Colorization completed", "returnCode": process.returncode}


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
def api_open_folder(payload: OpenFolderRequest) -> dict[str, object]:
    target_path = resolve_project_path(payload.target)
    if not target_path.exists() or not target_path.is_dir():
        raise HTTPException(status_code=400, detail="Target folder does not exist or is not a directory")

    process = subprocess.Popen(["explorer.exe", str(target_path)], cwd=str(PROJECT_ROOT))
    append_backend_log(f"OPEN_FOLDER {target_path} pid={process.pid}")
    return {"ok": True, "path": str(target_path)}


if __name__ == "__main__":
    uvicorn.run(app, host=APP_HOST, port=APP_PORT)
