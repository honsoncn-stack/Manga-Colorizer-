# AGENTS.md

## 项目名称

manga-auto-colorizer

## 用户环境

用户使用的是 **Windows 端 Codex App**，不是 Codex CLI。不要使用 `codex` 命令。

固定项目路径：

```text
D:\AIProjects\manga-auto-colorizer
```

固定 Conda 环境：

```text
D:\CondaEnvs\manga-color-v2
```

默认终端：PowerShell。

## 项目目标

本项目用于搭建一个 **本地黑白漫画自动上色应用**。输入黑白漫画图片文件夹或 PDF，输出彩色漫画图片和最终彩色 PDF。

当前版本只做：

```text
普通自动上色 Auto 模式
```

当前版本不做：

```text
reference 模式
MangaNinjia
ComfyUI_MangaNinjia
input/references
角色参考图匹配
云端 API
```

## 核心方案

第一版核心模型：

```text
external/manga-colorization-v2
```

完整调度入口：

```text
scripts/pipeline.py
```

本地应用入口：

```text
app/streamlit_app.py
```

## 重要限制

1. 不处理未授权商业漫画的公开传播版本。
2. 默认只处理用户拥有版权、已授权、公版、原创或内部学习测试材料。
3. 不要把 `input/`、`output/`、`models/`、`logs/`、`reports/` 提交到 Git。
4. 不要提交任何模型权重，包括 `.pth`、`.pt`、`.ckpt`、`.safetensors`、`.onnx`、`.pkl`。
5. 不要覆盖原始输入文件。
6. 所有路径必须兼容 Windows。
7. 所有 Python 路径处理必须使用 `pathlib`。
8. 所有脚本必须支持 `argparse` 和 `--help`。
9. 任意失败必须写入 `logs/error.log`。
10. 成功流程必须写入 `logs/pipeline.log`。
11. 不要使用 Codex CLI。
12. 不要把缓存、模型、临时文件放到 C 盘。

## 标准数据流

```text
input/pages_bw 或 input/pdf
→ output/pages_split
→ output/preprocessed
→ external/manga-colorization-v2
→ output/colorized_raw
→ output/colorized_fixed
→ reports/quality_report.json
→ output/final_pdf
```

## 标准脚本流

```text
scripts/pipeline.py
├─ scripts/01_pdf_to_pages.py
├─ scripts/02_preprocess_pages.py
├─ scripts/03_colorize_auto.py
├─ scripts/04_preserve_ink_lines.py
├─ scripts/05_quality_check.py
└─ scripts/06_export_pdf.py
```

## 本地应用流

```text
app/streamlit_app.py
→ app/ui_helpers.py
→ D:\CondaEnvs\manga-color-v2\python.exe
→ scripts/pipeline.py
→ output/
→ logs/
→ reports/
→ Streamlit 页面展示
```

## 必须维护的脚本

```text
scripts/check_env.py
scripts/download_weights_manga_colorization_v2.py
scripts/01_pdf_to_pages.py
scripts/02_preprocess_pages.py
scripts/03_colorize_auto.py
scripts/04_preserve_ink_lines.py
scripts/05_quality_check.py
scripts/06_export_pdf.py
scripts/pipeline.py
scripts/clean_outputs.py
scripts/doctor.py
```

## 运行命令

环境检查：

```powershell
conda activate D:\CondaEnvs\manga-color-v2
python scripts\check_env.py
```

启动应用：

```powershell
python -m streamlit run app\streamlit_app.py
```

图片文件夹上色：

```powershell
python scripts\pipeline.py --input input\pages_bw
```

PDF 上色：

```powershell
python scripts\pipeline.py --input input\pdf\chapter01.pdf
```

## 代码修改规则

1. 修改前先运行 `git status`。
2. 优先在 `scripts/` 中写 wrapper，不直接改第三方项目源码。
3. 不要删除 third-party submodule 文件，除非用户明确要求。
4. 每次完成稳定阶段后提交 Git。
5. 不要假装某个功能已经跑通。没有测试就明确说明未测试。

## 质量检查标准

至少检查：

1. 输出图片数量是否等于输入图片数量。
2. 图片是否能打开。
3. 输出图片尺寸是否异常。
4. 平均饱和度是否过低。
5. 线条是否明显变糊。
6. 是否成功导出 PDF。
7. 是否生成 `reports/quality_report.json`。
8. 是否写入日志。
