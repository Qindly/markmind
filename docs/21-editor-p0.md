# 21. 文档编辑 P0 闭环

## 本次任务做了什么
本次完成了文档编辑最小闭环的第一阶段实现，重点打通“从首页进入编辑页、读取文档详情、编辑正文并手动保存”的完整链路，并同步治理中文编码问题。

## 涉及的文件清单
- 后端：`server/internal/dto/document_dto.go`、`server/internal/service/document_service.go`、`server/internal/handler/document_handler.go`
- 后端改动：`server/internal/repository/document_repository.go`、`server/internal/handler/router.go`、`server/cmd/api/main.go`
- 前端：`web/src/types/document.ts`、`web/src/api/document.ts`、`web/src/features/editor/EditorPage.tsx`
- 前端扩展：`web/src/features/editor/useDocumentEditor.ts`、`web/src/features/editor/components/EditorWorkspace.tsx`、`web/src/components/ui/Textarea.tsx`
- 前端改动：`web/src/App.tsx`、`web/src/features/dashboard/useDashboardHome.ts`
- 文档与规范：`docs/api.md`、`AGENTS.md`

## 核心设计决策和原因
- 文档详情与正文保存使用独立的 `DocumentHandler / DocumentService`，避免继续把编辑器能力堆在 dashboard 模块里。
- 保留原有 `PUT /api/v1/documents/:id` 作为“改标题”接口，新增 `GET /api/v1/documents/:id` 与 `PUT /api/v1/documents/:id/content` 专门负责编辑页闭环，职责更清晰。
- 数据库层不新增表、不新增物理外键，只复用现有 `documents.content` 字段保存正文内容，继续遵守逻辑外键约束。
- 编辑页 P0 先使用基础多行输入框，而不是直接引入 CodeMirror，这样更容易先验证后端接口、状态流和路由骨架是否稳定。
- 中文编码治理先以规则和仓库扫描为基础，统一中文文本文件为 UTF-8 with BOM，降低 Windows 环境下出现乱码的概率。

## 前端组件结构与数据流
- `DashboardPage` 里的文档列表点击事件与“新建空文档”成功后，都会跳转到 `/documents/:id/edit`。
- `EditorPage` 负责处理加载态、错误态与工作区切换。
- `useDocumentEditor` 负责拉取详情、维护正文草稿、判断脏状态并调用保存接口。
- `EditorWorkspace` 负责展示标题、保存状态、正文输入区和返回/保存按钮。

## 后端接口流程与数据库操作
- `GET /api/v1/documents/:id`：鉴权成功后按 `user_id + document_id` 查询文档详情，确保用户只能读取自己的文档。
- `PUT /api/v1/documents/:id/content`：鉴权成功后按 `user_id + document_id` 更新正文内容，同时刷新 `updated_at`。
- 仓储层新增“按用户更新文档正文”方法，所有 SQL 仍然只放在 repository 层。

## 已知 TODO / 待改进项
- 编辑页还没有接入 CodeMirror、实时预览和自动保存。
- 当前标题只读展示，编辑页内还不支持直接重命名标题。
- 还没有文档详情相关的自动化测试，后续可以补 service 或 handler 层测试。
