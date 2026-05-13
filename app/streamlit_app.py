from __future__ import annotations

import subprocess
from pathlib import Path

import streamlit as st

from ui_helpers import list_preview_images, load_yaml, read_quality_report, tail_text


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = load_yaml(PROJECT_ROOT / "configs" / "config.yaml")
APP_CONFIG = load_yaml(PROJECT_ROOT / "configs" / "app_config.yaml")
PYTHON_EXE = Path(CONFIG.get("python_path", r"D:\CondaEnvs\manga-color-v2\python.exe"))
PIPELINE_SCRIPT = PROJECT_ROOT / "scripts" / "pipeline.py"
PAGES_DIR = PROJECT_ROOT / "input" / "pages_bw"
PDF_DIR = PROJECT_ROOT / "input" / "pdf"
PIPELINE_LOG = PROJECT_ROOT / "logs" / "pipeline.log"
ERROR_LOG = PROJECT_ROOT / "logs" / "error.log"
COLORIZED_FIXED_DIR = PROJECT_ROOT / "output" / "colorized_fixed"
FINAL_PDF_DIR = PROJECT_ROOT / "output" / "final_pdf"
QUALITY_REPORT = PROJECT_ROOT / "reports" / "quality_report.json"


def get_pdf_options() -> list[Path]:
    if not PDF_DIR.exists():
        return []
    return sorted(PDF_DIR.glob("*.pdf"))


def process_status() -> tuple[bool, int | None]:
    process = st.session_state.get("pipeline_process")
    if process is None:
        return False, None
    code = process.poll()
    if code is None:
        return True, None
    st.session_state["last_return_code"] = code
    st.session_state["pipeline_process"] = None
    return False, code


def run_pipeline(input_path: Path) -> None:
    command = [str(PYTHON_EXE), str(PIPELINE_SCRIPT), "--input", str(input_path)]
    st.session_state["pipeline_process"] = subprocess.Popen(  # noqa: S603
        command,
        cwd=PROJECT_ROOT,
    )
    st.session_state["last_command"] = " ".join(command)


st.set_page_config(page_title=APP_CONFIG.get("app_title", "Manga Auto Colorizer"), layout="wide")

st.title(APP_CONFIG.get("app_title", "Manga Auto Colorizer"))
st.caption(APP_CONFIG.get("app_subtitle", "Local black-and-white manga auto colorization tool"))

running, return_code = process_status()
show_lines = int(APP_CONFIG.get("show_logs_tail_lines", 200))
preview_limit = int(APP_CONFIG.get("preview_max_images", 24))

st.subheader("项目状态")
st.write(f"Project root: `{PROJECT_ROOT}`")
st.write(f"Core repo: `{PROJECT_ROOT / 'external' / 'manga-colorization-v2'}`")
st.write("Mode: `auto only`")

st.subheader("环境状态")
st.write(f"Python: `{PYTHON_EXE}`")
st.write(f"Pipeline script exists: `{PIPELINE_SCRIPT.exists()}`")

st.subheader("输入设置")
input_type = st.radio("输入类型", ["图片文件夹", "PDF"], horizontal=True)

selected_input: Path
if input_type == "图片文件夹":
    selected_input = PAGES_DIR
    st.write(f"输入路径：`{selected_input}`")
else:
    pdf_options = get_pdf_options()
    if pdf_options:
        selected_pdf = st.selectbox("选择 PDF", options=pdf_options, format_func=lambda path: path.name)
        selected_input = Path(selected_pdf)
    else:
        selected_input = PDF_DIR / "chapter01.pdf"
    st.write(f"输入路径：`{selected_input}`")

col1, col2 = st.columns([1, 1])
with col1:
    if st.button("开始上色", disabled=running):
        run_pipeline(selected_input)
        running = True
with col2:
    if st.button("刷新状态"):
        st.rerun()

if running:
    st.info("流水线正在运行。可点击“刷新状态”查看最新日志。")
else:
    if return_code is not None:
        if return_code == 0:
            st.success("最近一次运行已结束。")
        else:
            st.error(f"最近一次运行失败，退出码：{return_code}")

if st.session_state.get("last_command"):
    st.write(f"最近执行命令：`{st.session_state['last_command']}`")

st.subheader("运行日志")
st.code(tail_text(PIPELINE_LOG, show_lines) or "pipeline.log 为空", language="text")
st.code(tail_text(ERROR_LOG, show_lines) or "error.log 为空", language="text")

st.subheader("彩色图片预览")
preview_images = list_preview_images(COLORIZED_FIXED_DIR, preview_limit)
if preview_images:
    columns = st.columns(3)
    for index, image_path in enumerate(preview_images):
        columns[index % 3].image(str(image_path), caption=image_path.name, use_container_width=True)
else:
    st.write("暂无可预览图片。")

st.subheader("结果摘要")
final_pdfs = sorted(FINAL_PDF_DIR.glob("*.pdf")) if FINAL_PDF_DIR.exists() else []
if final_pdfs:
    st.write(f"最终 PDF 路径：`{final_pdfs[-1]}`")
else:
    st.write("最终 PDF 路径：暂无")

report = read_quality_report(QUALITY_REPORT)
flagged_count = len([record for record in report.get("records", []) if record.get("issues")])
st.write(f"needs_review 数量：`{flagged_count}`")
