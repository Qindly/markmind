# AI 设置页连通性测试与选区入口修复

## 本次任务做了什么

本轮为 AI 设置页补上了 Provider 连通性测试与模型可用性校验闭环：用户现在可以在保存前直接用当前 `baseURL`、`apiKey` 和 `model` 发起一次轻量 `chat/completions` 测试，请求成功时确认当前模型可真实调用，请求失败时直接看到可读原因。同时修复了编辑器选区 AI 悬浮入口点击没有反应的问题，并将“魔法笔 / 中英翻译”按钮改成横向排布。

## 涉及的文件清单

- 后端 Provider 探活与设置页接口：`server/internal/service/ai_provider_client.go`、`server/internal/service/ai_provider_client_test.go`、`server/internal/service/settings_service.go`、`server/internal/dto/settings_dto.go`、`server/internal/handler/settings_handler.go`、`server/internal/handler/router.go`、`server/cmd/api/main.go`
- 后端 AI 请求复用：`server/internal/service/ai_service.go`
- 前端设置页：`web/src/types/settings.ts`、`web/src/api/settings.ts`、`web/src/features/settings/useAISettingsForm.ts`、`web/src/features/settings/components/AISettingsCard.tsx`、`web/src/features/settings/SettingsPage.tsx`
- 前端编辑器选区入口：`web/src/features/editor/components/EditorSelectionActions.tsx`、`web/src/features/editor/selectionAI.ts`
- 文档：`docs/api.md`、`docs/plan.md`、`docs/project-highlights.md`

## 核心设计决策和原因

1. 设置页测试走“真实调用”而不是假探活
   - 仅测试 `baseURL` 连不连得上并不能证明当前 `model` 可以真实调用。
   - 因此测试接口直接发起一次轻量 `chat/completions` 请求，把“Provider 可达”和“模型可用”一次校验清楚。

2. Provider 探活与正文 AI 请求复用同一套上游客户端
   - 如果设置页测试和正文 AI 各自维护一套 HTTP 请求与错误解析逻辑，后续会很难保证错误文案和兼容性策略一致。
   - 本轮把 OpenAI Compatible 请求、网络错误分类、上游错误解析统一收敛到 `ai_provider_client.go` 中，设置页和正文 AI 共用。

3. 设置页测试失败也返回结构化结果
   - 对于“Provider 已连通但模型不可用”“Provider 已连通但 API Key 无效”这类情况，前端需要的是可展示的诊断结果，而不是只有一个笼统异常。
   - 因此测试接口会在输入校验通过后，尽量返回结构化 `provider_reachable / model_available / message`，方便前端稳定展示。

4. 悬浮入口 bug 通过“阻止抢焦点”修复
   - 问题根因不是对话框没实现，而是点击悬浮按钮时编辑器先失焦，选区浮层在点击瞬间被清掉，导致用户体感像“点了没反应”。
   - 本轮在悬浮按钮 `onMouseDown` 阶段阻止默认聚焦转移，保留编辑器焦点与选区快照，确保点击后能稳定打开对话框。

## 前端组件结构与数据流

- `SettingsPage -> useAISettingsForm -> AISettingsCard`
  - 表单加载时读取已保存的 AI 配置摘要。
  - 点击“测试连接”时提交当前输入，拿到结构化测试结果后直接在卡片内展示。
  - 任一字段再次修改时，之前的测试结果立即失效并清空，避免旧结果误导用户。

- `EditorWorkspace -> EditorSelectionActions`
  - 选中文段后显示横向悬浮入口。
  - 点击按钮时先阻止失焦，再继续执行原有“魔法笔 / 中英翻译”打开流程。

## 后端接口流程

- `SettingsHandler -> SettingsService.TestAISettings -> aiProviderClient`
  - 先校验 `baseURL` 与 `model`
  - 如果请求体带了新 `apiKey`，优先用新值测试；否则回退到当前用户已保存的密钥
  - 用轻量 prompt 发起一次 `chat/completions` 请求
  - 将上游结果整理为：
    - `provider_reachable`
    - `model_available`
    - `using_saved_api_key`
    - `message`

## 已知 TODO / 待改进项

- 当前仍然只支持用户手动输入模型名，不提供 Provider 返回的模型列表枚举。
- 设置页测试结果目前是一次性页面状态，还没有沉淀成“最近一次成功校验时间”等更完整的配置健康信息。
- 悬浮入口当前主要按桌面鼠标交互优化，后续如果要强化移动端编辑体验，可以再补触屏选区入口策略。
