from __future__ import annotations

import shutil
import sys
import zipfile
from pathlib import Path
import os


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS_DIR = PROJECT_ROOT / "models" / "downloads"
REPO_DIR = PROJECT_ROOT / "external" / "manga-colorization-v2"
NETWORKS_DIR = REPO_DIR / "networks"
DENOISER_DIR = REPO_DIR / "denoising" / "models"
GENERATOR_FILE_ID = "1qmxUEKADkEM4iYLp1fpPLLKnfZ6tcF-t"
DENOISER_FILE_ID = "161oyQcYpdkVdw8gKz_MA8RD-Wtg9XDp3"
MIN_WEIGHT_BYTES = 1_048_576


def emit(level: str, message: str) -> None:
    print(f"[{level}] {message}")


def is_ready_file(path: Path, min_bytes: int = MIN_WEIGHT_BYTES) -> bool:
    return path.is_file() and path.stat().st_size >= min_bytes


def ensure_d_temp() -> None:
    d_temp = Path(r"D:\Temp")
    d_temp.mkdir(parents=True, exist_ok=True)
    for key in ("TEMP", "TMP"):
        current = Path((os.environ.get(key, "")) or ".").resolve()
        if not str(current).startswith(r"D:\Temp"):
            os.environ[key] = str(d_temp)
            emit("WARN", f"Temporarily set {key} to {d_temp}")


def try_import_gdown():
    try:
        import gdown  # type: ignore

        return gdown
    except Exception as exc:  # noqa: BLE001
        emit("ERROR", f"gdown import failed: {exc}")
        return None


def download_file(gdown_module, file_id: str, destination: Path) -> bool:
    if is_ready_file(destination):
        emit("OK", f"Already downloaded, skipping: {destination}")
        return True

    try:
        gdown_module.download(id=file_id, output=str(destination), quiet=False)
        if is_ready_file(destination):
            emit("OK", f"Downloaded: {destination}")
            return True
    except Exception as exc:  # noqa: BLE001
        emit("WARN", f"Download failed for {destination.name}: {exc}")
    return False


def install_generator(generator_path: Path) -> None:
    NETWORKS_DIR.mkdir(parents=True, exist_ok=True)
    if generator_path.suffix.lower() == ".zip":
        # The upstream repo loads networks/generator.zip directly.
        zip_target = NETWORKS_DIR / "generator.zip"
        if is_ready_file(zip_target):
            emit("OK", f"Generator already installed, skipping: {zip_target}")
            return

        shutil.copy2(generator_path, zip_target)
        emit("OK", f"Copied generator zip to: {zip_target}")

        with zipfile.ZipFile(generator_path, "r") as archive:
            archive.extractall(NETWORKS_DIR)
        emit("OK", f"Extracted generator zip into: {NETWORKS_DIR}")
        return

    target = NETWORKS_DIR / generator_path.name
    if is_ready_file(target):
        emit("OK", f"Generator already installed, skipping: {target}")
        return

    shutil.copy2(generator_path, target)
    emit("OK", f"Copied generator weight to: {target}")


def install_denoiser(denoiser_path: Path) -> None:
    DENOISER_DIR.mkdir(parents=True, exist_ok=True)
    target = DENOISER_DIR / "net_rgb.pth"
    if is_ready_file(target):
        emit("OK", f"Denoiser already installed, skipping: {target}")
        return

    shutil.copy2(denoiser_path, target)
    emit("OK", f"Copied denoiser weight to: {target}")


def print_manual_instructions() -> None:
    emit("WARN", "Google Drive download failed. Please download weights manually.")
    print("Manual placement targets:")
    print(f"- Generator -> {NETWORKS_DIR}")
    print(f"- Denoiser -> {DENOISER_DIR}")
    print("Google Drive file IDs:")
    print(f"- generator: {GENERATOR_FILE_ID}")
    print(f"- denoiser: {DENOISER_FILE_ID}")


def main() -> int:
    ensure_d_temp()
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

    if not REPO_DIR.exists():
        emit("ERROR", f"Repository directory not found: {REPO_DIR}")
        emit("WARN", "Clone or initialize external/manga-colorization-v2 first.")
        return 1

    generator_target = NETWORKS_DIR / "generator.zip"
    denoiser_target = DENOISER_DIR / "net_rgb.pth"
    generator_installed = is_ready_file(generator_target)
    denoiser_installed = is_ready_file(denoiser_target)
    if generator_installed and denoiser_installed:
        emit("OK", "Model weights already installed. Nothing to download.")
        return 0

    gdown_module = try_import_gdown()
    if gdown_module is None:
        print_manual_instructions()
        return 1

    generator_candidates = [
        DOWNLOADS_DIR / "generator.zip",
        DOWNLOADS_DIR / "generator.pth",
    ]
    denoiser_path = DOWNLOADS_DIR / "denoiser.pth"

    generator_ok = generator_installed
    chosen_generator: Path | None = None
    if generator_installed:
        emit("OK", f"Generator already installed, skipping download: {generator_target}")
    else:
        for candidate in generator_candidates:
            if download_file(gdown_module, GENERATOR_FILE_ID, candidate):
                chosen_generator = candidate
                generator_ok = True
                break

    if denoiser_installed:
        emit("OK", f"Denoiser already installed, skipping download: {denoiser_target}")
        denoiser_ok = True
    else:
        denoiser_ok = download_file(gdown_module, DENOISER_FILE_ID, denoiser_path)

    if not generator_ok or not denoiser_ok:
        print_manual_instructions()
        return 1

    try:
        if chosen_generator is not None:
            install_generator(chosen_generator)
        if not denoiser_installed:
            install_denoiser(denoiser_path)
    except Exception as exc:  # noqa: BLE001
        emit("ERROR", f"Weight installation failed: {exc}")
        return 1

    emit("OK", "Weight download and placement completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
