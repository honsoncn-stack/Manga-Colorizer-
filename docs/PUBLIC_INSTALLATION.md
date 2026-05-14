# 公开版安装与环境配置

## 推荐方式：下载 Release

普通用户建议优先下载 GitHub Release 中的安装包或便携版。

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
- 前端依赖。
- 外部上色模型仓库。
- 模型权重位置。
- 桌面快捷方式。

## 模型权重

源码仓库不提供模型权重。用户需要按项目说明自行准备权重文件。

不要把这些文件提交到 Git：

- `*.pth`
- `*.pt`
- `*.ckpt`
- `*.safetensors`
- `*.onnx`
- `*.pkl`
- `external/manga-colorization-v2/networks/archive/`

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
