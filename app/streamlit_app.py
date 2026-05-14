from __future__ import annotations

import subprocess
from pathlib import Path

import streamlit as st

from ui_helpers import count_input_images, latest_pdf, list_preview_images, load_yaml, read_quality_report, tail_text


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


def run_pipeline(input_path: Path, options: dict[str, object]) -> None:
    command = [
        str(PYTHON_EXE),
        str(PIPELINE_SCRIPT),
        "--input",
        str(input_path),
        "--model-size",
        str(options["model_size"]),
        "--denoiser-sigma",
        str(options["denoiser_sigma"]),
        "--line-strength",
        str(options["line_strength"]),
        "--color-saturation",
        str(options["color_saturation"]),
        "--color-contrast",
        str(options["color_contrast"]),
        "--color-brightness",
        str(options["color_brightness"]),
        "--skin-fix-strength",
        str(options["skin_fix_strength"]),
        "--blur-threshold",
        str(options["blur_threshold"]),
    ]
    if bool(options["disable_denoise"]):
        command.append("--disable-denoise")

    st.session_state["pipeline_process"] = subprocess.Popen(  # noqa: S603
        command,
        cwd=PROJECT_ROOT,
    )
    st.session_state["last_command"] = " ".join(command)


st.set_page_config(
    page_title=APP_CONFIG.get("app_title", "Manga Auto Colorizer"),
    page_icon="🌸",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .stApp {
        background:
            radial-gradient(circle at top left, rgba(255, 196, 214, 0.45), transparent 26%),
            radial-gradient(circle at top right, rgba(255, 236, 204, 0.55), transparent 24%),
            linear-gradient(180deg, #fff9fc 0%, #fffdf8 45%, #fff6fb 100%);
    }
    .hero-card, .soft-card {
        border-radius: 24px;
        padding: 1.2rem 1.3rem;
        background: rgba(255, 255, 255, 0.86);
        border: 1px solid rgba(255, 111, 145, 0.18);
        box-shadow: 0 16px 42px rgba(208, 83, 124, 0.10);
        backdrop-filter: blur(10px);
    }
    .hero-card h1 {
        margin: 0;
        font-size: 2.15rem;
        color: #7a2846;
    }
    .hero-card p {
        margin: 0.45rem 0 0 0;
        color: #7f5c68;
        font-size: 1rem;
    }
    .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.8rem;
        margin-top: 0.9rem;
    }
    .metric-box {
        border-radius: 18px;
        padding: 0.9rem 1rem;
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,244,249,0.95));
        border: 1px solid rgba(255, 143, 171, 0.20);
    }
    .metric-label {
        font-size: 0.82rem;
        color: #946372;
    }
    .metric-value {
        margin-top: 0.3rem;
        font-size: 1.4rem;
        font-weight: 700;
        color: #7d2949;
    }
    .section-title {
        font-size: 1.08rem;
        font-weight: 700;
        color: #7d2949;
        margin-bottom: 0.65rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

running, return_code = process_status()
show_lines = int(APP_CONFIG.get("show_logs_tail_lines", 200))
preview_limit = int(APP_CONFIG.get("preview_max_images", 24))
report = read_quality_report(QUALITY_REPORT)
preview_images = list_preview_images(COLORIZED_FIXED_DIR, preview_limit)
final_pdf = latest_pdf(FINAL_PDF_DIR)
needs_review_count = len([record for record in report.get("records", []) if record.get("issues")])
input_count = count_input_images(PAGES_DIR)
pdf_options = get_pdf_options()

st.markdown(
    f"""
    <div class="hero-card">
        <h1>{APP_CONFIG.get("app_title", "Manga Auto Colorizer")}</h1>
        <p>{APP_CONFIG.get("app_subtitle", "Local black-and-white manga auto colorization tool")}</p>
        <div class="metric-grid">
            <div class="metric-box"><div class="metric-label">模式</div><div class="metric-value">Auto Only</div></div>
            <div class="metric-box"><div class="metric-label">输入图片</div><div class="metric-value">{input_count}</div></div>
            <div class="metric-box"><div class="metric-label">待复核</div><div class="metric-value">{needs_review_count}</div></div>
            <div class="metric-box"><div class="metric-label">Python</div><div class="metric-value">3.10</div></div>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.sidebar:
    st.header("运行选项")
    input_type = st.radio("输入类型", ["图片文件夹", "PDF"], horizontal=True)
    model_size = st.select_slider("推理尺寸", options=[576, 640, 704, 768, 832, 896], value=int(CONFIG.get("default_model_size", 768)))
    disable_denoise = st.toggle("关闭去噪", value=bool(CONFIG.get("default_disable_denoise", True)))
    denoiser_sigma = st.slider("去噪强度", min_value=5, max_value=30, value=int(CONFIG.get("default_denoiser_sigma", 18)))
    line_strength = st.slider("线稿保护", min_value=0.40, max_value=0.95, value=float(CONFIG.get("default_line_strength", 0.72)), step=0.01)
    color_saturation = st.slider("色彩饱和度", min_value=0.90, max_value=1.35, value=float(CONFIG.get("default_color_saturation", 1.12)), step=0.01)
    color_contrast = st.slider("色彩对比度", min_value=0.95, max_value=1.20, value=float(CONFIG.get("default_color_contrast", 1.05)), step=0.01)
    color_brightness = st.slider("亮度修正", min_value=0.95, max_value=1.10, value=float(CONFIG.get("default_color_brightness", 1.01)), step=0.01)
    skin_fix_strength = st.slider("肤色修正", min_value=0.0, max_value=0.90, value=float(CONFIG.get("default_skin_fix_strength", 0.48)), step=0.01)
    blur_threshold = st.slider("线稿模糊阈值", min_value=0.15, max_value=0.35, value=float(CONFIG.get("default_blur_threshold", 0.24)), step=0.01)

    selected_input: Path
    if input_type == "图片文件夹":
        selected_input = PAGES_DIR
        st.caption(f"输入路径：{selected_input}")
    else:
        if pdf_options:
            selected_input = st.selectbox("选择 PDF", pdf_options, format_func=lambda path: path.name)
        else:
            selected_input = PDF_DIR / "chapter01.pdf"
        st.caption(f"输入路径：{selected_input}")

    options = {
        "model_size": model_size,
        "disable_denoise": disable_denoise,
        "denoiser_sigma": denoiser_sigma,
        "line_strength": line_strength,
        "color_saturation": color_saturation,
        "color_contrast": color_contrast,
        "color_brightness": color_brightness,
        "skin_fix_strength": skin_fix_strength,
        "blur_threshold": blur_threshold,
    }

    launch = st.button("开始自动上色", use_container_width=True, disabled=running)
    refresh = st.button("刷新状态", use_container_width=True)

if launch:
    run_pipeline(selected_input, options)
    running = True

if refresh:
    st.rerun()

status_col, env_col = st.columns([1.2, 1.0])
with status_col:
    st.markdown('<div class="soft-card">', unsafe_allow_html=True)
    st.markdown('<div class="section-title">运行状态</div>', unsafe_allow_html=True)
    if running:
        st.info("流水线正在运行，可以随时刷新查看日志和最新预览。")
    elif return_code is not None:
        if return_code == 0:
            st.success("最近一次任务已成功完成。")
        else:
            st.error(f"最近一次任务失败，退出码：{return_code}")
    else:
        st.write("当前没有正在运行的任务。")
    if st.session_state.get("last_command"):
        st.code(st.session_state["last_command"], language="powershell")
    st.markdown("</div>", unsafe_allow_html=True)

with env_col:
    st.markdown('<div class="soft-card">', unsafe_allow_html=True)
    st.markdown('<div class="section-title">环境与输出</div>', unsafe_allow_html=True)
    st.write(f"Python：`{PYTHON_EXE}`")
    st.write(f"核心模型：`{PROJECT_ROOT / 'external' / 'manga-colorization-v2'}`")
    st.write(f"最终 PDF：`{final_pdf if final_pdf else '暂无'}`")
    st.write(f"待复核数量：`{needs_review_count}`")
    st.markdown("</div>", unsafe_allow_html=True)

log_tab, preview_tab, report_tab = st.tabs(["运行日志", "图片预览", "质量报告"])

with log_tab:
    st.code(tail_text(PIPELINE_LOG, show_lines) or "pipeline.log 为空", language="text")
    st.code(tail_text(ERROR_LOG, show_lines) or "error.log 为空", language="text")

with preview_tab:
    if preview_images:
        columns = st.columns(2)
        for index, image_path in enumerate(preview_images):
            columns[index % 2].image(str(image_path), caption=image_path.name, use_container_width=True)
    else:
        st.write("暂无可预览图片。")

with report_tab:
    if report:
        st.json(report)
    else:
        st.write("暂无质量报告。")
