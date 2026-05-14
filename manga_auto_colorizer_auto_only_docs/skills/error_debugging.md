# Skill: Error Debugging

## First Checks
```powershell
git status
conda activate D:\CondaEnvs\manga-color-v2
where.exe python
python --version
python scripts\check_env.py
```

## Logs
Check:
```text
logs/pipeline.log
logs/error.log
reports/quality_report.json
```

## Common Problems
1. Conda environment not activated.
2. Wrong Python from VS Code 3.14 or base env.
3. Missing model weights.
4. Missing submodule.
5. PDF path wrong.
6. Output directory empty.
7. Torch / torchvision import error.
8. Windows path escaping error.

## Rule
Never fake successful execution. If not tested, say not tested.
