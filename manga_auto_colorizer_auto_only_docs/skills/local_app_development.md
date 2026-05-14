# Skill: Local App Development

## Goal
Develop a local Streamlit app for personal use.

## App Entry
```text
app/streamlit_app.py
```

## Launch Command
```powershell
cd D:\AIProjects\manga-auto-colorizer
conda activate D:\CondaEnvs\manga-color-v2
python -m streamlit run app\streamlit_app.py
```

## App Responsibilities
1. Show project status.
2. Let user choose image folder or PDF input.
3. Run `scripts/pipeline.py`.
4. Show final images and PDF.
5. Show logs and quality report.
