# AI 评审意见修复

## 本次任务做了什么

- 将编辑页返回首页时的 `window.confirm` 替换为项目内统一风格的确认弹层
- 重构 `useEditorToc` 的滚动与窗口尺寸监听，避免预览 HTML 更新时重复解绑再绑定事件
- 为文档标题与正文模糊搜索新增 PostgreSQL `pg_trgm` GIN 索引，补齐搜索性能基线

## 涉及的文件清单

- `web/src/features/editor/useDocumentEditor.ts`
- `web/src/features/editor/EditorPage.tsx`
- `web/src/features/editor/components/EditorLeaveConfirmDialog.tsx`
- `web/src/features/editor/useEditorToc.ts`
- `server/internal/repository/document_repository.go`
- `server/migrations/003_enable_pg_trgm_for_document_search.sql`
- `docs/plan.md`
- `docs/project-highlights.md`

## 核心设计决策和原因

- 返回确认仍由 `useDocumentEditor` 负责判断是否需要拦截，但弹层渲染放到页面层，避免业务判断与 UI 细节耦合在同一个 hook 里
- TOC 监听改成“事件只注册一次，最新逻辑写入 ref”的结构，减少预览频繁重算时的事件重绑开销，并保留现有滚动高亮、hash 同步和标题折叠行为
- 搜索层不切换到全文检索语义，继续保留“标题或正文包含关键字即可命中”的产品规则，用 `pg_trgm` 解决 `%keyword%` 模糊匹配的性能问题

## 前端组件结构和数据流

- `useDocumentEditor` 现在额外暴露 `isLeaveDialogOpen`、`handleCancelLeave`、`handleConfirmLeave`，负责返回拦截状态
- `EditorPage` 统一挂载 `EditorLeaveConfirmDialog`，让加载态、错误态和正常编辑态都走同一套离开确认交互
- `useEditorToc` 在预览 HTML 更新后只刷新一次标题元素引用，再由常驻的 `scroll` / `resize` 监听读取最新 ref 来同步激活标题

## 后端接口流程和数据库操作

- `/api/v1/documents/search` 的请求参数与返回结构保持不变
- 数据库迁移新增 `pg_trgm` 扩展与 `documents.title`、`documents.content` 的 GIN trigram 索引
- 仓储层继续使用 `ILIKE '%keyword%'` 做模糊匹配，但依赖 trigram 索引降低标题/正文搜索的全表扫描压力

## 已知 TODO / 待改进项

- 当前仅处理编辑页按钮触发的返回确认，暂未覆盖浏览器刷新、关闭标签页或地址栏直接跳转场景
- 当前搜索结果仍按更新时间排序，暂未引入相关性排序或命中权重策略
