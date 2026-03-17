# 编辑页预览性能优化

本轮围绕编辑页右侧 Markdown 预览补齐了三项性能优化，并尽量把策略沉淀成可调参与可复用的基础设施，而不是只在组件里堆条件分支。

## 本次改动

- 预览渲染真正 debounce
  - `useMarkdownPreview` 现在将编辑器实时内容和真正参与 unified 渲染的稳定内容拆开。
  - 只有 `debouncedContent` 会触发 `renderMarkdownPreview`，避免每次键入都重新跑完整预览管线。
  - 预览区继续保留旧结果，并通过 `isRendering` 状态提示“预览待刷新”，减少输入时的主线程抖动。

- 特殊块按视口懒渲染
  - Mermaid / ECharts 在 Markdown 渲染阶段会先落成带 `data-special-block` 的占位节点。
  - `useSpecialCodeBlockPreview` 使用 `IntersectionObserver` 在块接近视口时才动态加载渲染器并执行渲染。
  - 为了兼容分块渐进挂载，特殊块观察不是依赖重复全量扫描，而是通过 `MutationObserver` 自动接入后续新增节点。

- 大文档分块渲染
  - 预览引擎现在会把 HAST 根节点按块数、估算文本量和标题边界拆成 `chunks`。
  - `useProgressivePreviewChunks` 会在大文档场景下优先挂载首批 chunk，再按帧补齐其余内容。
  - TOC 点击标题时，如果目标标题所在 chunk 尚未挂载，会先强制展开对应 chunk，再执行滚动。

## 工程化处理

- 统一数据模型
  - `MarkdownPreviewResult` 新增 `specialBlocks`、`chunks` 与 `isChunked`，避免 UI 层再去扫描原始 HTML 猜上下文。

- 渲染职责收敛
  - `web/src/lib/markdown/createMarkdownEngine.ts` 负责解析、清洗、标题提取、特殊块占位和 chunk 规划。
  - `MarkdownPreview` 只负责展示 chunk 和驱动特殊块增强。
  - `useEditorToc` 只负责目录、hash 和滚动联动。

- 可调阈值集中
  - debounce、chunk 大小、渐进批次等策略都收敛在对应 hook / 引擎文件顶部常量，后续压测时可以单点调参。

## 涉及文件

- `web/src/lib/markdown/createMarkdownEngine.ts`
- `web/src/lib/markdown/types.ts`
- `web/src/lib/markdownPreview.ts`
- `web/src/features/editor/useMarkdownPreview.ts`
- `web/src/features/editor/useProgressivePreviewChunks.ts`
- `web/src/features/editor/useSpecialCodeBlockPreview.ts`
- `web/src/features/editor/useEditorToc.ts`
- `web/src/features/editor/components/MarkdownPreview.tsx`
- `web/src/features/editor/components/EditorWorkspace.tsx`
- `web/src/features/editor/specialCodeBlockRenderers.ts`
- `web/src/styles/globals.css`

## 验证

- 已执行 `pnpm build`
- 构建通过，预览链与编辑页代码成功产出
