# GitHub Release 安装步骤

面向普通用户的推荐安装方式是：先运行环境配置脚本，再运行桌面安装包。

普通用户不要点击 GitHub 仓库首页的 `Code` 按钮下载源码包。请从 Release 页面下载下面这些文件：

https://github.com/honsoncn-stack/Manga-Colorizer-/releases

## 需要下载

从 GitHub Release 下载：

- `Manga-Auto-Colorizer-1.0.0-user-kit.zip`
- `Manga Auto Colorizer Setup 1.0.0.exe`
- `SHA256SUMS.txt`

安装前建议先确认：

- Windows 10 或 Windows 11，64 位系统。
- 有 D 盘，且建议至少 20 GB 可用空间。
- 首次配置需要稳定网络。
- CPU 可以运行；NVIDIA GPU 会更快，但不是必须。

完整清单见：`docs/SYSTEM_REQUIREMENTS.md`

## 安装步骤

1. 解压 `Manga-Auto-Colorizer-1.0.0-user-kit.zip` 到 D 盘，例如：

```text
D:\MangaAutoColorizerSetup
```

2. `user-kit.zip` 已包含上色所需权重文件：

```text
D:\MangaAutoColorizerSetup\weights\generator.zip
D:\MangaAutoColorizerSetup\weights\denoiser.pth
```

如果你手动替换过配置包，确认 `weights` 文件夹里仍然保留这两个文件后再运行脚本。

3. 打开 PowerShell，运行：

```powershell
cd D:\MangaAutoColorizerSetup
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

脚本会准备：

```text
D:\AIProjects\manga-auto-colorizer
D:\CondaEnvs\manga-color-v2
D:\AICache
D:\Temp
```

4. 运行安装包：

```text
Manga Auto Colorizer Setup 1.0.0.exe
```

安装目录建议选择：

```text
D:\Programs\Manga Auto Colorizer
```

5. 双击桌面快捷方式 `Manga Auto Colorizer` 启动。

## 反馈 Bug

GitHub Issues:

https://github.com/honsoncn-stack/Manga-Colorizer-/issues

反馈时请包含应用版本、Windows 版本、问题页面、复现步骤、实际结果、期望结果和应用「记录」页面里的相关日志。

请不要上传受版权保护的完整漫画、完整 PDF、模型权重或个人隐私文件。

## 致谢

自动上色模型来自 `manga-colorization-v2`：

https://github.com/qweasdd/manga-colorization-v2

感谢原模型开发者的工作与授权支持。
