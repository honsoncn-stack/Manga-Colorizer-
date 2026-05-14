# Manga Auto Colorizer

> 历史资料说明：这个目录保存的是早期自动上色/Streamlit 流程文档，主要用于维护和回溯，不是当前 1.0 普通用户安装入口。普通用户请从 GitHub Release 下载 `Manga-Auto-Colorizer-1.0.0-user-kit.zip` 和桌面安装包。

本项目是一个 **Windows 本地黑白漫画自动上色应用**。当前版本只保留 **普通自动上色 Auto 模式**，不做 reference 模式，不接 MangaNinjia，不需要参考图。

## 1. 项目定位

```text
黑白漫画图片 / PDF
→ 自动拆页
→ 图片预处理
→ manga-colorization-v2 自动上色
→ 线稿保护
→ 质量检查
→ 导出彩色图片和 PDF
→ Streamlit 本地界面预览结果
```

## 2. 固定路径

```text
项目根目录：D:\AIProjects\manga-auto-colorizer
Conda 环境：D:\CondaEnvs\manga-color-v2
Python 路径：D:\CondaEnvs\manga-color-v2\python.exe
模型与缓存：D:\AIProjects\manga-auto-colorizer\models 和 D:\AICache
```

## 3. 目录结构

```text
manga-auto-colorizer/
├─ README.md
├─ AGENTS.md
├─ configs/config.yaml
├─ app/streamlit_app.py
├─ app/ui_helpers.py
├─ scripts/
├─ external/manga-colorization-v2/
├─ input/pages_bw/
├─ input/pdf/
├─ output/
├─ models/
├─ logs/
├─ reports/
├─ docs/
└─ skills/
```

## 4. 输入数据

图片输入：

```text
input/pages_bw/001.png
input/pages_bw/002.png
```

PDF 输入：

```text
input/pdf/chapter01.pdf
```

## 5. 输出数据

```text
output/pages_split/       PDF 拆页结果
output/preprocessed/      预处理后的黑白页
output/colorized_raw/     模型原始彩色结果
output/colorized_fixed/   线稿保护后的最终彩色页
output/final_pdf/         最终彩色 PDF
output/needs_review/      质量检查失败页面
reports/quality_report.json
logs/pipeline.log
logs/error.log
```

## 6. 启动本地应用

```powershell
cd D:\AIProjects\manga-auto-colorizer
conda activate D:\CondaEnvs\manga-color-v2
python -m streamlit run app\streamlit_app.py
```

## 7. 命令行运行

图片文件夹：

```powershell
python scripts\pipeline.py --input input\pages_bw
```

PDF：

```powershell
python scripts\pipeline.py --input input\pdf\chapter01.pdf
```

## 8. 当前核心模型

当前只使用：

```text
external/manga-colorization-v2/
```

当前不使用：

```text
MangaNinjia
ComfyUI_MangaNinjia
reference mode
input/references
```

## 9. Git 注意事项

不要提交：

```text
input/
output/
models/
logs/
reports/
*.pth
*.pt
*.ckpt
*.safetensors
*.onnx
*.pkl
```

建议提交：

```text
README.md
AGENTS.md
configs/
app/
scripts/
docs/
skills/
requirements*.txt
.gitignore
```
