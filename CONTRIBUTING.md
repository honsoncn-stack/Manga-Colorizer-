# 反馈与贡献

感谢使用 `Manga Auto Colorizer`。

当前阶段最需要的是 1.0 使用反馈：安装、导入、阅读、上色、导出 PDF、图库和日志相关问题。

## 反馈 Bug

请在 GitHub Issues 提交：

https://github.com/honsoncn-stack/Manga-Colorizer-/issues

建议使用 `Bug 反馈` 模板，并填写：

- 应用版本或提交号。
- 问题出现在哪个页面。
- 复现步骤。
- 期望结果。
- 实际结果。
- 应用「记录」页面里的相关日志。

## 提功能建议

请使用 `功能建议` 模板。2.0 会优先参考真实使用场景和高频痛点。

## 不要上传这些内容

请不要在 Issue、Pull Request 或仓库中上传：

- 受版权保护的漫画原图、整本 PDF、CBZ。
- 模型权重。
- 用户本地书库缓存。
- 生成的彩图、导出 PDF、日志、报告。
- 个人隐私路径、账号信息或密钥。

## 当前项目边界

当前版本保持：

- 本地阅读。
- 自动上色。
- 无 reference 模式。
- 不接 MangaNinjia。
- 不接 ComfyUI_MangaNinjia。
- 不做浏览器插件。

## 开发建议

如果提交代码：

- 保持 Electron 桌面端为主线。
- 前端页面放在 `desktop/frontend/src/pages`。
- 前端组件放在 `desktop/frontend/src/components`。
- 后端接口放在 `desktop/backend/server.py`。
- 不要提交 `node_modules`、`dist`、`release`、`library/books`、`input`、`output`、`models`、`logs`、`reports`。
- 修改后至少运行 `npm run build`。
