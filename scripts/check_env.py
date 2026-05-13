from __future__ import annotations

import importlib
import platform
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXPECTED_PYTHON = Path(r"D:\CondaEnvs\manga-color-v2\python.exe")


def emit(level: str, message: str) -> None:
    print(f"[{level}] {message}")


def import_check(module_name: str, display_name: str) -> tuple[bool, object | None]:
    try:
        module = importlib.import_module(module_name)
        emit("OK", f"{display_name} import succeeded")
        return True, module
    except Exception as exc:  # noqa: BLE001
        emit("ERROR", f"{display_name} import failed: {exc}")
        return False, None


def main() -> int:
    failed = False

    emit("OK", f"Python version: {platform.python_version()}")
    current_python = Path(sys.executable).resolve()
    if current_python == EXPECTED_PYTHON.resolve():
        emit("OK", f"Python path is correct: {current_python}")
    else:
        emit("ERROR", f"Python path mismatch: {current_python}")
        failed = True

    modules: dict[str, object | None] = {}
    for module_name, display_name in [
        ("torch", "torch"),
        ("torchvision", "torchvision"),
        ("cv2", "cv2"),
        ("PIL", "PIL"),
        ("fitz", "PyMuPDF"),
        ("yaml", "PyYAML"),
        ("streamlit", "streamlit"),
    ]:
        ok, module = import_check(module_name, display_name)
        modules[module_name] = module
        if not ok:
            failed = True

    torch_module = modules.get("torch")
    if torch_module is not None:
        try:
            cuda_ok = bool(torch_module.cuda.is_available())
            if cuda_ok:
                emit("OK", "torch.cuda.is_available() returned True")
            else:
                emit("WARN", "torch.cuda.is_available() returned False")
        except Exception as exc:  # noqa: BLE001
            emit("WARN", f"Unable to query CUDA availability: {exc}")

    inference_path = PROJECT_ROOT / "external" / "manga-colorization-v2" / "inference.py"
    if inference_path.exists():
        emit("OK", f"Found inference script: {inference_path}")
    else:
        emit("ERROR", f"Missing inference script: {inference_path}")
        failed = True

    config_path = PROJECT_ROOT / "configs" / "config.yaml"
    if config_path.exists():
        emit("OK", f"Found config file: {config_path}")
    else:
        emit("ERROR", f"Missing config file: {config_path}")
        failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
