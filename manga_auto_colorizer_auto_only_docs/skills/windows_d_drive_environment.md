# Skill: Windows D Drive Environment

## Goal
Keep the entire project, model files, caches, outputs, logs, and conda environment on the D drive.

## Fixed Paths

```text
Project: D:\AIProjects\manga-auto-colorizer
Conda env: D:\CondaEnvs\manga-color-v2
Pip cache: D:\AICache\pip
Torch cache: D:\AICache\torch
Temporary files: D:\Temp
```

## Rules
1. Do not put project files on Desktop, Downloads, or C drive.
2. Use `D:\CondaEnvs\manga-color-v2\python.exe`.
3. Use pathlib in Python scripts.
4. Do not hardcode C drive paths.
5. Before running scripts, check `where.exe python`.
