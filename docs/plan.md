# 当前下一步建议

- P1：关闭 AI Provider debug 模式并实现编辑器局部 AI 的流式传输与中断请求
- 范围：将本地 `.env` 中的 `AI_PROVIDER_DEBUG` 关闭；后端新增 `/api/v1/ai/magic-edit/stream` 与 `/api/v1/ai/translate/stream` 两个 SSE 流式接口，并透传请求取消；前端把“魔法笔 / 中英翻译”改成流式结果预览与显式中断按钮；翻译结果从双语 Markdown 调整为仅保留目标语言译文
- 目标效果：用户在编辑器里提交魔法笔或翻译后，可以实时看到 AI 增量输出，并在生成过程中主动中断；翻译完成后返回可直接替换、插入或复制的纯译文，同时设置页默认不再展示 Provider 调试面板
