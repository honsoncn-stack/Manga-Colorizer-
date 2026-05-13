# Error Debugging

- 不要伪造成功结果
- 失败后先看 `logs/error.log`
- 再看 `logs/pipeline.log`
- 如果是环境问题，先用 `scripts/check_env.py` 和 `scripts/doctor.py`
- 如果是第三方模型问题，先确认 repo、权重、依赖和 Python 路径
