# Manga Auto Colorization Pipeline

- 输入支持图片文件夹或 PDF
- PDF 先拆页，再预处理
- 自动上色仅调用 `external/manga-colorization-v2`
- 上色后执行线稿保护
- 最后执行质量检查和 PDF 导出
- 当前版本不做 reference 模式
