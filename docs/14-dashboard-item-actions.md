# 14-dashboard-item-actions

## 本次任务做了什么
为首页 Dashboard 的文件夹项与文档项补齐了“修改 / 删除”操作链路，包含后端删改接口、前端三点菜单、行内编辑、删除确认弹层，以及删除成功后的红色 toast 提示。同时把当前项目的最新配色规范正式写入了 `AGENTS.md`，避免后续样式继续漂移。

## 涉及文件清单

- `server/internal/const/auth.go`
- `server/internal/dto/dashboard_dto.go`
- `server/internal/repository/folder_repository.go`
- `server/internal/repository/document_repository.go`
- `server/internal/service/dashboard_service.go`
- `server/internal/handler/response.go`
- `server/internal/handler/dashboard_handler.go`
- `server/internal/handler/router.go`
- `web/src/types/dashboard.ts`
- `web/src/api/dashboard.ts`
- `web/src/styles/globals.css`
- `web/src/features/dashboard/useDashboardHome.ts`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/components/FolderSidebar.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/src/features/dashboard/components/FolderSidebarItem.tsx`
- `web/src/features/dashboard/components/DocumentListItem.tsx`
- `web/src/features/dashboard/components/DashboardItemMenu.tsx`
- `web/src/features/dashboard/components/DashboardInlineNameEditor.tsx`
- `web/src/features/dashboard/components/DashboardDeleteDialog.tsx`
- `web/src/features/dashboard/components/DashboardToast.tsx`
- `docs/api.md`
- `AGENTS.md`

## 核心设计决策和原因

1. 文件夹删除坚持“禁止非空删除”
   - 按照已确认方案，不做自动级联删除。
   - 后端在 service 层先做逻辑校验，若文件夹下仍有文档，直接返回明确业务错误。
   - 数据库层没有引入任何物理外键，继续遵守“只用逻辑外键”的项目约束。

2. 修改操作采用行内编辑
   - 菜单点击“修改”后，列表项直接切换成输入框与保存/取消按钮。
   - 减少弹窗层级，保持首页操作轻量且连续。
   - `Enter` 可直接提交，`Esc` 可取消。

3. 删除操作采用二次确认 + 红色 toast
   - 删除前统一弹出确认层，避免误删。
   - 删除成功后弹出红色 toast，颜色与危险语义保持一致。
   - 删除当前选中项时，会同步清理当前选中状态，避免首页出现悬空 selection。

4. 三点菜单做成轻量自实现
   - 项目当前没有额外菜单依赖，因此使用原生按钮 + 轻量下拉面板实现。
   - 菜单背景、边框、hover 已统一到当前首页的暖色主题规范。

## 前端结构与数据流

- `useDashboardHome.ts`
  - 统一管理首页列表数据、菜单开关、行内编辑状态、删除确认状态与 toast 状态。
  - 对外暴露创建 / 修改 / 删除 / 选择等回调。
- `FolderSidebar.tsx` 与 `DocumentListPanel.tsx`
  - 负责组装左右两栏的列表结构。
- `FolderSidebarItem.tsx` 与 `DocumentListItem.tsx`
  - 负责单个列表项的展示、菜单触发和行内编辑切换。
- `DashboardItemMenu.tsx`
  - 负责竖向三点按钮和“修改 / 删除”下拉菜单。
- `DashboardDeleteDialog.tsx`
  - 负责删除前的二次确认。
- `DashboardToast.tsx`
  - 负责删除成功后的红色提示反馈。

## 后端接口流程与数据库操作

- `PUT /api/v1/folders/:id`
  - 校验当前用户身份。
  - 校验文件夹 ID 与名称。
  - 在 repository 层执行按 `id + user_id` 更新名称。
- `DELETE /api/v1/folders/:id`
  - 先校验文件夹是否存在。
  - 再统计该文件夹下是否仍有文档。
  - 若非空则返回业务错误；为空才真正删除。
- `PUT /api/v1/documents/:id`
  - 校验当前用户身份、文档 ID 和标题。
  - 在 repository 层按 `id + user_id` 更新标题与 `updated_at`。
- `DELETE /api/v1/documents/:id`
  - 按 `id + user_id` 删除文档。
  - 若不存在则返回明确业务错误。

## 已知 TODO / 待改进项

- 当前首页的“修改文档”仅支持修改标题，尚未提供移动到其他文件夹的能力。
- 三点菜单仍是首页局部实现，后续如果更多页面需要相同模式，可以抽成更通用的通用组件。
- 删除成功 toast 目前是 Dashboard 局部实现，后续可以考虑演进为全局消息系统。