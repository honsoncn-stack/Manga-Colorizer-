# 系统要求与排查清单

这份清单给普通用户安装和排查问题时使用。

## 推荐系统

- Windows 10 或 Windows 11，64 位系统。
- 建议使用 D 盘安装和运行。
- 建议至少 20 GB 可用空间。
- 首次配置需要稳定网络，用于安装 Python 依赖、Conda 环境和必要组件。
- 可以使用 CPU 运行；有 NVIDIA GPU 会更快，但不是必须。

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
4. 网络是否能访问 GitHub 和 Python/npm 下载源。
5. PowerShell 是否能正常打开。
6. 杀毒软件或 Windows Defender 是否拦截了脚本、安装包或下载文件。

## 常见问题

### PowerShell 提示不允许运行脚本

请使用安装说明中的命令：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

### 提示找不到 D 盘

当前 1.0 默认按 D 盘路径配置。请先确认电脑存在 D 盘，并且空间足够。

### 下载依赖失败

通常是网络问题。可以稍后重试，或确认电脑能访问 GitHub、Python 包下载源和 npm 下载源。

### 安装很慢

第一次配置会创建 Conda 环境并安装 Python 包，耗时取决于网络、CPU 和硬盘速度。CPU 电脑也能运行，但上色速度会比 GPU 慢。

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
