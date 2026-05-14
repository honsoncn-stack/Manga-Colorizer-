# Manga Auto Colorizer 1.0 开源发布说明

`Manga Auto Colorizer 1.0` 的目标是先提供一个可用、可反馈、可持续迭代的本地漫画阅读和自动上色工具。

## 1.0 定位

- 免费分享给普通用户试用。
- 本地导入、本地阅读、本地上色、本地导出。
- 支持图片文件夹、PDF、CBZ。
- 已上色页面会保存到本地书库。
- 导出完整 PDF 时，已上色页使用彩图，未上色页用黑白原图补齐。
- GitHub Issues 作为 Bug 反馈窗口。

## 1.0 不包含

- 不包含模型权重。
- 不包含 Conda 环境。
- 不包含用户导入的漫画、PDF、CBZ。
- 不包含生成的彩图、导出 PDF、日志和报告。
- 不包含安装包源码仓库内提交；安装包应放在 GitHub Release。
- 不做 reference 模式。
- 不接 MangaNinjia 或 ComfyUI_MangaNinjia。
- 不做浏览器插件。

## 仓库中应该包含

- Electron / React 前端代码。
- FastAPI 后端代码。
- 本地书库管理脚本。
- 环境配置脚本。
- 打包脚本。
- README、用户指南、安装说明、反馈说明。
- GitHub Issue 模板。

## 仓库中不应该包含

- `library/books/`
- `library/library_index.json`
- `input/`
- `output/`
- `models/`
- `logs/`
- `reports/`
- `node_modules/`
- `dist/`
- `build/`
- `release/`
- `desktop/release/`
- `*.exe`
- `*.msi`
- `*.pth`
- `*.pt`
- `*.ckpt`
- `*.safetensors`
- `*.onnx`
- `*.pkl`

## 用户反馈流程

1. 用户在应用「记录」页面复制错误记录。
2. 打开 GitHub Issues。
3. 选择 `Bug 反馈` 模板。
4. 填写应用版本、问题区域、复现步骤、实际结果和日志。
5. 提交后按优先级修复。

## 2.0 方向

2.0 不应该急着重写 1.0，而应该基于用户反馈逐步做：

- 更完整的产品化 UI。
- 更好的任务队列和批量管理。
- 更强的图库性能。
- 更完善的安装和更新体验。
- 更清晰的新手教程。
- 更多可配置阅读体验。

是否引入 Tailwind、shadcn/ui、Framer Motion 或虚拟列表，应基于 1.0 用户反馈和性能数据决定。
