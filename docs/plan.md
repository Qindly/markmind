# 当前下一步建议

- P1：补齐 AI Provider 模型列表拉取与 `chat/completions` / `responses` 自动兼容
- 范围：设置页新增模型列表拉取接口与候选选择交互；服务端统一探测并兼容 `chat/completions`、`responses` 两种 OpenAI Compatible 文本生成协议；测试连接结果补充实际命中的 `api_style`；正文 AI 同步复用该兼容层
- 目标效果：用户可以先从 Provider 拉取模型列表再填写模型名；即使供应商只支持 `responses` 或只支持 `chat/completions`，设置页测试连接、魔法笔、翻译、流式输出与中断能力也都能继续正常工作
