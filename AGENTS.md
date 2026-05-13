# AGENTS.md

## 固定工作环境

1. 用户使用的是 Windows Codex App，不是 Codex CLI。
2. 不要使用 `codex` 命令。
3. 项目根目录固定为 `D:\AIProjects\manga-auto-colorizer`。
4. Conda 环境固定为 `D:\CondaEnvs\manga-color-v2`。
5. Python 固定为 `D:\CondaEnvs\manga-color-v2\python.exe`。

## 项目范围

1. 项目只做普通自动上色。
2. 不做 reference 模式。
3. 不接 MangaNinjia。
4. 不接 ComfyUI_MangaNinjia。
5. 不创建 `input/references`。
6. 核心后端固定为 `external/manga-colorization-v2`。

## 开发规则

1. 所有 Python 路径处理必须使用 `pathlib`。
2. 所有脚本必须支持 Windows PowerShell。
3. 不提交输入、输出、模型、日志、报告。
4. 每次修改前先执行 `git status`。
5. 修改后做最小测试。
6. 不要伪造测试成功。
7. 如果失败，必须读取日志、说明原因、修复后再试。

## Git 规则

允许提交：

- `README.md`
- `AGENTS.md`
- `.gitignore`
- `app/`
- `scripts/`
- `configs/`
- `docs/`
- `skills/`
- `requirements-automation.txt`
- `requirements-app.txt`

禁止提交：

- `input/`
- `output/`
- `models/`
- `logs/`
- `reports/`
- `*.pth`
- `*.pt`
- `*.ckpt`
- `*.safetensors`
- `*.onnx`
- `*.pkl`

## 运行前检查

```powershell
cd D:\AIProjects\manga-auto-colorizer
git status
conda activate D:\CondaEnvs\manga-color-v2
python --version
where.exe python
```

应确认：

1. 当前目录正确。
2. 当前 Python 为 `D:\CondaEnvs\manga-color-v2\python.exe`。
3. 当前任务仍然是 auto-only 本地漫画上色应用。

## 最小验证要求

至少执行：

```powershell
python scripts/check_env.py
python scripts/doctor.py
python scripts/pipeline.py --help
```

如果 `input/pages_bw` 有测试图片，再执行：

```powershell
python scripts/pipeline.py --input input/pages_bw
```
