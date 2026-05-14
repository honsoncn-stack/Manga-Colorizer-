# 公开版安装与环境配置

## 推荐方式：从 GitHub Release 自助安装

普通用户建议优先从 GitHub Release 下载：

- `Manga-Auto-Colorizer-1.0.0-user-kit.zip`
- `Manga Auto Colorizer Setup 1.0.0.exe`
- `SHA256SUMS.txt`

推荐流程：

安装前建议确认 Windows 10/11 64 位、D 盘至少 20 GB 可用空间，并保持网络稳定。完整清单见 `docs/SYSTEM_REQUIREMENTS.md`。

1. 解压 `Manga-Auto-Colorizer-1.0.0-user-kit.zip` 到 D 盘任意目录，例如：

```text
D:\MangaAutoColorizerSetup
```

2. `user-kit.zip` 已包含上色所需权重文件：

```text
D:\MangaAutoColorizerSetup\weights\generator.zip
D:\MangaAutoColorizerSetup\weights\denoiser.pth
```

如果你手动替换过配置包，确认 `weights` 文件夹里仍然保留这两个文件后再运行脚本。

3. 如果电脑没有 Miniconda 或 Anaconda，请下载 `Miniconda3-latest-Windows-x86_64.exe`，放到 `D:\MangaAutoColorizerSetup`。文件名略有差异也可以，只要是 `Miniconda3...Windows...x86_64.exe`。

4. 在解压目录运行环境配置脚本：

```powershell
cd D:\MangaAutoColorizerSetup
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

脚本可以重复运行。它会先检查 Conda、项目目录、模型仓库、模型权重和桌面程序；已经准备好的部分会跳过，只补齐缺失的文件或环境。

脚本启动时会询问是否使用已有 Conda/Python 环境。如果你已经在某个 D 盘环境里装好了 `torch` 和 `torchvision`，可以直接粘贴该环境的 `python.exe` 路径或环境目录；直接回车则使用默认环境。

也可以在提示里粘贴完整命令中的环境参数，例如：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaEnvPath D:\CondaEnvs\my-env
```

脚本会准备默认 D 盘路径：

```text
D:\AIProjects\manga-auto-colorizer
D:\CondaEnvs\manga-color-v2
D:\AICache
D:\Temp
```

5. 运行 `Manga Auto Colorizer Setup 1.0.0.exe`。

安装目录建议选择：

```text
D:\Programs\Manga Auto Colorizer
```

6. 从桌面快捷方式启动 `Manga Auto Colorizer`。

源码仓库不会提交安装包。安装包文件应放在 GitHub Release，而不是放进 Git。

## 源码运行方式

当前源码默认使用 D 盘路径：

```text
D:\AIProjects\manga-auto-colorizer
D:\CondaEnvs\manga-color-v2
```

启动开发版：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_dev.ps1
```

创建开发版桌面快捷方式：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create_dev_desktop_shortcut.ps1
```

## 客户/用户环境配置脚本

环境配置脚本入口：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_customer_environment.ps1
```

不需要交互提示时可以使用：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_customer_environment.ps1 -NonInteractive
```

这个脚本可以检查或准备：

- D 盘项目目录。
- Conda 环境。
- Python 包。
- 外部上色模型仓库。
- 模型权重位置。
- 安装包运行所需的本地路径。

如果脚本找不到本地项目包，会尝试从 GitHub 克隆本项目。如果找不到 `manga-colorization-v2`，会尝试从 GitHub 克隆或下载上游仓库。

## 手动安装方式

不想运行配置脚本，或者已经有 Conda / Torch 环境的用户，可以只补缺失项。完整步骤见：

```text
docs/MANUAL_INSTALLATION.md
```

常用链接：

- Miniconda：https://www.anaconda.com/docs/getting-started/miniconda/install
- Git for Windows：https://git-scm.com/downloads/win
- PyTorch：https://pytorch.org/get-started/locally/
- Visual C++ Redistributable：https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist
- 原模型项目：https://github.com/qweasdd/manga-colorization-v2

## 模型权重

GitHub Release 的用户配置包内置经授权的权重文件，方便普通用户直接配置。Git 提交只追踪代码和文档，不追踪大体积二进制权重文件。

不要把这些文件提交到 Git：

- `*.pth`
- `*.pt`
- `*.ckpt`
- `*.safetensors`
- `*.onnx`
- `*.pkl`
- `external/manga-colorization-v2/networks/archive/`

## 原模型项目致谢

自动上色模型来自 `manga-colorization-v2`：

https://github.com/qweasdd/manga-colorization-v2

感谢原模型开发者的工作与授权支持。

## 打包

构建安装包和便携版：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build_desktop_installer.ps1
```

输出目录：

```text
desktop/release/
```

`desktop/release/` 不提交到 Git。需要公开发布时，把安装包上传到 GitHub Release。
