# Skill: Manga Auto Colorization Pipeline

## Goal
Build and maintain the auto-only manga colorization pipeline.

## Pipeline Steps
```text
Input
→ PDF split if needed
→ Preprocess pages
→ Auto colorize with manga-colorization-v2
→ Preserve ink lines
→ Quality check
→ Export PDF
```

## Scripts
```text
scripts/01_pdf_to_pages.py
scripts/02_preprocess_pages.py
scripts/03_colorize_auto.py
scripts/04_preserve_ink_lines.py
scripts/05_quality_check.py
scripts/06_export_pdf.py
scripts/pipeline.py
```

## Rules
1. Support image folder and PDF input.
2. Keep original input unchanged.
3. Write outputs under `output/`.
4. Write logs under `logs/`.
5. Use pathlib.
6. Do not implement reference mode.
