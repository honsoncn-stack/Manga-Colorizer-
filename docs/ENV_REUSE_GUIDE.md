# 已有环境复用教程

这份教程给已经装过 Conda、Python 或 Torch 的用户看。目标是：**能复用就复用，只补缺失内容，尽量少下载重复依赖**。

## 先说结论

运行 `setup_customer_environment.ps1` 时，脚本会做这些事：

1. 扫描 D 盘常见 Conda 环境：
   - `D:\CondaEnvs\*`
   - `D:\Miniconda3\envs\*`
   - `D:\Anaconda3\envs\*`
2. 把找到的环境列出来，并标明：
   - 应用依赖是否齐全
   - `torch` / `torchvision` 是否已经安装
   - Torch 是 CUDA 可用版本，还是 CPU-only 版本
3. 让你选择：
   - 输入数字：复用扫描到的环境
   - 粘贴路径：使用指定环境
   - 直接回车：使用或创建默认环境 `D:\CondaEnvs\manga-color-v2`
4. 只安装缺失的 Python 包。
5. 如果缺 Torch，会单独询问你是否安装，因为 Torch 体积较大。
6. 如果电脑有 NVIDIA GPU，但已有 Torch 是 CPU-only 版本，脚本会询问是否重装 CUDA 版 Torch。

当前 1.0 Release 脚本只正式支持 NVIDIA CUDA 加速。AMD / Intel 显卡用户可以正常安装和阅读，上色会默认走 CPU；ROCm / XPU / DirectML 这类非 NVIDIA GPU 后端后续可以作为 2.0 实验功能再做。

## 第 1 步：解压 Release 用户包

把 `Manga-Auto-Colorizer-1.0.0-user-kit.zip` 解压到 D 盘，例如：

```text
D:\MangaAutoColorizerSetup
```

进入解压后的 `user-kit-1.0.0` 文件夹。按推荐方式解压时，确认里面至少有：

```text
D:\MangaAutoColorizerSetup\user-kit-1.0.0\setup_customer_environment.ps1
D:\MangaAutoColorizerSetup\user-kit-1.0.0\manga-auto-colorizer-project.zip
D:\MangaAutoColorizerSetup\user-kit-1.0.0\weights\generator.zip
D:\MangaAutoColorizerSetup\user-kit-1.0.0\weights\denoiser.pth
```

## 第 2 步：检查自己有没有可复用环境

如果你知道自己的环境路径，可以先检查 Torch 是否可用。

把下面命令里的路径改成你自己的 `python.exe`：

```powershell
& "D:\CondaEnvs\my-env\python.exe" -c "import torch, torchvision; print('torch', torch.__version__); print('torchvision', torchvision.__version__)"
```

如果能输出版本号，说明这个环境已经有 Torch，但还不能说明它一定会走 GPU。

想确认是不是 CUDA / GPU 版，请运行：

```powershell
& "D:\CondaEnvs\my-env\python.exe" -c "import torch; print('torch', torch.__version__); print('torch.version.cuda', torch.version.cuda); print('cuda available', torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```

如果 `torch.version.cuda` 是 `None`，或者 `cuda available` 是 `False`，它就是 CPU-only 或 CUDA 不可用环境。能打开应用，但上色会慢。

如果不知道环境在哪里，可以试：

```powershell
conda env list
```

常见路径长这样：

```text
D:\CondaEnvs\my-env
D:\CondaEnvs\my-env\python.exe
D:\Miniconda3\envs\my-env
D:\Anaconda3\envs\my-env
```

## 第 3 步：运行配置脚本

如果你想先看看脚本会识别到哪些环境、准备复用什么，而不想立刻安装任何东西，可以先运行体检模式：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -PlanOnly
```

`-PlanOnly` 只检查电脑，不下载、不安装、不改环境。确认列表里有你想复用的环境后，再运行正式安装命令。

打开 PowerShell：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

脚本会出现类似提示：

```text
==> Choosing Python/Torch environment
Detected environments:
  [1] D:\CondaEnvs\manga-color-v2  -  ready: app deps + Torch CUDA ready: NVIDIA GeForce RTX ...
  [2] D:\CondaEnvs\my-env          -  Torch CPU only; missing app deps: fastapi, fitz

Type a number to reuse one of the environments above.
Or paste a D: drive environment folder / python.exe path.
Press Enter to use or create the default environment.
Choose environment:
```

选择环境和 Torch 方案后，脚本还会显示一次安装计划确认。看到计划没问题，再输入 `Y` 或直接回车继续；如果发现选错环境，输入 `n` 停止重来。

## 第 4 步：按你的情况选择

### 情况 A：我是新手，什么环境都没有

直接回车。

脚本会使用默认路径：

```text
D:\CondaEnvs\manga-color-v2
```

如果没有 Conda，需要先把 `Miniconda3-latest-Windows-x86_64.exe` 放到用户包目录，再运行脚本。

### 情况 B：我已经有 D 盘 Conda 环境，而且列表里看到了

输入对应数字，例如：

```text
1
```

脚本会检查这个环境里缺什么。

如果只缺普通应用依赖，建议输入 `Y`：

```text
Install these missing app packages into this environment? [Y/n]
```

这些包通常比 Torch 小很多，补装即可。

如果提示 Torch CUDA 已经可用，脚本会显示：

```text
[OK] Torch CUDA is available. Torch download will be skipped.
```

这时不会重复下载 Torch，也会在上色时自动使用 GPU。

如果你有 NVIDIA 显卡，但脚本显示已有 Torch 是 CPU-only，脚本会询问：

```text
Reinstall Torch with CUDA build now? This can download 1GB+ data. [Y/n]
```

想用 GPU 就输入 `Y` 或直接回车；想先保留 CPU 版就输入 `n`。

### 情况 C：我已经有环境，但列表没扫出来

直接粘贴环境目录：

```text
D:\CondaEnvs\my-env
```

或者粘贴 `python.exe`：

```text
D:\CondaEnvs\my-env\python.exe
```

脚本会自动识别。

### 情况 D：我有环境，但不想让脚本动它

如果脚本提示要安装缺失包，可以输入 `n`。

```text
Install these missing app packages into this environment? [Y/n]
n
```

注意：如果依赖缺失，应用可能能打开，但部分功能会失败。

### 情况 E：我没有 Torch，暂时不想下载

当脚本提示：

```text
Install Torch for [G]PU CUDA / [C]PU only / [N]o? This can download 1GB+ data.
```

输入：

```text
N
```

这样可以先完成其他配置。应用可以打开和阅读，但自动上色可能不可用。之后你可以手动装 Torch，再重新运行脚本检查。

## 第 5 步：手动指定环境的命令写法

如果你已经确定要用哪个环境，也可以直接写在命令里：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaEnvPath D:\CondaEnvs\my-env
```

如果你确定暂时不装 Torch：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaEnvPath D:\CondaEnvs\my-env -SkipTorchInstall
```

如果你确定 Python 包也不让脚本安装：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaEnvPath D:\CondaEnvs\my-env -SkipPythonPackages -SkipTorchInstall
```

## 脚本会跳过哪些已经存在的东西

脚本可以重复运行。已存在的内容会尽量跳过：

- 项目源码已经在 `D:\AIProjects\manga-auto-colorizer`：跳过重新解压或克隆。
- 原模型仓库已经有 `inference.py`：跳过重新下载模型仓库。
- 权重已经存在：跳过复制权重。
- 桌面应用已经安装：跳过复制应用，只补桌面快捷方式。
- Python 包已经能导入：跳过对应包安装。
- `torch` 和 `torchvision` 已经能导入且 CUDA 可用：跳过 Torch 安装。
- `torch` 和 `torchvision` 已经能导入但只有 CPU：如果电脑检测到 NVIDIA GPU，会询问是否重装 CUDA 版。

## 为什么脚本只接受 D 盘环境

当前公开版按“所有项目、缓存、环境尽量放 D 盘”的方式设计，目的是减少 C 盘污染和路径混乱。

如果你已有 C 盘环境，并且非常确定要复用，请走手动安装教程：

```text
docs/MANUAL_INSTALLATION.md
```

普通用户更建议使用 D 盘默认环境。

## 常见问题

### 1. 我已经装了 Torch，为什么脚本还说缺？

通常是你选错了 Python 环境。每个 Conda 环境都有自己的 `python.exe`，A 环境装过 Torch，不代表 B 环境也有。

用这条命令检查你选择的环境：

```powershell
& "D:\CondaEnvs\my-env\python.exe" -c "import torch, torchvision; print(torch.__version__)"
```

### 2. Torch 下载很慢怎么办？

可以先在脚本提示时输入 `n` 跳过 Torch，之后按 PyTorch 官方页面选择适合自己的安装命令：

```text
https://pytorch.org/get-started/locally/
```

装好后重新运行脚本，它会检查到 Torch 已存在并跳过。

### 3. 我应该选 CPU 还是 GPU？

如果电脑没有 NVIDIA 显卡，选 CPU。AMD / Intel 显卡在 1.0 Release 脚本里也按 CPU 处理。

如果电脑有 NVIDIA 显卡，建议选 GPU / CUDA。脚本会优先使用 CUDA 版 Torch；如果安装失败，通常需要更新 NVIDIA 驱动，或按 PyTorch 官方选择器重新选择适合自己电脑的安装命令。

### 4. 脚本中途失败了，可以重跑吗？

可以。脚本设计成可重复运行，已经完成的部分会跳过，只补缺失内容。
