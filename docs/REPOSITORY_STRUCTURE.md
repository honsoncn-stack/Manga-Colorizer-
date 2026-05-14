# 仓库结构说明

## 主线代码

```text
desktop/
  electron/      Electron 主进程
  frontend/      React + Vite 前端
  backend/       FastAPI 后端

scripts/         本地导入、上色、导出、打包和环境脚本
docs/            用户文档、发布说明、路线说明
library/         本地书库说明文件；真实书库内容不提交
external/        外部上色模型仓库子模块
```

## 普通用户入口

普通用户不要从仓库首页的 `Code` 按钮下载源码，也不要运行旧的 Streamlit 入口。推荐路径是：

```text
GitHub Release
  -> Manga-Auto-Colorizer-1.0.0-user-kit.zip
  -> setup_customer_environment.ps1
  -> Manga Auto Colorizer Setup 1.0.0.exe
```

如果电脑没有 Conda，把 `Miniconda3-latest-Windows-x86_64.exe` 放到 `user-kit` 解压目录，环境脚本会自动安装到 `D:\Miniconda3`。

## 历史和兼容路径

以下路径保留用于维护、回溯或兼容旧流程，不是当前 1.0 普通用户主入口：

```text
app/streamlit_app.py
app/ui_helpers.py
configs/
.streamlit/
manga_auto_colorizer_auto_only_docs/
```

详情见 `docs/LEGACY_PATHS.md`。

## 前端结构

```text
desktop/frontend/src/
  components/    通用 UI 组件
  pages/         页面：总览、书库、阅读器、队列、图库、记录、设置、说明
  styles/        漫画工作台样式
  lib/           API、路径和阅读状态工具
  assets/        自制 SVG 和视觉资源
```

## 脚本结构

```text
scripts/library_manager.py           导入图片文件夹、PDF、CBZ
scripts/colorize_book_page.py        阅读器单页上色
scripts/colorize_book_batch.py       阅读器批量上色
scripts/export_book_pdf.py           导出完整 PDF
scripts/build_desktop_installer.ps1  构建安装包和便携版
scripts/launch_desktop_dev.ps1       启动开发版桌面应用
scripts/create_dev_desktop_shortcut.ps1 创建开发版桌面快捷方式
scripts/setup_customer_environment.ps1  配置用户环境
```

## 不进源码仓库的内容

这些内容属于本地运行产物、用户数据或大文件，不提交到 Git：

```text
library/books/
library/library_index.json
input/
output/
models/
logs/
reports/
node_modules/
dist/
build/
release/
desktop/release/
*.exe
*.msi
*.pth
*.pt
*.ckpt
*.safetensors
*.onnx
*.pkl
```

## 发布文件放哪里

- 源码仓库：代码、脚本、Markdown 文档、Issue 模板。
- GitHub Release：安装包、便携版、发布说明。
- 用户本机：漫画文件、模型权重、彩图缓存、导出 PDF。
