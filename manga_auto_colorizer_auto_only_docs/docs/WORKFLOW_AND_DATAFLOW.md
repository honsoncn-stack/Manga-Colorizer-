# Workflow and Dataflow

## 1. 总体工作流

```text
用户打开 Streamlit 本地应用
→ 选择输入类型：图片文件夹或 PDF
→ 点击开始上色
→ 应用调用 scripts/pipeline.py
→ pipeline 自动运行所有子步骤
→ 输出彩色图片、彩色 PDF、质量报告和日志
→ 应用读取 output / reports / logs 并展示
```

## 2. 图片文件夹数据流

```text
input/pages_bw/
  001.png
  002.png
        ↓
scripts/02_preprocess_pages.py
        ↓
output/preprocessed/
        ↓
scripts/03_colorize_auto.py
        ↓
external/manga-colorization-v2/inference.py
        ↓
output/colorized_raw/
        ↓
scripts/04_preserve_ink_lines.py
        ↓
output/colorized_fixed/
        ↓
scripts/05_quality_check.py
        ↓
reports/quality_report.json
output/needs_review/
        ↓
scripts/06_export_pdf.py
        ↓
output/final_pdf/chapter_colorized.pdf
```

## 3. PDF 数据流

```text
input/pdf/chapter01.pdf
        ↓
scripts/01_pdf_to_pages.py
        ↓
output/pages_split/
        ↓
scripts/02_preprocess_pages.py
        ↓
output/preprocessed/
        ↓
scripts/03_colorize_auto.py
        ↓
output/colorized_raw/
        ↓
scripts/04_preserve_ink_lines.py
        ↓
output/colorized_fixed/
        ↓
scripts/05_quality_check.py
        ↓
reports/quality_report.json
        ↓
scripts/06_export_pdf.py
        ↓
output/final_pdf/chapter01_colorized.pdf
```

## 4. 工具调用流

```text
Streamlit App
  app/streamlit_app.py
  app/ui_helpers.py
        ↓ subprocess
D:\CondaEnvs\manga-color-v2\python.exe
        ↓
scripts/pipeline.py
        ↓
子脚本
        ↓
external/manga-colorization-v2
```

## 5. 文件角色

| 文件/目录 | 作用 |
|---|---|
| `README.md` | 给用户看的项目说明 |
| `AGENTS.md` | 给 Codex App/agent 看的开发规则 |
| `configs/config.yaml` | 固定路径和项目配置 |
| `app/streamlit_app.py` | 本地应用界面入口 |
| `scripts/pipeline.py` | 流水线总调度 |
| `external/manga-colorization-v2` | 真正执行自动上色的第三方模型项目 |
| `input/pages_bw` | 黑白漫画页输入 |
| `input/pdf` | PDF 输入 |
| `output/colorized_fixed` | 最终彩色图片 |
| `output/final_pdf` | 最终彩色 PDF |
| `logs/pipeline.log` | 正常运行日志 |
| `logs/error.log` | 错误日志 |
| `reports/quality_report.json` | 质量检查报告 |

## 6. 当前不包含的流程

```text
reference mode
MangaNinjia
ComfyUI_MangaNinjia
input/references
多角色参考图管理
云端 API
```
