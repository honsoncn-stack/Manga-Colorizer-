# Streamlit UI Integration

- 仅保留 auto-only 流程
- 删除 reference 模式 UI
- 删除参考图目录输入
- 使用 `subprocess.Popen` 启动流水线，避免界面长时间无响应
- 从 `logs/pipeline.log` 和 `logs/error.log` 读取尾部日志
