# 系统要求与排查清单

这份清单给普通用户安装和排查问题时使用。

## 推荐系统

- Windows 10 或 Windows 11，64 位系统。
- 建议使用 D 盘安装和运行。
- 建议至少 20 GB 可用空间。
- 首次配置需要稳定网络，用于安装 Python 依赖、Conda 环境和必要组件。若已有可用 Torch 环境，脚本会尽量复用并跳过重复下载。
- 需要 Conda。已经安装 Miniconda/Anaconda 的用户可以直接运行脚本；没有 Conda 的用户，把 `Miniconda3-latest-Windows-x86_64.exe` 放到 `user-kit` 解压后包含 `setup_customer_environment.ps1` 的目录后再运行脚本。文件名略有差异也可以，只要是 `Miniconda3...Windows...x86_64.exe`。
- 可以使用 CPU 运行；有 NVIDIA GPU 会更快，但需要 NVIDIA 驱动正常，并且所选 Python 环境里安装的是 CUDA 版 PyTorch。
- 当前 1.0 Release 脚本只正式支持 NVIDIA CUDA 加速。AMD / Intel 显卡用户默认走 CPU 模式；后续 2.0 可以再做 ROCm / XPU / DirectML 的实验支持。

## 默认安装路径

环境配置脚本默认使用这些路径：

```text
D:\MangaAutoColorizerSetup
D:\AIProjects\manga-auto-colorizer
D:\CondaEnvs\manga-color-v2
D:\AICache
D:\Temp
D:\Programs\Manga Auto Colorizer
```

如果电脑没有 D 盘，或 D 盘空间不足，脚本可能失败。建议先准备 D 盘。

## Release 需要下载的文件

普通用户从 GitHub Release 下载：

```text
Manga-Auto-Colorizer-1.0.0-user-kit.zip
Manga Auto Colorizer Setup 1.0.0.exe
SHA256SUMS.txt
```

`user-kit.zip` 已包含经授权的模型权重：

```text
weights\generator.zip
weights\denoiser.pth
```

## 安装前检查

1. Windows 是否是 64 位。
2. D 盘是否存在。
3. D 盘可用空间是否至少 20 GB。
4. 网络是否能访问 GitHub、Conda 和 Python 包下载源。
5. PowerShell 是否能正常打开。
6. 杀毒软件或 Windows Defender 是否拦截了脚本、安装包或下载文件。
7. 是否已经安装 Conda，或者是否已把 `Miniconda3-latest-Windows-x86_64.exe` 放到 `D:\MangaAutoColorizerSetup\user-kit-1.0.0`。
8. 如果你已经有 Conda / Python / Torch 环境，先阅读 `docs/ENV_REUSE_GUIDE.md`，避免重复下载大型 Torch 依赖。
9. 如果想用 NVIDIA GPU，上色前建议在 PowerShell 里运行 `nvidia-smi`。如果命令不存在或报错，需要先安装或更新 NVIDIA 驱动。AMD / Intel 显卡在 1.0 中按 CPU 用户处理。

已有环境用户可以先运行体检模式，确认脚本会识别到哪个环境：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -PlanOnly
```

体检模式不会下载或安装任何东西。

## 常见问题

### PowerShell 提示不允许运行脚本

请使用安装说明中的命令：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

### PowerShell 提示脚本文件不存在

先确认你在包含 `setup_customer_environment.ps1` 的目录里。按推荐方式解压时，需要先运行：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

### 提示找不到 D 盘

当前 1.0 默认按 D 盘路径配置。请先确认电脑存在 D 盘，并且空间足够。

### 下载依赖失败

通常是网络问题。可以稍后重试，或确认电脑能访问 GitHub、Conda 下载源和 Python 包下载源。

### 提示找不到 Conda

如果电脑没有 Miniconda 或 Anaconda，请下载 `Miniconda3-latest-Windows-x86_64.exe`，放到 `D:\MangaAutoColorizerSetup\user-kit-1.0.0`，然后重新运行：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

也可以手动指定安装器路径：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaInstaller D:\Downloads\Miniconda3-latest-Windows-x86_64.exe
```

### 安装很慢

第一次配置会创建 Conda 环境并安装 Python 包，耗时取决于网络、CPU 和硬盘速度。CPU 电脑也能运行，但上色速度会比 GPU 慢。

如果电脑里已经有 D 盘 Conda / Python / Torch 环境，运行脚本时选择该环境。脚本会只补缺失 Python 包；如果 `torch` 和 `torchvision` 已经能导入，还会继续检查是不是 CUDA 可用版本。NVIDIA 电脑如果检测到 CPU-only Torch，会询问是否重装 CUDA 版。

如果脚本提示：

```text
Install missing Torch packages automatically? This can download 1GB+ data. [Y/n]
```

不想马上下载 Torch 的用户可以输入 `n`。应用仍可打开和阅读，但自动上色需要之后手动安装 Torch。

### 有 NVIDIA 显卡，但应用仍显示 CPU

先检查显卡驱动：

```powershell
nvidia-smi
```

再检查当前环境里的 PyTorch：

```powershell
& "D:\CondaEnvs\manga-color-v2\python.exe" -c "import torch; print(torch.__version__); print(torch.version.cuda); print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```

如果 `torch.version.cuda` 是 `None`，或者 `torch.cuda.is_available()` 是 `False`，说明装的是 CPU 版 PyTorch，或者 CUDA 版 PyTorch 没有正确匹配驱动。重新运行配置脚本，选择 CUDA Torch，或按 PyTorch 官方页面重新安装 CUDA 版。

### 应用能打开，但不能上色

检查：

```text
D:\AIProjects\manga-auto-colorizer\models\downloads\generator.zip
D:\AIProjects\manga-auto-colorizer\models\downloads\denoiser.pth
D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\networks\generator.zip
D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\denoising\models\net_rgb.pth
```

如果这些文件不存在，重新解压 `user-kit.zip`，确认 `weights` 文件夹存在，然后重新运行：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

### 安装包提示未知发布者

当前 1.0 安装包没有正式代码签名证书，Windows 可能提示未知发布者。请确认文件来自本项目 GitHub Release 页面。

## 反馈时请提供

在 GitHub Issues 反馈时，请提供：

- Windows 版本。
- 是否有 D 盘，以及 D 盘剩余空间。
- 运行到第几步失败。
- PowerShell 报错截图或文字。
- 应用「记录」页面里的相关日志。
- 是否使用 CPU 或 NVIDIA GPU。

Issues:

https://github.com/honsoncn-stack/Manga-Colorizer-/issues
