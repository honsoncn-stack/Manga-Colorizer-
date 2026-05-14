"""UI helper functions for the Streamlit app."""
from pathlib import Path
from typing import List

PYTHON_PATH = Path(r"D:\CondaEnvs\manga-color-v2\python.exe")

def build_pipeline_command(input_path: str) -> List[str]:
    return [str(PYTHON_PATH), "scripts/pipeline.py", "--input", input_path]
