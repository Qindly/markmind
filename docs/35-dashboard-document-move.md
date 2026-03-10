# 35. Dashboard 文档移动归类

## 本次任务做了什么
本次任务补齐了 Dashboard 文档管理闭环中的“移动归类”能力。用户现在可以在文档列表项菜单中点击“移动到...”，通过独立弹窗把文档移动到任意文件夹，或者移回根目录。

这次没有新增独立 move 接口，而是复用了已有的 `PUT /api/v1/documents/:id`，把它扩展为同时支持更新标题和 `folder_id`。这样前后端的文档元信息更新入口仍然保持集中，后续继续补更多元信息字段时也更容易扩展。

## 涉及的文件清单
- `server/internal/dto/dashboard_dto.go`
- `server/internal/service/dashboard_service.go`
- `server/internal/repository/document_repository.go`
- `server/internal/handler/dashboard_handler.go`
- `web/src/types/dashboard.ts`
- `web/src/api/dashboard.ts`
- `web/src/features/dashboard/useDashboardHome.ts`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/components/DashboardMoveDocumentDialog.tsx`
- `web/src/features/dashboard/components/DashboardItemMenu.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/src/features/dashboard/components/DocumentListItem.tsx`
- `docs/api.md`
- `docs/plan.md`

## 核心设计决策和原因
- 复用现有 `PUT /api/v1/documents/:id`。
  当前“修改标题”和“移动归类”本质上都属于文档元信息更新，继续拆新接口会让 DTO、文档和前端 API 层变得更分散。
- `folder_id` 需要区分“不传”和“显式传 null”。
  不传表示这次不改归类；显式传 `null` 才表示“移回根目录”。因此后端请求结构里额外封装了一层可区分字段存在性的输入类型。
- 前端使用独立移动弹窗，而不是把文件夹直接塞进三点菜单。
  这样目录多起来时不会把菜单撑得过长，后续如果要扩成搜索目录、最近目录或批量移动，也还有清晰的扩展位置。
- 移动成功后按当前目录立刻刷新本地列表。
  文档一旦被移动到其它目录，就应该马上从当前筛选结果中消失，而不是等下一次整页刷新才同步状态。

## 前后端数据流说明
- 前端文档菜单点击“移动到...”后，会把当前文档写入 `moveState`，由 `DashboardMoveDocumentDialog` 负责展示目录选择弹窗。
- 用户确认后，前端调用 `updateDocument(documentId, { folder_id })`。
- 后端 service 会先校验文档 ID、可选标题和目标文件夹归属，再交给 repository 更新文档元信息。
- 更新成功后，前端用返回的新文档数据替换本地 `documents` 数组，并按 `updated_at` 重新排序。

## 已知 TODO / 待改进项
- 当前只支持单篇文档移动，后续如果要补批量操作，需要重新设计选择态和多选交互。
- 当前移动弹窗只做了目录列表选择，没有搜索和最近目录；文件夹数量进一步增大后可以再单独优化。
