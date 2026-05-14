# 历史目录说明

当前公开主线是 Electron 桌面版：

```text
desktop/electron/
desktop/frontend/
desktop/backend/
scripts/setup_customer_environment.ps1
```

普通用户只需要看 Release 附件和安装说明，不需要运行旧的 Streamlit 入口。

## 仍保留但不是主入口

这些路径是早期自动上色流程、开发记录或兼容入口，保留用于回溯和维护，不作为 1.0 普通用户安装路径：

```text
app/streamlit_app.py
app/ui_helpers.py
configs/
.streamlit/
manga_auto_colorizer_auto_only_docs/
```

如果你只是下载使用软件，请不要从这些目录启动应用。

## 外部模型项目

```text
external/manga-colorization-v2
```

这是原始自动上色模型项目的外部依赖位置。Manga Auto Colorizer 会在本地使用它完成自动上色。

原模型项目：

https://github.com/qweasdd/manga-colorization-v2

感谢原模型开发者的工作与授权支持。
