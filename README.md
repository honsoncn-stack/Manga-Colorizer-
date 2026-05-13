# Manga Auto Colorizer

本项目是一个面向 Windows + Codex App 用户的本地黑白漫画自动上色应用。第一版只做普通自动上色，不做 reference 模式，不需要参考图，不接 MangaNinjia，不接 ComfyUI_MangaNinjia。

核心模型固定为 `external/manga-colorization-v2`，应用形态为 Streamlit 本地 Web App。所有项目文件、模型、缓存、输出都应放在 D 盘。

## 项目定位

- 本地黑白漫画自动上色工具
- 只支持普通自动上色
- 不做 reference 模式
- 不需要参考图
- 核心模型是 `manga-colorization-v2`

## 固定环境

- 项目根目录：`D:\AIProjects\manga-auto-colorizer`
- Conda 环境：`D:\CondaEnvs\manga-color-v2`
- Python：`D:\CondaEnvs\manga-color-v2\python.exe`

## Codex App 使用方式

1. 打开 Codex App。
2. 选择 `D:\AIProjects\manga-auto-colorizer`。
3. 选择 Local 模式。
4. 使用 PowerShell 终端。
5. 不要使用 `codex` 命令。

## 安装依赖

```powershell
conda activate D:\CondaEnvs\manga-color-v2
pip install -r requirements-automation.txt
pip install -r requirements-app.txt
pip install -r external/manga-colorization-v2/requirements.txt
```

## 下载权重

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts/download_weights_manga_colorization_v2.py
```

## 检查环境

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts/check_env.py
```

## 启动应用

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_app.ps1
```

或：

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python -m streamlit run app\streamlit_app.py
```

## 命令行上色

图片文件夹：

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts/pipeline.py --input input/pages_bw
```

PDF：

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts/pipeline.py --input input/pdf/chapter01.pdf
```

## 输出位置

- `output/colorized_raw`
- `output/colorized_fixed`
- `output/final_pdf`
- `output/needs_review`
- `reports/quality_report.json`

## 目录说明

```text
D:\AIProjects\manga-auto-colorizer
├─ app
├─ configs
├─ docs
├─ external
├─ input
│  ├─ pages_bw
│  └─ pdf
├─ logs
├─ models
│  └─ downloads
├─ output
│  ├─ pages_split
│  ├─ preprocessed
│  ├─ colorized_raw
│  ├─ colorized_fixed
│  ├─ final_pdf
│  └─ needs_review
├─ reports
├─ scripts
└─ skills
```

## 常见问题

### conda 找不到

确认当前 PowerShell 已正确初始化 Conda。如果 `conda activate D:\CondaEnvs\manga-color-v2` 失败，请先检查本机 Conda 安装。

### Python 用成 VS Code 自带 3.14

执行：

```powershell
conda activate D:\CondaEnvs\manga-color-v2
where.exe python
python --version
```

应优先显示 `D:\CondaEnvs\manga-color-v2\python.exe`。

### torch 没有 GPU

本项目允许 CPU 回退。`scripts/check_env.py` 会把 CUDA 不可用标记为 `[WARN]`，不会因此直接失败。

### 权重下载失败

先运行：

```powershell
python scripts/download_weights_manga_colorization_v2.py
```

如果 Google Drive 下载失败，脚本会给出手动下载说明。权重不要提交到 Git。

### PDF 拆页失败

检查：

- `input/pdf` 中的 PDF 是否损坏
- `pymupdf` 是否已安装
- `logs/error.log` 中的具体错误

### 输出为空

优先检查：

- `external/manga-colorization-v2` 是否存在
- 权重是否已放到正确目录
- `logs/pipeline.log`
- `logs/error.log`

### 上色结果太灰

先检查原始黑白图质量，再查看 `reports/quality_report.json` 中的饱和度告警。当前版本只做 auto-only 流程，不做参考图校色。

### 线稿变糊

流水线中会执行 `scripts/04_preserve_ink_lines.py`，把原始黑线叠回彩色结果，减轻线条发糊问题。

## Git 注意事项

不要提交：

- `input`
- `output`
- `models`
- `logs`
- `reports`
- 任意模型权重与压缩包

## 当前限制

- 不做 reference 模式
- 不创建 `input/references`
- 不接 MangaNinjia
- 不接 ComfyUI_MangaNinjia
- 不提交任何模型权重
