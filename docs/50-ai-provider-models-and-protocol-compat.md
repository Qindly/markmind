# 50. AI Provider 模型列表拉取与协议自动兼容

## 本次任务做了什么

本轮补齐了 AI 设置页模型列表拉取能力，并把服务端 OpenAI Compatible 接入从固定 `chat/completions` 升级为可自动探测并兼容 `chat/completions` / `responses` 的统一协议层。设置页现在可以先拉取模型候选，再做测试连接；正文中的魔法笔、翻译、流式输出与中断能力也同步复用了这层兼容逻辑。

## 涉及文件

- 后端协议适配与设置接口：`server/internal/service/ai_provider_client.go`、`server/internal/service/settings_service.go`、`server/internal/handler/settings_handler.go`、`server/internal/handler/router.go`
- 后端 DTO 与工具：`server/internal/dto/settings_dto.go`、`server/internal/util/ai_provider.go`
- 后端测试：`server/internal/service/ai_provider_client_test.go`、`server/internal/util/ai_provider_test.go`
- 前端设置页 API、类型与交互：`web/src/api/settings.ts`、`web/src/types/settings.ts`、`web/src/features/settings/useAISettingsForm.ts`、`web/src/features/settings/SettingsPage.tsx`
- 前端设置页组件：`web/src/features/settings/components/AISettingsCard.tsx`、`web/src/features/settings/components/AISettingsModelSuggestions.tsx`、`web/src/features/settings/components/AISettingsTestResultAlert.tsx`
- 文档：`docs/api.md`、`docs/plan.md`、`docs/project-highlights.md`

## 核心设计决策和原因

1. 不新增数据库字段，协议探测结果只做进程内短 TTL 缓存。
   - 原因：协议类型本质上属于 Provider 能力探测结果，不是用户配置；如果直接落库，会把易变的兼容细节固化成持久化状态，后续反而更难演进。

2. 设置页模型列表接口返回结构化结果而不是直接把 Provider 错误透传成接口失败。
   - 原因：`/models` 不可用并不代表正文 AI 一定不可用，前端需要拿到“可继续手填模型名”的可读提示，而不是整页直接报错。

3. `responses` 兼容只覆盖当前项目真实需要的文本生成与流式文本增量场景。
   - 原因：当前产品只做局部文本改写和翻译，没有必要提前扩展到多模态、工具调用等未确认范围，避免过度设计。

## 前端组件结构与数据流

- `useAISettingsForm` 统一管理设置页加载、保存、测试连接、拉取模型列表四条状态流。
- `AISettingsCard` 负责表单编排；`AISettingsTestResultAlert` 只展示连通性测试结果；`AISettingsModelSuggestions` 只展示模型列表结果与候选项。
- 用户点击“拉取模型”后，前端调用 `/api/v1/settings/ai/models`，拿到结构化结果并渲染候选按钮；点击候选模型后直接回填到 `model` 输入框。
- 用户点击“测试连接”后，前端调用 `/api/v1/settings/ai/test`，结果中会显示本次实际命中的协议类型。

## 后端接口流程与 Provider 调用

1. 设置页测试连接：
   - 规范化 `base_url`
   - 解析当前输入或已保存的 API Key
   - 先尝试 `chat/completions`
   - 若接口不存在或返回格式不兼容，再自动回退到 `responses`
   - 返回 `provider_reachable / model_available / api_style / message`

2. 设置页拉取模型列表：
   - 规范化 `base_url`
   - 解析当前输入或已保存的 API Key
   - 请求 `/models`
   - 解析并去重 `data[].id`
   - 返回模型候选数组和结构化提示信息

3. 正文 AI：
   - 魔法笔、翻译、流式生成继续走 `aiService`
   - `aiService` 内部统一复用新的 Provider 兼容层
   - 当用户中断请求时，仍然沿用现有 `AbortController -> Gin Context -> 上游请求` 的取消链路

## 已知 TODO / 待改进项

- 当前 `/models` 只解析 OpenAI Compatible 常见的 `data[].id` 结构；如果后续接入差异更大的供应商，可以再补一层更宽松的兼容解析。
- 当前协议缓存基于 `base_url + model` 做进程内短 TTL 复用；如果后续需要跨实例共享，再评估是否引入 Redis 级缓存。
