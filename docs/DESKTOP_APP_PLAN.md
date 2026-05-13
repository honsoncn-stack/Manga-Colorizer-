# Desktop App Plan

## 为什么从 Streamlit 升级到 Electron

Streamlit 适合快速验证流程，但不适合作为长期的 Windows 桌面交付入口。当前项目升级到 Electron 的原因是：

1. 需要更稳定的桌面端交互体验
2. 需要更像本地创作工具的 UI，而不是普通网页表单
3. 需要把前端工作台、后端 API、日志和结果视图整合为一个桌面应用

## 当前技术架构

```text
Electron + React + Vite + Python FastAPI + manga-colorization-v2
```

## 当前版本范围

- 只做 auto 自动上色
- 不做 reference
- 不需要参考图
- 不接 MangaNinjia
- 不接 ComfyUI_MangaNinjia

## 启动流程

```text
Electron
  -> 启动 Python FastAPI 后端
  -> 前端调用 /api/colorize
  -> 后端调用 scripts/pipeline.py
  -> pipeline.py 调用 manga-colorization-v2
```

## 开发启动命令

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_dev.ps1
```

## 普通启动命令

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_app.ps1
```

## 打包方案

- Electron 主进程在 `desktop/electron/`
- React 前端在 `desktop/frontend/`
- Python 后端在 `desktop/backend/`
- 使用 `electron-builder` 打 Windows 安装包

## 后续优化方向

1. 将同步上色任务改成后台任务队列
2. 增加更细的运行状态反馈
3. 继续优化 auto-only 的肤色与线稿保护
4. 在不改主线的前提下继续提升桌面 UI 质感
