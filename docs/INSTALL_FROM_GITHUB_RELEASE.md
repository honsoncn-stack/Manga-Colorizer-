# Manga Auto Colorizer 1.0.0

这是 Manga Auto Colorizer 的第一个公开测试版本。推荐用户通过 GitHub Release 自助完成：下载环境配置包，运行脚本准备 D 盘环境，再运行安装包启动桌面应用。

普通用户不要点击仓库首页的 `Code` 下载源码。请下载下面的 Release 附件。

## 系统要求

- Windows 10 或 Windows 11，64 位系统。
- 建议有 D 盘，且至少 20 GB 可用空间。
- 首次配置需要稳定网络。
- 电脑需要 Conda；如果没有，下载 `Miniconda3-latest-Windows-x86_64.exe` 放到 `user-kit` 解压后包含 `setup_customer_environment.ps1` 的目录，脚本会自动安装。
- CPU 可以运行；NVIDIA GPU 会更快，但需要 CUDA 版 PyTorch。当前 1.0 Release 脚本只正式支持 NVIDIA CUDA 加速，AMD / Intel 显卡默认走 CPU 模式。

完整排查清单见 `SYSTEM_REQUIREMENTS.md` 或仓库里的 `docs/SYSTEM_REQUIREMENTS.md`。

## 推荐下载顺序

1. `Manga-Auto-Colorizer-1.0.0-user-kit.zip`：环境配置包，已包含项目源码、配置脚本和经授权的模型权重。
2. `Manga Auto Colorizer Setup 1.0.0.exe`：桌面安装包，环境脚本跑完后安装。
3. `SHA256SUMS.txt`：校验文件。

可选：

- `Manga Auto Colorizer 1.0.0.exe`：便携版，不推荐普通用户优先使用。

## 安装流程

1. 解压 `Manga-Auto-Colorizer-1.0.0-user-kit.zip` 到 D 盘，例如 `D:\MangaAutoColorizerSetup`。
2. 进入解压后的 `user-kit-1.0.0` 文件夹。按推荐方式解压时，实际脚本目录是 `D:\MangaAutoColorizerSetup\user-kit-1.0.0`。
3. 确认这个目录里有 `setup_customer_environment.ps1`，并且有 `weights\generator.zip` 和 `weights\denoiser.pth`。
4. 如果电脑没有 Miniconda 或 Anaconda，请从 Miniconda 官网下载 `Miniconda3-latest-Windows-x86_64.exe`，放到 `D:\MangaAutoColorizerSetup\user-kit-1.0.0`。文件名略有差异也可以，只要是 `Miniconda3...Windows...x86_64.exe`。
5. 打开 PowerShell，运行：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

如果 PowerShell 提示 `.\setup_customer_environment.ps1` 不存在，说明当前目录不对。请先进入包含 `setup_customer_environment.ps1` 的文件夹，再运行命令。

如果你已经有 Conda / Python / Torch 环境，建议先用体检模式看脚本会识别到什么。体检模式不会下载或安装任何东西：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -PlanOnly
```

这个脚本可以重复运行。它会先检查已有环境，已经存在的 Conda、项目文件、模型仓库、模型权重和桌面程序会跳过，只补齐缺失的部分。

脚本启动时会扫描 D 盘常见 Conda 环境，并询问是否复用已有 Conda/Python 环境。如果你已经在某个 D 盘环境里装好了 `torch` 和 `torchvision`，可以输入扫描列表里的数字，也可以直接粘贴该环境的 `python.exe` 路径或环境目录；直接回车则使用默认环境 `D:\CondaEnvs\manga-color-v2`。

脚本会检查缺哪些包，尽量只安装缺失项。如果 `torch` 和 `torchvision` 已经能导入，脚本还会检查它是不是 CUDA 可用版本。NVIDIA 电脑如果检测到 CPU-only Torch，会提示是否重装 CUDA 版。已有环境用户建议先看：

```text
docs/ENV_REUSE_GUIDE.md
```

正式安装前，脚本会再显示一次安装计划确认。确认无误再继续；如果发现选错环境，输入 `n` 停止，不会继续下载。

提示出现时也可以粘贴完整命令里的环境参数，例如：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaEnvPath D:\CondaEnvs\my-env
```

5. 运行 `Manga Auto Colorizer Setup 1.0.0.exe`。
6. 安装目录建议选择 `D:\Programs\Manga Auto Colorizer`。
7. 从桌面快捷方式启动 `Manga Auto Colorizer`。

如果 Miniconda 安装器不在解压目录，也可以手动指定：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaInstaller D:\Downloads\Miniconda3-latest-Windows-x86_64.exe
```

如果你想在无人值守或批处理里运行，不想出现交互提示，可以加：

```powershell
cd D:\MangaAutoColorizerSetup\user-kit-1.0.0
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -NonInteractive
```

## 手动安装（不使用脚本）

如果你已经配置过 Conda、Python 或 Torch，也可以不运行配置脚本，按手动方式只补缺失项：

1. 下载并解压 `Manga-Auto-Colorizer-1.0.0-user-kit.zip`。
2. 准备 `D:\AIProjects\manga-auto-colorizer` 项目目录。
3. 准备 `D:\CondaEnvs\manga-color-v2` 或你自己的 Conda 环境。
4. 安装缺失的 Python 依赖。
5. 如果 `torch` 和 `torchvision` 已经能导入，还要确认 `torch.cuda.is_available()` 是否为 `True`。如果是 `False`，说明当前仍是 CPU 上色。
6. 把 `weights\generator.zip` 和 `weights\denoiser.pth` 放到指定模型目录。
7. 再运行桌面安装包。

完整手动教程见：

```text
docs/MANUAL_INSTALLATION.md
```

如果只是想复用已有环境，但仍希望脚本帮你补缺失项，请优先看：

```text
docs/ENV_REUSE_GUIDE.md
```

常用官方链接：

- Miniconda：https://www.anaconda.com/docs/getting-started/miniconda/install
- Git for Windows：https://git-scm.com/downloads/win
- PyTorch：https://pytorch.org/get-started/locally/
- Visual C++ Redistributable：https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist
- 原模型项目：https://github.com/qweasdd/manga-colorization-v2

## 模型与致谢

自动上色模型来自 `manga-colorization-v2`：
https://github.com/qweasdd/manga-colorization-v2

感谢原模型开发者的工作与授权支持。本 Release 的 `user-kit.zip` 已内置 `generator.zip` 和 `denoiser.pth`，并会由配置脚本安装到本地项目目录。

## 包含功能

- 本地书库导入：图片文件夹、PDF、CBZ
- 本地阅读器：双页翻页、缩放、黑白/彩色切换、快捷键
- 自动上色：当前跨页、后续跨页、整本书
- 上色队列和运行记录
- 分页图库预览
- 完整 PDF 导出：已上色页使用彩图，未上色页用黑白原图补齐

## 不包含

- 不包含 Conda 环境
- 不包含用户漫画、生成彩图、导出 PDF、日志或报告
- 不包含 reference 模式、MangaNinjia、ComfyUI_MangaNinjia 或浏览器插件

## 文档

- 系统要求：`docs/SYSTEM_REQUIREMENTS.md`
- GitHub Release 安装步骤：`docs/INSTALL_FROM_GITHUB_RELEASE.md`
- 已有环境复用教程：`docs/ENV_REUSE_GUIDE.md`
- 手动安装教程：`docs/MANUAL_INSTALLATION.md`
- 使用指南：`docs/PUBLIC_USER_GUIDE.md`
- 安装与环境：`docs/PUBLIC_INSTALLATION.md`
- 许可证边界：`LICENSE_NOTICE.md`
- 第三方组件说明：`THIRD_PARTY_NOTICES.md`

## 反馈

Bug 反馈入口：
https://github.com/honsoncn-stack/Manga-Colorizer-/issues

反馈时请包含应用版本、Windows 版本、问题页面、复现步骤、实际结果、期望结果和「记录」页面的相关日志。

请不要上传受版权保护的完整漫画、完整 PDF、模型权重或个人隐私文件。

开发者：Ray的练琴时光（全平台同名）
