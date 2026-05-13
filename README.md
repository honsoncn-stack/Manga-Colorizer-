# Manga Auto Colorizer

本项目是一个 Windows 本地黑白漫画自动上色应用。当前主线是 **Electron + React + Vite + FastAPI** 的桌面版，核心模型只使用 `external/manga-colorization-v2`。

## 当前范围

- 只做普通自动上色
- 不做 reference 模式
- 不接 MangaNinjia
- 不接 ComfyUI_MangaNinjia
- 不创建 `input/references`

## 桌面应用版

推荐使用桌面应用入口：

- 代码目录：`desktop/`
- 后端 API：`http://127.0.0.1:8765`
- 启动开发模式：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_dev.ps1
```

- 普通启动：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_app.ps1
```

### 桌面应用结构

- `desktop/electron/` - Electron 主进程和 preload
- `desktop/frontend/` - React + Vite 前端
- `desktop/backend/` - FastAPI 后端

### 主要页面

- Dashboard
- Colorize
- Gallery
- Logs
- Settings

### 主要功能

- auto-only 上色
- 拖放输入
- 图片库预览
- 日志刷新
- 任务进度反馈
- 输出目录快速打开

## Streamlit 旧入口

Streamlit 入口仍然保留，但不作为主线。

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python -m streamlit run app\streamlit_app.py
```

## 环境

- 项目根目录：`D:\AIProjects\manga-auto-colorizer`
- Conda 环境：`D:\CondaEnvs\manga-color-v2`
- Python：`D:\CondaEnvs\manga-color-v2\python.exe`

## 安装依赖

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

## 命令行上色

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts/pipeline.py --input input/pages_bw
python scripts/pipeline.py --input input/pdf/chapter01.pdf
```

## 输出位置

- `output/colorized_raw`
- `output/colorized_fixed`
- `output/final_pdf`
- `output/needs_review`
- `reports/quality_report.json`

## Git 注意事项

- 不要提交 `input/`
- 不要提交 `output/`
- 不要提交 `models/`
- 不要提交 `logs/`
- 不要提交 `reports/`
- 不要提交任何模型权重

## 阶段 3：安装器 + 发布

当前阶段使用 Electron Builder 打包 Windows 本地桌面应用。

### 打包命令

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build_desktop_installer.ps1
```

### 创建桌面快捷方式

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create_desktop_shortcut.ps1
```

### 打包输出目录

- `desktop/release/`

### 启动方式

- 双击 portable exe
- 或安装 Setup exe
- 或运行 `scripts\launch_packaged_app.ps1`

### 说明

- 第一版安装包不包含模型权重。
- 第一版安装包不包含 conda 环境。
- 应用仍依赖固定的 `D:\AIProjects\manga-auto-colorizer` 和 `D:\CondaEnvs\manga-color-v2`。
- 这是个人本地应用发布方式，不是云端分发方案。
