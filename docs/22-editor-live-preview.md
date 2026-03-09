# 22. 编辑器实时预览与自动保存

## 本次任务做了什么
本次在编辑页 P0 骨架的基础上，完成了真正可用的 Markdown 编辑体验升级：
- 左侧接入 CodeMirror v6 作为正文编辑器
- 右侧接入基于 unified 的 GFM 实时预览
- 新增防抖自动保存、手动保存与未保存离开提醒

## 涉及的文件清单
- 依赖与锁文件：`web/package.json`、`web/pnpm-lock.yaml`
- 编辑器与预览：`web/src/features/editor/components/CodeMirrorEditor.tsx`、`web/src/features/editor/components/MarkdownPreview.tsx`
- 编辑页结构：`web/src/features/editor/components/EditorWorkspace.tsx`、`web/src/features/editor/components/EditorInfoPanel.tsx`
- 编辑页逻辑：`web/src/features/editor/useDocumentEditor.ts`、`web/src/features/editor/useDocumentSaveController.ts`、`web/src/features/editor/usePendingChangesGuard.ts`
- 工具与类型：`web/src/lib/codeMirror.ts`、`web/src/lib/markdownPreview.ts`、`web/src/features/editor/getSaveStatusMessage.ts`、`web/src/features/editor/formatEditorDateTime.ts`、`web/src/types/document.ts`
- 页面与样式：`web/src/features/editor/EditorPage.tsx`、`web/src/styles/globals.css`
- 计划文档：`docs/plan.md`

## 核心设计决策和原因
- 使用独立的 `CodeMirrorEditor` 和 `MarkdownPreview` 组件，避免把编辑器实例化和预览渲染逻辑直接写进页面组件。
- unified 渲染管线沉淀在 `web/src/lib/markdownPreview.ts`，CodeMirror 配置沉淀在 `web/src/lib/codeMirror.ts`，符合项目对工具层解耦的要求。
- 自动保存采用 1.5 秒防抖，并保留手动保存按钮，这样在输入体验和可控性之间做一个平衡。
- 原始 HTML 不直接开放到预览里，而是先走 `rehype-sanitize` 清洗，优先保证当前阶段的预览安全边界。
- 保存状态机拆到 `useDocumentSaveController`，把“加载文档”和“保存文档”的职责分开，便于后续继续追加 TOC、图片上传等能力。

## 前端组件结构与数据流
- `EditorPage` 负责加载态、错误态和工作区切换。
- `useDocumentEditor` 负责拉取文档详情，并组合保存控制器返回的状态。
- `useDocumentSaveController` 负责正文变更、自动保存、手动保存、状态文案和离开保护。
- `CodeMirrorEditor` 接收正文与变更回调，只负责编辑器展示。
- `MarkdownPreview` 接收 Markdown 文本，调用 unified 管线输出实时预览 HTML。

## 已知 TODO / 待改进项
- 还没有 TOC 自动生成与点击导航。
- 预览目前只支持 GFM 基线，不包含 Mermaid、LaTeX、图片粘贴上传等增强能力。
- 自动保存失败时当前只保留错误提示和手动重试，还没有更细的重试策略与冲突处理。
