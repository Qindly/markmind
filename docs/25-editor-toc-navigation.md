# 25. 编辑页 TOC 导航增强

## 本次任务做了什么
本次围绕编辑页右侧预览新增了完整的标题导航闭环，主要补齐了以下能力：
- 基于 unified 预览管线提取标题并生成稳定锚点 ID
- 在编辑页左侧新增可折叠的树形 TOC 面板
- 点击 TOC 后平滑滚动右侧预览到对应标题
- 滚动预览时自动高亮当前章节，并同步到 URL hash
- 支持通过浏览器地址栏 hash 或前进 / 后退恢复预览定位

## 涉及的文件清单
- Markdown 预览工具：`web/src/lib/markdownPreview.ts`
- TOC 数据与联动：`web/src/features/editor/buildEditorTocTree.ts`、`web/src/features/editor/useEditorToc.ts`
- TOC 组件：`web/src/features/editor/components/EditorTocPanel.tsx`、`web/src/features/editor/components/EditorTocItem.tsx`
- 编辑页结构：`web/src/features/editor/components/EditorWorkspace.tsx`
- 预览组件：`web/src/features/editor/components/MarkdownPreview.tsx`
- 预览样式：`web/src/styles/globals.css`

## 核心设计决策和原因
- TOC 数据直接从 unified 预览管线提取，避免额外维护一套与预览不一致的标题解析逻辑。
- 标题锚点 ID 在 rehype 阶段生成并写回 HTML，这样点击导航、滚动同步和 URL hash 都共享同一套稳定标识。
- 树形 TOC 使用前端局部状态维护折叠关系，不污染 Markdown 内容，也不需要额外后端支持。
- URL hash 采用替换式同步，保证用户可以复制当前章节链接，同时避免滚动过程中不断向浏览器历史里追加记录。
- 激活标题通过预览容器内的 `IntersectionObserver` 驱动，这样同步的是“用户实际正在看的预览章节”，而不是编辑器中的光标位置。

## 前端结构与数据流说明
- `renderMarkdownPreview` 返回 HTML 与标题数组，作为预览和 TOC 的统一数据源。
- `useEditorToc` 负责把标题数组转换为树、维护折叠状态、同步激活标题、处理 hash 和滚动逻辑。
- `EditorWorkspace` 组合信息面板、TOC 面板、编辑器和预览区，不在页面组件里堆积目录状态逻辑。
- `MarkdownPreview` 只负责展示 HTML 与暴露滚动容器引用，`EditorTocPanel` 只负责目录树交互。

## 已知 TODO / 待改进项
- 当前 TOC 只联动右侧预览，还没有做到点击目录后同步定位 CodeMirror 光标。
- TOC 目前默认全部展开，尚未追加“全部展开 / 全部收起”这种快捷操作。
- 如果后续需要分享更稳定的标题链接，可以再考虑把 slug 规则单独沉淀成可复用工具并补充更多边界测试。
