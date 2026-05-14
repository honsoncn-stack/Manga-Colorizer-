# GitHub Release 安装步骤

面向普通用户的推荐安装方式是：先运行环境配置脚本，再运行桌面安装包。

普通用户不要点击 GitHub 仓库首页的 `Code` 按钮下载源码包。请从 Release 页面下载下面这些文件：

https://github.com/honsoncn-stack/Manga-Colorizer-/releases

## 需要下载

从 GitHub Release 下载：

- `Manga-Auto-Colorizer-1.0.0-user-kit.zip`
- `Manga Auto Colorizer Setup 1.0.0.exe`
- `SHA256SUMS.txt`

## 安装步骤

1. 解压 `Manga-Auto-Colorizer-1.0.0-user-kit.zip` 到 D 盘，例如：

```text
D:\MangaAutoColorizerSetup
```

2. 如果已有模型权重，把它们放到：

```text
D:\MangaAutoColorizerSetup\weights\generator.zip
D:\MangaAutoColorizerSetup\weights\denoiser.pth
```

没有权重时，应用可以打开和阅读，但不能正常上色。之后把权重放进去，再重新运行脚本即可。

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
