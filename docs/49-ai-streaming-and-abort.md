# 49. 编辑器局部 AI 流式传输与中断请求

## 本次任务做了什么

本轮围绕编辑器局部 AI 体验做了两类收口：

1. 关闭本地运行环境中的 `AI_PROVIDER_DEBUG`，让设置页测试接口恢复默认无调试面板模式。
2. 为“魔法笔”和“中英翻译”新增流式返回与主动中断能力，并把翻译结果从双语 Markdown 调整为仅保留目标语言译文。

## 涉及的文件清单

- 服务端
  - `server/internal/dto/ai_dto.go`
  - `server/internal/handler/ai_handler.go`
  - `server/internal/handler/router.go`
  - `server/internal/service/ai_provider_client.go`
  - `server/internal/service/ai_provider_client_test.go`
  - `server/internal/service/ai_service.go`
  - `server/internal/util/ai_provider.go`
- 前端
  - `web/src/api/ai.ts`
  - `web/src/api/client.ts`
  - `web/src/types/ai.ts`
  - `web/src/features/editor/useEditorSelectionAI.ts`
  - `web/src/features/editor/components/EditorWorkspace.tsx`
  - `web/src/features/editor/components/EditorMagicEditDialog.tsx`
  - `web/src/features/editor/components/EditorTranslateDialog.tsx`
- 文档与配置
  - `.env`
  - `docs/api.md`
  - `docs/plan.md`
  - `docs/project-highlights.md`

## 核心设计决策和原因

### 1. 统一使用 SSE 承载流式结果

- 服务端新增 `/api/v1/ai/magic-edit/stream` 与 `/api/v1/ai/translate/stream`。
- 事件统一收敛为 `chunk / done / error` 三种，前端无需感知 Provider 原始流格式。

原因：

- OpenAI Compatible 的原始流式响应本质也是 SSE，直接在服务端收口事件语义，前端消费会更稳定。
- 这样后续如果接不同 Provider，只要服务端维持统一事件协议，前端就不用反复改。

### 2. 翻译链路改成“纯译文输出”

- 同步翻译和流式翻译都不再要求模型输出 JSON 结构，也不再组装双语 Markdown。
- 模型现在只需要返回“保留 Markdown 结构的最终译文”。

原因：

- 用户在编辑器里已经天然保有原文选区，没有必要把原文再重复拼进结果。
- 纯文本译文更适合流式展示，也避免了“边流式边凑结构化 JSON”的兼容性问题。

### 3. 中断能力做成端到端透传

- 前端通过 `AbortController` 取消 `fetch`。
- 服务端流式接口直接使用 `ctx.Request.Context()` 调上游 Provider；浏览器断开后，上游请求会一起取消。

原因：

- 只有前端停、后端不停，会白白消耗上游额度和服务端连接。
- 端到端取消后，才能把“中断生成”真正做成工程上闭环的能力，而不是只停本地 UI。

## 前端组件结构和数据流

- `useEditorSelectionAI` 统一管理：
  - 选区快照
  - 魔法笔/翻译弹窗开关
  - 流式状态（`idle / streaming / completed / aborted`）
  - `AbortController`
  - 增量结果拼接与最终写回
- `web/src/api/client.ts`
  - 新增 `fetchWithAuth`
  - 为流式 `fetch` 请求补齐 Access Token 与 401 自动刷新
- `web/src/api/ai.ts`
  - 新增流式请求封装
  - 按 SSE 事件解析 `chunk / done / error`
- 两个对话框组件根据状态切换底部按钮：
  - 未开始：开始处理 / 开始翻译
  - 生成中：中断生成
  - 已完成：复制 / 插入 / 替换

## 后端接口流程和数据库操作

- 本轮不涉及数据库结构变更。
- AI 流式接口流程：
  1. Handler 读取鉴权用户与请求体
  2. Service 校验文档归属与 AI 配置
  3. `ai_provider_client` 以 `stream=true` 请求 OpenAI Compatible `chat/completions`
  4. 服务端把上游增量内容转成统一 SSE 事件写回前端
  5. 请求被前端取消时，Gin 上下文会取消上游请求

## 已知 TODO / 待改进项

- 当前流式实现仍然依赖 OpenAI Compatible 的 `chat/completions` 流式格式；如果后续要兼容 `responses` 风格 Provider，需要再扩一层服务端适配。
- 对话框当前在中断后会保留未完成结果供用户参考，但不会允许直接写回；如果后续要支持“强制使用半成品”，需要额外的风险提示设计。
