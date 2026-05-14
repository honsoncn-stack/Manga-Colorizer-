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

3. 在解压目录运行环境配置脚本：

```powershell
cd D:\MangaAutoColorizerSetup
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1
```

脚本会准备默认 D 盘路径：

```text
D:\AIProjects\manga-auto-colorizer
D:\CondaEnvs\manga-color-v2
D:\AICache
D:\Temp
```

4. 运行 `Manga Auto Colorizer Setup 1.0.0.exe`。

安装目录建议选择：

```text
D:\Programs\Manga Auto Colorizer
```

5. 从桌面快捷方式启动 `Manga Auto Colorizer`。

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

这个脚本可以检查或准备：

- D 盘项目目录。
- Conda 环境。
- Python 包。
- 外部上色模型仓库。
- 模型权重位置。
- 安装包运行所需的本地路径。

如果脚本找不到本地项目包，会尝试从 GitHub 克隆本项目。如果找不到 `manga-colorization-v2`，会尝试从 GitHub 克隆或下载上游仓库。

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
