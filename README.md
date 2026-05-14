# Manga Auto Colorizer

Windows 本地漫画阅读与自动上色工具。导入本地漫画后，可以在阅读器里按页查看黑白原图和彩色结果，并导出完整 PDF。

> 当前仅做好 1.0 免费开源初代产品，2.0 会基于真实用户反馈继续开发。

## 普通用户怎么安装

普通用户不需要点击 GitHub 的 `Code` 下载源码。请进入 Release 页面下载发布包：

https://github.com/honsoncn-stack/Manga-Colorizer-/releases

推荐下载顺序：

1. `Manga-Auto-Colorizer-1.0.0-user-kit.zip`：先解压，运行里面的环境配置脚本。
2. `Manga Auto Colorizer Setup 1.0.0.exe`：环境配置完成后安装桌面应用。
3. `SHA256SUMS.txt`：用于校验下载文件。

安装步骤见：[GitHub Release 安装步骤](docs/INSTALL_FROM_GITHUB_RELEASE.md)

安装前建议先看：[系统要求与排查清单](docs/SYSTEM_REQUIREMENTS.md)

## 项目地址

- GitHub: https://github.com/honsoncn-stack/Manga-Colorizer-
- Bug 反馈: https://github.com/honsoncn-stack/Manga-Colorizer-/issues

如果这个项目帮到了你，欢迎点一个 Star。

## 主要功能

- 本地书库：导入图片文件夹、PDF、CBZ。
- 本地阅读器：单页阅读、页码跳转、缩放、黑白/彩色切换。
- 自动上色：支持当前页、后续页、整本书上色。
- 上色队列：查看当前任务、成功页、失败页和运行记录。
- 图库预览：分页查看临时彩图和书库彩页。
- PDF 导出：已上色页使用彩图，未上色页自动用黑白原图补齐。
- 本地隐私：漫画文件、彩图缓存和导出结果都保存在本机。
- 上色模型：基于 `manga-colorization-v2`，感谢原项目开发者。


## 运行环境

当前开发环境默认使用 D 盘路径：

```text
D:\AIProjects\manga-auto-colorizer
D:\CondaEnvs\manga-color-v2
```

桌面端主线：

```text
desktop/electron/   Electron 主进程
desktop/frontend/   React + Vite 前端
desktop/backend/    FastAPI 后端
scripts/            导入、上色、导出、打包和环境脚本
docs/               用户文档和发布说明
```

## 这个仓库怎么用

- 普通用户：只看 Release 和 `docs/INSTALL_FROM_GITHUB_RELEASE.md`。
- 反馈 Bug：去 Issues，优先使用 Bug 反馈模板。
- 开发者：克隆仓库后看 `AGENTS.md`、`docs/REPOSITORY_STRUCTURE.md` 和 `docs/PACKAGING_DESKTOP.md`。
- 不要把本地漫画、模型权重、生成图片、日志或安装包提交到仓库。

## 启动开发版

```powershell
powershell -ExecutionPolicy Bypass -File scripts\launch_desktop_dev.ps1
```

创建开发版桌面快捷方式：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create_dev_desktop_shortcut.ps1
```

## 打包

构建安装包和便携版：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build_desktop_installer.ps1
```

输出目录：

```text
desktop/release/
```

`desktop/release/` 不提交到源码仓库。公开分发时，请把安装包上传到 GitHub Release。

## 使用流程

1. 打开应用。
2. 进入「书库」。
3. 导入图片文件夹、PDF 或 CBZ。
4. 点击「继续阅读」。
5. 在「阅读器」里上色当前页、后续几页或整本书。
6. 点击「导出完整 PDF」。
7. 在「图库」或书籍 `export` 目录中找到导出的 PDF。

导出路径示例：

```text
library/books/<book_id>/export/colorized_book.pdf
```

## 快捷键

阅读器支持：

- `ArrowRight` / `Space`: 下一页
- `ArrowLeft`: 上一页
- `B`: 切换黑白 / 彩色
- `C`: 上色当前页
- 页码输入框里按 `Enter`: 跳转

## Bug 反馈

如果遇到问题：

1. 打开应用里的「记录」页面。
2. 复制相关错误记录。
3. 到 GitHub Issues 提交 Bug：
   https://github.com/honsoncn-stack/Manga-Colorizer-/issues

请不要上传受版权保护的漫画原图、整本 PDF、模型权重或个人隐私文件。

## 文档

- [普通用户使用指南](docs/PUBLIC_USER_GUIDE.md)
- [GitHub Release 安装步骤](docs/INSTALL_FROM_GITHUB_RELEASE.md)
- [系统要求与排查清单](docs/SYSTEM_REQUIREMENTS.md)
- [公开版安装与环境配置](docs/PUBLIC_INSTALLATION.md)
- [1.0 开源发布说明](docs/OPEN_SOURCE_1_0.md)
- [1.0.0 发布说明](docs/RELEASE_NOTES_1.0.0.md)
- [许可证边界说明](LICENSE_NOTICE.md)
- [第三方组件说明](THIRD_PARTY_NOTICES.md)
- [反馈与 2.0 路线](docs/FEEDBACK_AND_ROADMAP.md)
- [仓库结构说明](docs/REPOSITORY_STRUCTURE.md)
- [反馈与贡献](CONTRIBUTING.md)
- [桌面端打包说明](docs/PACKAGING_DESKTOP.md)
- [发布检查清单](docs/RELEASE_CHECKLIST.md)

## 致谢

自动上色能力基于原开源项目 `manga-colorization-v2`：

https://github.com/qweasdd/manga-colorization-v2

感谢原模型开发者的工作。本仓库的桌面阅读器、书库、队列、导出和本地产品化流程在此基础上做了集成。

## 许可证说明

本项目当前按 1.0 免费公开测试版分享。由于上游模型、外部代码和部分依赖存在各自的许可证边界，本仓库暂不把所有内容统一声明为 MIT、Apache 或其他宽松许可证。

Release 用户配置包内置经授权的模型权重；Git 提交只追踪代码和文档，不追踪大体积二进制权重文件。外部模型、第三方代码和依赖遵循各自项目的许可证。发布、二次分发或商业使用前，请先阅读 [LICENSE_NOTICE.md](LICENSE_NOTICE.md) 和 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 开发者

Ray的练琴时光（全平台同名）
