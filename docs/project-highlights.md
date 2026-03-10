# 项目亮点

本文档用于沉淀可直接复用到简历、面试和项目介绍中的工程亮点；后续新增亮点时，统一使用“1 句话结果 + 引用块补充原因、具体操作、涉及文件”的格式追加，不写成长篇任务复盘。

## 1. 前端加载链与编辑器渲染链拆包优化

通过路由级懒加载、Markdown 预览链异步加载和特殊代码块按需加载，把主入口 JS 从约 1.80 MB 压到约 17.65 kB，并将编辑页主体从约 1.67 MB 压到约 639.27 kB。

> 原因：登录页、首页和普通 Markdown 文档不需要在首屏提前下载 Mermaid、ECharts 和完整预览依赖，继续把这些能力打进主链路会明显放大首次加载成本。
>
> 具体操作：将登录页、注册页、首页、编辑页改成路由级懒加载；把 unified Markdown 预览链从编辑页主体中拆成异步模块；把 Mermaid 和 ECharts 渲染器改成只在预览区检测到对应代码块时再动态加载；同时通过 Vite `manualChunks` 固定拆出 `auth-page`、`dashboard-page`、`editor-page`、`editor-preview`、`editor-mermaid`、`editor-echarts` 等异步 chunk。
>
> 涉及文件：`web/src/App.tsx`、`web/src/features/editor/useMarkdownPreview.ts`、`web/src/features/editor/useEditorToc.ts`、`web/src/features/editor/useSpecialCodeBlockPreview.ts`、`web/src/features/editor/specialCodeBlockRenderers.ts`、`web/src/features/editor/renderers/renderMermaidSpecialCodeBlock.ts`、`web/src/features/editor/renderers/renderEChartsSpecialCodeBlock.ts`、`web/vite.config.ts`、`docs/32-editor-bundle-optimization.md`

## 2. Dashboard 大文档列表虚拟化

通过手写虚拟列表 Hook 让 Dashboard 在文档数超过 40 条时只渲染可视区附近条目，保证数百到上千条文档下仍能保持流畅滚动和稳定交互。

> 原因：首页右侧文档列表当前会直接全量渲染全部卡片，文档数量一大时 DOM 节点数和重排开销会明显增长，不适合继续作为长期性能基线。
>
> 具体操作：在 Dashboard 模块内手写滚动窗口 Hook，根据滚动容器高度和滚动位置计算需要渲染的文档区间；小列表继续全量渲染，大列表超过 40 条时切换到虚拟化路径；文档进入行内重命名时临时回退全量列表，避免动态高度和自动聚焦破坏滚动计算。
>
> 涉及文件：`web/src/features/dashboard/useVirtualListWindow.ts`、`web/src/features/dashboard/components/DocumentListPanel.tsx`、`web/src/features/dashboard/components/DocumentListItem.tsx`、`docs/34-dashboard-virtual-list.md`
