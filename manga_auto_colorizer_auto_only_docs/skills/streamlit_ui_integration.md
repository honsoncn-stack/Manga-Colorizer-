# Skill: Streamlit UI Integration

## Goal
Connect the Streamlit UI to the Python pipeline.

## Command Pattern

```powershell
D:\CondaEnvs\manga-color-v2\python.exe scripts\pipeline.py --input input\pages_bw
```

or:

```powershell
D:\CondaEnvs\manga-color-v2\python.exe scripts\pipeline.py --input input\pdf\chapter01.pdf
```

## UI Rules
1. Do not run model code directly inside Streamlit.
2. Use subprocess to call pipeline.
3. Show stdout/stderr clearly.
4. Read outputs from `output/colorized_fixed/`.
5. Read final PDF from `output/final_pdf/`.
6. Read logs from `logs/`.
