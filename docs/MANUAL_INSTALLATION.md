# 手动安装教程（不使用配置脚本）

这个教程适合已经配置过部分 Python / Conda / Torch 环境，或者不想运行 `setup_customer_environment.ps1` 的用户。手动安装需要你自己确认每一步是否已经完成；已经有的东西不用重复安装。

## 需要下载的文件和链接

从本项目 Release 下载：

- `Manga-Auto-Colorizer-1.0.0-user-kit.zip`
- `Manga Auto Colorizer Setup 1.0.0.exe`
- `SHA256SUMS.txt`

官方环境链接：

- Miniconda 安装说明：https://www.anaconda.com/docs/getting-started/miniconda/install
- Git for Windows：https://git-scm.com/downloads/win
- PyTorch 安装选择器：https://pytorch.org/get-started/locally/
- Visual C++ Redistributable（遇到 DLL 报错时再装）：https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist
- 原上色模型项目：https://github.com/qweasdd/manga-colorization-v2

## 目标路径

默认路径如下。已经有同等环境的用户可以用自己的路径，但要保证应用能找到项目和 Python 环境。

```text
D:\AIProjects\manga-auto-colorizer
D:\CondaEnvs\manga-color-v2
D:\Programs\Manga Auto Colorizer
```

## 1. 解压用户配置包

把 `Manga-Auto-Colorizer-1.0.0-user-kit.zip` 解压到：

```text
D:\MangaAutoColorizerSetup
```

确认里面有这些文件：

```text
D:\MangaAutoColorizerSetup\manga-auto-colorizer-project.zip
D:\MangaAutoColorizerSetup\weights\generator.zip
D:\MangaAutoColorizerSetup\weights\denoiser.pth
```

## 2. 准备项目源码

方式 A：使用 Release 包里的项目压缩包。

```powershell
New-Item -ItemType Directory -Path D:\AIProjects -Force
Expand-Archive -LiteralPath D:\MangaAutoColorizerSetup\manga-auto-colorizer-project.zip -DestinationPath D:\AIProjects -Force
```

方式 B：使用 Git 克隆公开仓库。

```powershell
New-Item -ItemType Directory -Path D:\AIProjects -Force
git clone https://github.com/honsoncn-stack/Manga-Colorizer-.git D:\AIProjects\manga-auto-colorizer
```

## 3. 准备原模型仓库

如果目标目录里已经有 `inference.py`，这一步可以跳过。

```powershell
New-Item -ItemType Directory -Path D:\AIProjects\manga-auto-colorizer\external -Force
git clone --depth 1 https://github.com/qweasdd/manga-colorization-v2.git D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2
```

没有 Git 时，也可以从原项目页面下载 zip，解压后确保这个文件存在：

```text
D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\inference.py
```

## 4. 准备 Conda / Python 环境

如果已经有可用 Conda，可以直接用已有的 `conda.exe`。没有 Conda 时，先从 Miniconda 官方链接下载安装。

创建默认环境：

```powershell
D:\Miniconda3\Scripts\conda.exe create -y -p D:\CondaEnvs\manga-color-v2 python=3.10
```

如果你已经有自己的环境，把下面命令里的 `$py` 改成已有环境的 `python.exe` 路径即可。

```powershell
$py = "D:\CondaEnvs\manga-color-v2\python.exe"
```

如果改用配置脚本，脚本启动时也会让你输入已有环境路径。可以输入环境目录：

```text
D:\CondaEnvs\my-env
```

也可以输入该环境的 `python.exe`：

```text
D:\CondaEnvs\my-env\python.exe
```

如果你已经知道命令，也可以在脚本提示里粘贴这一整段，脚本会识别 `-CondaEnvPath` 后面的路径：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaEnvPath D:\CondaEnvs\my-env
```

## 5. 安装普通 Python 依赖

```powershell
& $py -m pip install --upgrade pip
& $py -m pip install -r D:\AIProjects\manga-auto-colorizer\requirements-app.txt
& $py -m pip install fastapi uvicorn pymupdf pyyaml pillow opencv-python matplotlib numpy scikit-image
```

## 6. 检查或安装 Torch

先检查是否已经装好：

```powershell
& $py -c "import torch, torchvision; print(torch.__version__); print(torchvision.__version__)"
```

如果这条命令能输出版本号，就不要重复安装 Torch。

如果失败，去 PyTorch 官方安装选择器选择适合自己电脑的命令：

https://pytorch.org/get-started/locally/

CPU 版通常可以先尝试：

```powershell
& $py -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

NVIDIA GPU 用户请以 PyTorch 官方选择器生成的 CUDA 命令为准。

## 7. 放置模型权重

创建目标目录：

```powershell
New-Item -ItemType Directory -Path D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\networks -Force
New-Item -ItemType Directory -Path D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\denoising\models -Force
New-Item -ItemType Directory -Path D:\AIProjects\manga-auto-colorizer\models\downloads -Force
```

复制权重：

```powershell
Copy-Item D:\MangaAutoColorizerSetup\weights\generator.zip D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\networks\generator.zip -Force
Copy-Item D:\MangaAutoColorizerSetup\weights\denoiser.pth D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\denoising\models\net_rgb.pth -Force
Copy-Item D:\MangaAutoColorizerSetup\weights\generator.zip D:\AIProjects\manga-auto-colorizer\models\downloads\generator.zip -Force
Copy-Item D:\MangaAutoColorizerSetup\weights\denoiser.pth D:\AIProjects\manga-auto-colorizer\models\downloads\denoiser.pth -Force
```

## 8. 检查环境

```powershell
& $py D:\AIProjects\manga-auto-colorizer\scripts\check_env.py
& $py D:\AIProjects\manga-auto-colorizer\scripts\doctor.py
```

如果这两条能正常完成，再安装桌面应用。

## 9. 安装桌面应用

运行：

```text
Manga Auto Colorizer Setup 1.0.0.exe
```

建议安装到：

```text
D:\Programs\Manga Auto Colorizer
```

安装完成后，从桌面快捷方式启动 `Manga Auto Colorizer`。

## 10. 已有环境用户的最低检查清单

如果你已经装过大部分环境，只需要确认这些文件和命令可用：

```text
D:\AIProjects\manga-auto-colorizer\desktop\backend\server.py
D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\inference.py
D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\networks\generator.zip
D:\AIProjects\manga-auto-colorizer\external\manga-colorization-v2\denoising\models\net_rgb.pth
```

```powershell
& $py -c "import fastapi, uvicorn, fitz, yaml, PIL, cv2, matplotlib, numpy, skimage, torch, torchvision; print('env ok')"
```

如果检查失败，缺哪个包就只安装哪个包。
