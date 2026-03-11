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
