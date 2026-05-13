# AGENTS.md

## 固定环境

1. 用户使用的是 Windows Codex App，不是 Codex CLI。
2. 不要使用 `codex` 命令。
3. 项目根目录固定为 `D:\AIProjects\manga-auto-colorizer`。
4. Conda 环境固定为 `D:\CondaEnvs\manga-color-v2`。
5. Python 固定为 `D:\CondaEnvs\manga-color-v2\python.exe`。

## 项目主线

1. 当前主线是 Electron 桌面应用。
2. UI 风格固定为日漫漫画工作台风。
3. 不要删除 Streamlit 旧入口，但不要继续作为主线。
4. 新代码放在 `desktop/`。
5. 后端用 `desktop/backend/server.py`。
6. 前端用 `desktop/frontend/`。

## 范围限制

1. 只做普通自动上色。
2. 不做 reference 模式。
3. 不接 MangaNinjia。
4. 不接 ComfyUI_MangaNinjia。
5. 不创建 `input/references`。
6. 核心后端固定为 `external/manga-colorization-v2`。
7. 不使用任何受版权保护的动漫素材。

## 开发规则

1. 所有 Python 路径处理必须使用 `pathlib`。
2. 所有脚本必须支持 Windows PowerShell。
3. 所有前后端路径必须兼容 Windows。
4. 修改前先执行 `git status`。
5. 修改后做最小测试。
6. 不要伪造测试成功。
7. 如果失败，必须读取日志、说明原因、修复后再试。

## Git 规则

允许提交：

- `README.md`
- `AGENTS.md`
- `.gitignore`
- `desktop/`
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
- `node_modules/`
- `desktop/dist/`
- `desktop/release/`
- `dist/`
- `build/`
- `release/`
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

要求：

1. 当前目录正确。
2. `where.exe python` 第一条是 `D:\CondaEnvs\manga-color-v2\python.exe`。
3. 当前任务仍然是 auto-only 桌面漫画上色应用。

## 最小验证

至少执行：

```powershell
python scripts/check_env.py
python scripts/doctor.py
python scripts/pipeline.py --help
```

桌面端开发至少验证：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_dev.ps1
```
