# 项目亮点

本文档用于沉淀可直接复用到简历、面试和项目介绍中的工程亮点；后续新增亮点时，统一使用“1 句话结果（简历式结果表达） + 引用块补充原因、具体操作、涉及文件”的格式追加，不写成长篇任务复盘。

## 1. 前端加载链与编辑器渲染链拆包优化

由于编辑器预览链、Mermaid 和 ECharts 依赖在构建时持续触发大 chunk 提示，且普通页面首屏链路被重型编辑器能力拖慢，通过路由级懒加载、Markdown 预览链异步化和特殊代码块按需加载，将主入口 JS 从约 1.80 MB 压到约 17.65 kB，并将编辑页主体从约 1.67 MB 压到约 639.27 kB，显著降低了非编辑场景的首次加载成本。

> 原因：登录页、首页和普通 Markdown 文档不需要在首屏提前下载 Mermaid、ECharts 和完整预览依赖，继续把这些能力打进主链路会明显放大首次加载成本。
>
> 具体操作：将登录页、注册页、首页、编辑页改成路由级懒加载；把 unified Markdown 预览链从编辑页主体中拆成异步模块；把 Mermaid 和 ECharts 渲染器改成只在预览区检测到对应代码块时再动态加载；同时通过 Vite `manualChunks` 固定拆出 `auth-page`、`dashboard-page`、`editor-page`、`editor-preview`、`editor-mermaid`、`editor-echarts` 等异步 chunk。
>
> 涉及文件：`web/src/App.tsx`、`web/src/features/editor/useMarkdownPreview.ts`、`web/src/features/editor/useEditorToc.ts`、`web/src/features/editor/useSpecialCodeBlockPreview.ts`、`web/src/features/editor/specialCodeBlockRenderers.ts`、`web/src/features/editor/renderers/renderMermaidSpecialCodeBlock.ts`、`web/src/features/editor/renderers/renderEChartsSpecialCodeBlock.ts`、`web/vite.config.ts`、`docs/32-editor-bundle-optimization.md`

## 2. Dashboard 大文档列表虚拟化

由于 Dashboard 右侧文档列表在大数据量下会全量渲染卡片并放大 DOM 与重排开销，通过手写滚动窗口虚拟列表策略，让文档数超过 40 条时只渲染可视区附近条目，保证数百到上千条文档下仍能保持流畅滚动和稳定交互。

> 原因：首页右侧文档列表当前会直接全量渲染全部卡片，文档数量一大时 DOM 节点数和重排开销会明显增长，不适合继续作为长期性能基线。
>
> 具体操作：在 Dashboard 模块内手写滚动窗口 Hook，根据滚动容器高度和滚动位置计算需要渲染的文档区间；小列表继续全量渲染，大列表超过 40 条时切换到虚拟化路径；文档进入行内重命名时临时回退全量列表，避免动态高度和自动聚焦破坏滚动计算。
>
> 涉及文件：`web/src/features/dashboard/useVirtualListWindow.ts`、`web/src/features/dashboard/components/DocumentListPanel.tsx`、`web/src/features/dashboard/components/DocumentListItem.tsx`、`docs/34-dashboard-virtual-list.md`

## 3. Dashboard 搜索防抖与竞态取消

由于 Dashboard 搜索在连续输入时会频繁触发请求，且旧请求晚返回时存在覆盖新结果的风险，通过 300 ms 输入防抖、`AbortController` 主动取消旧请求和取消态错误隔离，减少了无效搜索请求并稳定了最新关键字结果展示。

> 原因：当前目录搜索已经具备标题与正文搜索、摘要高亮等能力，但如果继续在每次按键时立即请求后端，不仅会放大无效请求数量，也容易在网络波动时出现旧结果回写新关键字列表的问题。
>
> 具体操作：在 Dashboard 搜索链路中引入通用 `useDebouncedValue` Hook，将实时输入和真正参与搜索的稳定关键字拆开；为 `searchDocuments` 增加 `AbortSignal` 支持，并在 `useDashboardHome` 中维护当前激活的 `AbortController`，当用户继续输入、清空搜索或切换目录时先主动取消旧请求；同时补上取消态错误隔离，避免主动取消把列表误切成“搜索失败”状态。
>
> 涉及文件：`web/src/features/dashboard/useDashboardHome.ts`、`web/src/api/dashboard.ts`、`web/src/hooks/useDebouncedValue.ts`、`web/src/lib/isRequestCanceled.ts`、`docs/39-dashboard-search-perf.md`

## 4. Dashboard 标题/正文模糊搜索索引加速

由于 Dashboard 当前目录搜索和全局搜索已经支持标题与正文命中，但裸 `ILIKE '%keyword%'` 会在文档规模增长后持续放大全表扫描成本，通过为 `documents.title` 与 `documents.content` 引入 PostgreSQL `pg_trgm` GIN 索引，在不改变搜索接口和命中语义的前提下，为跨目录模糊搜索补齐了可扩展的数据库性能基线。

> 原因：Dashboard 搜索现在已经覆盖标题、正文、当前目录和跨目录场景，如果继续仅依赖前后通配符的 `ILIKE`，在文档条数和正文长度持续增长后会成为明显瓶颈。
>
> 具体操作：保留现有 `ILIKE '%keyword%'` 查询语义与接口结构不变，在 PostgreSQL 中启用 `pg_trgm` 扩展，并为 `documents.title`、`documents.content` 新增 GIN trigram 索引；同时在仓储层补充中文注释，明确这里是“语义不变、底层加速”的实现策略。
>
> 涉及文件：`server/migrations/003_enable_pg_trgm_for_document_search.sql`、`server/internal/repository/document_repository.go`、`docs/43-ai-review-fixes.md`

## 5. 编辑器选区 AI 助手闭环

由于传统 Markdown 编辑器往往只能做整篇 AI 处理或缺少可控的局部工作流，通过在 CodeMirror 选区上构建悬浮快捷入口、用户级 OpenAI Compatible 配置页与服务端加密代理，实现了面向 Markdown 文段的局部润色与目标语言翻译闭环，并支持替换、插入、复制三种结果回填动作。

> 原因：如果只在编辑器里放一个全局 AI 按钮，不仅会破坏“局部处理”的即时性，也很难兼顾配置安全、选区上下文控制和 Markdown 结构保留。
>
> 具体操作：新增受保护设置页维护 `baseURL`、`apiKey`、`model`，服务端对 `apiKey` 做 AES-GCM 加密并统一代理 OpenAI Compatible `chat/completions`；编辑器侧通过 CodeMirror 选区监听生成悬浮“魔法笔 / 中英翻译”入口，在对话框中完成 prompt 输入、语言配置、结果预览以及替换 / 插入 / 复制回填；翻译链路保留目标语言译文与 Markdown 结构，保证写回内容简洁稳定。
>
> 涉及文件：`server/internal/service/settings_service.go`、`server/internal/service/ai_service.go`、`server/internal/util/encryption.go`、`web/src/features/settings/SettingsPage.tsx`、`web/src/features/editor/useEditorSelectionAI.ts`、`web/src/features/editor/components/EditorMagicEditDialog.tsx`、`web/src/features/editor/components/EditorTranslateDialog.tsx`、`docs/45-editor-selection-ai.md`

## 6. AI 设置页连通性校验与选区入口稳定化

由于 AI 设置页原先只支持保存配置、无法在回到编辑器前确认 Provider 与模型是否真实可用，且选区悬浮入口存在点击时因编辑器失焦而“看起来没反应”的交互缺陷，通过新增服务端真实调用探活、模型可用性校验与悬浮入口保焦修复，让用户可以在设置页提前完成兼容性诊断，并稳定触发局部 AI 工作流。

> 原因：如果用户只能保存配置后再回编辑器试错，不仅排查成本高，也很难快速区分是 `baseURL`、`apiKey` 还是 `model` 出了问题；同时悬浮入口一旦因为失焦被瞬时清空，功能虽然存在，但实际可用性会明显受损。
>
> 具体操作：后端新增 `POST /api/v1/settings/ai/test`，使用当前 `baseURL / apiKey / model` 发起轻量 `chat/completions` 请求，并结构化返回 `provider_reachable`、`model_available` 与可读失败原因；前端设置页补“测试连接”按钮和结果态展示，并支持在未输入新密钥时沿用已保存 API Key 测试；编辑器侧把“魔法笔 / 中英翻译”改成横向悬浮入口，并在按钮 `onMouseDown` 阶段阻止焦点转移，修复点击后没有反应的问题。
>
> 涉及文件：`server/internal/service/ai_provider_client.go`、`server/internal/service/settings_service.go`、`server/internal/handler/settings_handler.go`、`web/src/features/settings/useAISettingsForm.ts`、`web/src/features/settings/components/AISettingsCard.tsx`、`web/src/features/editor/components/EditorSelectionActions.tsx`、`docs/46-ai-settings-connectivity-test.md`

## 7. 编辑器局部 AI 流式输出与端到端中断

由于局部 AI 在处理较长选中文段时一次性等待完整返回会放大空窗时间，且用户在结果跑偏时缺少及时止损能力，通过新增服务端 SSE 流式接口、前端 `fetch + ReadableStream` 增量消费与 `AbortController` 端到端取消，将魔法笔与翻译改造成可实时预览、可主动中断的交互链路，显著提升了长文本处理的反馈速度与可控性。

> 原因：原有局部 AI 只能在上游完全返回后一次性展示结果，长文段下用户只能被动等待；一旦 prompt 方向不对，也没有办法在生成过程中及时停止并重新尝试。
>
> 具体操作：后端新增 `/api/v1/ai/magic-edit/stream` 与 `/api/v1/ai/translate/stream` 两个 `text/event-stream` 接口，直接透传 OpenAI Compatible `stream=true` 增量结果，并在浏览器中断时同步取消上游请求；前端补充支持 401 自动刷新的流式 `fetch` 封装，按 `chunk / done / error` 事件驱动结果区实时刷新；同时把翻译结果从双语 Markdown 收敛为纯译文，只在完成后开放复制、插入、替换动作，避免半成品误写回文档。
>
> 涉及文件：`server/internal/service/ai_provider_client.go`、`server/internal/service/ai_service.go`、`server/internal/handler/ai_handler.go`、`web/src/api/client.ts`、`web/src/api/ai.ts`、`web/src/features/editor/useEditorSelectionAI.ts`、`web/src/features/editor/components/EditorMagicEditDialog.tsx`、`web/src/features/editor/components/EditorTranslateDialog.tsx`、`docs/49-ai-streaming-and-abort.md`

## 8. OpenAI Compatible 多协议兼容与模型候选拉取

由于不同 OpenAI Compatible Provider 在 `chat/completions` 与 `responses` 之间存在明显兼容分裂，且设置页原先只能手填模型名、缺少真实候选来源，通过新增 `/models` 拉取、协议自动探测回退与短 TTL 能力缓存，让设置页、魔法笔、翻译和流式生成统一兼容两种主流协议，并把模型选择从纯手输升级为“拉取候选 + 手动兜底”的更稳交互链路。

> 原因：如果继续把正文 AI 和设置页测试都绑定在 `chat/completions`，一旦接入只支持 `responses` 的 Provider，用户就会在保存设置或编辑器调用时直接遇到兼容性断层；同时没有模型列表候选时，模型名只能靠用户手动记忆和试错，设置成本偏高。
>
> 具体操作：服务端在 `ai_provider_client` 中收口 OpenAI Compatible 文本生成能力，先尝试 `chat/completions`，当接口不存在或返回格式不兼容时自动回退到 `responses`，并把探测结果按 `baseURL + model` 写入短 TTL 缓存；同步新增 `POST /api/v1/settings/ai/models` 请求 `/models` 拉取模型列表，设置页补上“拉取模型”按钮、模型候选点击回填和 `api_style` 展示，让测试连接和正文 AI 共用同一套兼容链路。
>
> 涉及文件：`server/internal/service/ai_provider_client.go`、`server/internal/service/settings_service.go`、`server/internal/handler/settings_handler.go`、`server/internal/dto/settings_dto.go`、`web/src/api/settings.ts`、`web/src/features/settings/useAISettingsForm.ts`、`web/src/features/settings/components/AISettingsCard.tsx`、`web/src/features/settings/components/AISettingsModelSuggestions.tsx`、`docs/50-ai-provider-models-and-protocol-compat.md`
