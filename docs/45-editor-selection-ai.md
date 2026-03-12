# 编辑器选区 AI 助手首版

## 本次任务做了什么

本轮实现了编辑器选区 AI 助手首版闭环：用户在 CodeMirror 中选中文段后，会在选区右下侧看到“魔法笔”和“中英翻译”两个悬浮快捷入口；同时新增受保护的设置页，用于维护用户级 OpenAI Compatible Provider 的 `baseURL`、`apiKey` 和 `model`。后端负责加密存储 `apiKey` 并代理请求上游模型，前端则完成选区上下文采集、对话框交互和结果回填。

## 涉及的文件清单

- 后端配置与迁移：`server/internal/config/config.go`、`server/internal/config/config_test.go`、`server/migrations/004_create_ai_provider_settings.sql`、`docker-compose.yml`、`.env.example`
- 后端 AI 配置与代理：`server/internal/const/ai.go`、`server/internal/model/ai_provider_setting.go`、`server/internal/dto/settings_dto.go`、`server/internal/dto/ai_dto.go`、`server/internal/repository/ai_provider_setting_repository.go`、`server/internal/service/settings_service.go`、`server/internal/service/ai_service.go`、`server/internal/handler/settings_handler.go`、`server/internal/handler/ai_handler.go`、`server/internal/handler/router.go`、`server/internal/handler/response.go`、`server/cmd/api/main.go`
- 后端工具与测试：`server/internal/util/encryption.go`、`server/internal/util/encryption_test.go`、`server/internal/util/ai_provider.go`、`server/internal/util/ai_provider_test.go`
- 前端设置页：`web/src/api/settings.ts`、`web/src/types/settings.ts`、`web/src/features/settings/SettingsPage.tsx`、`web/src/features/settings/useAISettingsForm.ts`、`web/src/features/settings/components/AISettingsCard.tsx`
- 前端编辑器 AI：`web/src/api/ai.ts`、`web/src/types/ai.ts`、`web/src/features/editor/useEditorSelectionAI.ts`、`web/src/features/editor/selectionAI.ts`、`web/src/features/editor/translationLanguageSuggestions.ts`、`web/src/features/editor/components/EditorSelectionActions.tsx`、`web/src/features/editor/components/EditorMagicEditDialog.tsx`、`web/src/features/editor/components/EditorTranslateDialog.tsx`
- 前端接线：`web/src/lib/codeMirror.ts`、`web/src/features/editor/components/CodeMirrorEditor.tsx`、`web/src/features/editor/components/EditorWorkspace.tsx`、`web/src/features/editor/EditorPage.tsx`、`web/src/features/dashboard/components/FolderSidebarHeader.tsx`、`web/src/App.tsx`
- 文档：`docs/api.md`、`docs/plan.md`、`docs/project-highlights.md`

## 核心设计决策和原因

1. AI Provider 配置采用“用户级持久化 + 服务端代理”
   - 浏览器不直接请求第三方模型，避免 CORS 和明文 `apiKey` 暴露问题。
   - 设置页只回显脱敏后的 `apiKey` 状态，真正的密钥由服务端加密存库。

2. 选区 AI 交互采用“悬浮快捷入口 + 对话框执行”
   - 选区旁同时展示两个快捷入口，贴合“局部润色 / 局部翻译”的即时操作语义。
   - 真正的请求和结果预览放在模态对话框中，避免在编辑区内塞入过重的交互面板。

3. 翻译结果统一回填双语 Markdown
   - 前端替换 / 插入 / 复制都基于同一份双语对照 Markdown，避免一个功能出现多种回填格式。
   - 后端统一组装“原文 + 译文”结果，而不是把文档格式拼接逻辑留给前端分散处理。

4. 选区上下文只截取少量前后文
   - 既能让模型拿到必要语境，又不会把整篇文档全部发给上游 Provider。
   - 首版实现更可控，也更容易做后续 prompt 调整。

## 组件结构和数据流

### 前端

- `SettingsPage`
  - 页面加载时调用 `fetchAISettings`
  - 表单保存时调用 `updateAISettings`
  - 保存成功后回写规范化后的 `baseURL` 与脱敏 `apiKey`

- `EditorPage -> EditorWorkspace -> CodeMirrorEditor`
  - `CodeMirrorEditor` 通过 CodeMirror 扩展持续上报选区变化
  - `useEditorSelectionAI` 负责保存选区快照、弹窗状态、AI 请求和结果回填
  - `EditorSelectionActions` 只负责展示悬浮入口
  - `EditorMagicEditDialog` / `EditorTranslateDialog` 只负责展示对话框与动作按钮

### 后端

- `SettingsHandler -> SettingsService -> AIProviderSettingRepository`
  - 读取和更新当前用户 AI Provider 配置
  - 更新时自动补全 `/v1`，并对 `apiKey` 做 AES-GCM 加密

- `AIHandler -> AIService -> AIProviderSettingRepository + DocumentRepository`
  - 先校验文档归属，再读取当前用户的 AI 配置
  - 将选中文段和少量上下文发给 OpenAI Compatible `chat/completions`
  - 魔法笔直接返回可写回文本
  - 翻译返回检测语言、译文和统一双语 Markdown 结果

## 已知 TODO / 待改进项

- 当前仍是非流式 AI 响应，后续如果要强化体验，可以补流式输出与增量渲染。
- 现在翻译语言输入为自由文本 + 常见语言建议，后续可以升级成更完整的语言选择器。
- 选区 AI 结果目前只支持按钮式回填，后续可以补快捷键或历史结果对比。
- 现有构建产物里 `editor-mermaid` 与 `editor-echarts` 仍然偏大，这不是本轮引入的问题，但仍值得继续优化。
