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
3. 让你选择：
   - 输入数字：复用扫描到的环境
   - 粘贴路径：使用指定环境
   - 直接回车：使用或创建默认环境 `D:\CondaEnvs\manga-color-v2`
4. 只安装缺失的 Python 包。
5. 如果缺 Torch，会单独询问你是否安装，因为 Torch 体积较大。

## 第 1 步：解压 Release 用户包

把 `Manga-Auto-Colorizer-1.0.0-user-kit.zip` 解压到 D 盘，例如：

```text
D:\MangaAutoColorizerSetup
```

确认里面至少有：

```text
D:\MangaAutoColorizerSetup\setup_customer_environment.ps1
D:\MangaAutoColorizerSetup\manga-auto-colorizer-project.zip
D:\MangaAutoColorizerSetup\weights\generator.zip
D:\MangaAutoColorizerSetup\weights\denoiser.pth
```

## 第 2 步：检查自己有没有可复用环境

如果你知道自己的环境路径，可以先检查 Torch 是否可用。

把下面命令里的路径改成你自己的 `python.exe`：

```powershell
& "D:\CondaEnvs\my-env\python.exe" -c "import torch, torchvision; print('torch', torch.__version__); print('torchvision', torchvision.__version__)"
```

如果能输出版本号，说明这个环境已经有 Torch，不需要重复下载 Torch。

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

打开 PowerShell：

```powershell
cd D:\MangaAutoColorizerSetup
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

脚本会出现类似提示：

```text
==> Choosing Python/Torch environment
Detected environments:
  [1] D:\CondaEnvs\manga-color-v2  -  ready: app deps + Torch
  [2] D:\CondaEnvs\my-env          -  Torch ready; missing app deps: fastapi, fitz

Type a number to reuse one of the environments above.
Or paste a D: drive environment folder / python.exe path.
Press Enter to use or create the default environment.
Choose environment:
```

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

如果提示 Torch 已经可用，脚本会显示：

```text
[OK] Torch and torchvision are already available. Torch download will be skipped.
```

这时不会重复下载 Torch。

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
Install missing Torch packages automatically? This can download 1GB+ data. [Y/n]
```

输入：

```text
n
```

这样可以先完成其他配置。应用可以打开和阅读，但自动上色可能不可用。之后你可以手动装 Torch，再重新运行脚本检查。

## 第 5 步：手动指定环境的命令写法

如果你已经确定要用哪个环境，也可以直接写在命令里：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaEnvPath D:\CondaEnvs\my-env
```

如果你确定暂时不装 Torch：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaEnvPath D:\CondaEnvs\my-env -SkipTorchInstall
```

如果你确定 Python 包也不让脚本安装：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaEnvPath D:\CondaEnvs\my-env -SkipPythonPackages -SkipTorchInstall
```

## 脚本会跳过哪些已经存在的东西

脚本可以重复运行。已存在的内容会尽量跳过：

- 项目源码已经在 `D:\AIProjects\manga-auto-colorizer`：跳过重新解压或克隆。
- 原模型仓库已经有 `inference.py`：跳过重新下载模型仓库。
- 权重已经存在：跳过复制权重。
- 桌面应用已经安装：跳过复制应用，只补桌面快捷方式。
- Python 包已经能导入：跳过对应包安装。
- `torch` 和 `torchvision` 已经能导入：跳过 Torch 安装。

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

不会折腾环境的新手可以先用 CPU。CPU 慢一些，但更容易装。

有 NVIDIA 显卡并且熟悉 CUDA 的用户，可以按 PyTorch 官方选择器安装对应 CUDA 版本。

### 4. 脚本中途失败了，可以重跑吗？

可以。脚本设计成可重复运行，已经完成的部分会跳过，只补缺失内容。
