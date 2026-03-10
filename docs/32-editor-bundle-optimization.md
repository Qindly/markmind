# 32. 编辑页包体积优化与特殊渲染按需加载

## 本次任务做了什么
本次任务围绕前端路由加载链、编辑页预览链和特殊代码块渲染做了一轮连续的工程化优化，目标不是新增功能，而是持续降低普通用户首次进入应用时的无效加载成本。

完成之后，前端整体加载链和预览区的效果变成了：
- 应用主入口不会继续静态打进登录页、注册页、首页和编辑页整套业务代码
- 进入 `/login`、`/register`、`/`、`/documents/:id/edit` 时，才会按需加载对应页面
- 编辑页右侧的 Markdown 预览渲染链也被独立拆出，首次进入编辑页时不再提前把完整 unified 渲染依赖塞进编辑页主体 chunk
- 普通 Markdown 文档不会提前把 Mermaid / ECharts 的运行时代码吃进主链路
- 只有当预览区真的遇到 ` ```mermaid ` 或 ` ```echarts ` 代码块时，才会异步加载对应渲染器模块
- 首次加载预览渲染链或特殊渲染器时，预览区会先显示轻量加载提示，加载完成后再替换成真实预览或图表
- 构建阶段会把 auth、dashboard、editor、preview、Mermaid、ECharts 相关依赖拆成更稳定的异步 chunk，而不是继续膨胀主入口包

## 涉及的文件清单
- `web/src/App.tsx`
- `web/src/features/editor/useMarkdownPreview.ts`
- `web/src/features/editor/useEditorToc.ts`
- `web/src/features/editor/useSpecialCodeBlockPreview.ts`
- `web/src/features/editor/specialCodeBlockRenderers.ts`
- `web/src/features/editor/renderers/renderMermaidSpecialCodeBlock.ts`
- `web/src/features/editor/renderers/renderEChartsSpecialCodeBlock.ts`
- `web/src/features/editor/components/MarkdownPreview.tsx`
- `web/src/features/editor/components/EditorWorkspace.tsx`
- `web/src/styles/globals.css`
- `web/vite.config.ts`
- `docs/plan.md`

## 核心设计决策和原因
- 登录页、注册页、首页、编辑页统一改成路由级懒加载。
  这样应用在首次进入任意页面时，不需要提前把其它页面的主体组件和业务依赖都打进主入口，能够先把页面级边界理清。
- `GuestRoute` 和 `ProtectedRoute` 继续保留在主入口链路。
  这两个守卫承担了全站鉴权与路由跳转职责，继续留在主链路里能让路由切换时序更稳定，也避免为了进一步压包而把最基础的守卫逻辑打散。
- Markdown 预览渲染链改成异步加载。
  之前 `useEditorToc` 会直接静态依赖 `renderMarkdownPreview`，导致 unified、remark、rehype、高亮和公式相关依赖都被卷进 `editor-page`。现在通过 `useMarkdownPreview` 动态加载预览模块，让编辑页主体先可用，再异步生成右侧预览。
- Mermaid 渲染器和 ECharts 渲染器继续分别封装，但入口统一走 `load()`。
  这样可以保留已有的职责边界，同时把“是否首次加载”“是否复用同一模块 promise”收口到注册表层处理，后续继续接新渲染器时也能沿着同样模式扩展。
- Vite 只做最小化的手动拆包。
  当前先把 auth、dashboard、编辑页主体、Markdown 预览链、Mermaid、ECharts、zrender、json5 这几类明确的大依赖拆到独立 chunk，目标是让页面主体和编辑器相关依赖脱离主入口，而不是一次性做全站级别的复杂 vendor 规划。

## 前端组件结构和数据流说明
- `App` 中的登录页、注册页、首页、编辑页路由现在统一通过 `React.lazy` + `Suspense` 按需加载，并复用 `PageState` 作为路由级加载占位。
- `useMarkdownPreview` 负责异步加载 `markdownPreview` 渲染模块，生成 HTML 与 headings，并向编辑页暴露加载态和错误态。
- `useEditorToc` 不再直接渲染 Markdown，而是只消费异步预览结果，专注处理 TOC 结构、激活标题、滚动同步和 hash 同步。
- `useSpecialCodeBlockPreview` 会在识别到特殊代码块后，先写入加载占位，再异步加载 Mermaid / ECharts 实际渲染器模块。
- 渲染失败时，预览区和特殊代码块都仍然会回退到可读的错误提示或源码状态，不会阻塞左侧编辑器继续使用。

## 已知 TODO / 待改进项
- 当前虽然已经把主入口明显压小，并拆出了 auth、dashboard、editor、preview、Mermaid、ECharts 等 chunk，但构建日志里仍然保留大 chunk 警告，后续需要继续观察是否值得再细化 vendor 级别的拆分。
- `editor-mermaid` 与 `editor-echarts` 仍然偏大，本轮只是把它们稳定隔离成异步 chunk，并没有继续缩减库本身体积。
- 加载态目前只做了轻量文本占位，没有额外加骨架动画或交互细节，后续如果要继续打磨体验可以单独处理。
