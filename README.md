# Manga Auto Colorizer

本项目是一个本地黑白漫画自动上色工具，固定运行在 Windows + Codex App + D 盘环境中。当前项目保留两个入口：

1. Streamlit 旧入口
2. Electron 桌面新入口

推荐优先使用 Electron 桌面入口。

## 当前版本范围

- 只做普通自动上色
- 不做 reference 模式
- 不需要参考图
- 不接 MangaNinjia
- 不接 ComfyUI_MangaNinjia
- 核心模型固定为 `external/manga-colorization-v2`

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

## 依赖安装

```powershell
conda activate D:\CondaEnvs\manga-color-v2
pip install -r requirements-automation.txt
pip install -r requirements-app.txt
pip install -r external/manga-colorization-v2/requirements.txt
```

## 权重下载

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts/download_weights_manga_colorization_v2.py
```

## 环境检查

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts/check_env.py
python scripts/doctor.py
```

## 桌面应用版

当前有两个入口：

1. Streamlit 旧入口
2. Electron 桌面新入口

推荐使用 Electron 桌面入口。

桌面应用代码路径：

```text
desktop/
```

桌面应用后端 API：

```text
http://127.0.0.1:8765
```

开发模式启动：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_dev.ps1
```

普通启动：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_app.ps1
```

## Streamlit 旧入口

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

## 常见问题

### conda 找不到

确认 PowerShell 已初始化 Conda，并检查：

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python --version
where.exe python
```

### Python 不是目标环境

`where.exe python` 的第一条应为：

```text
D:\CondaEnvs\manga-color-v2\python.exe
```

### torch 没有 GPU

允许 CPU 回退。`scripts/check_env.py` 会把 CUDA 不可用标记为 `[WARN]`，不会因此直接失败。

### 权重下载失败

先执行：

```powershell
python scripts/download_weights_manga_colorization_v2.py
```

如果 Google Drive 下载失败，脚本会输出手动下载说明。

### 桌面端打不开

优先检查：

- `scripts/launch_desktop_dev.ps1`
- `desktop/backend/logs/backend.log`
- `logs/pipeline.log`
- `logs/error.log`

## Git 注意事项

不要提交：

- `input`
- `output`
- `models`
- `logs`
- `reports`
- `node_modules`
- `desktop/release`
- `desktop/dist`
- 任意模型权重

## 当前限制

- 不做 reference 模式
- 不创建 `input/references`
- 不接 MangaNinjia
- 不接 ComfyUI_MangaNinjia
- 核心模型只使用 `manga-colorization-v2`
