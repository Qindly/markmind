# 42. Dashboard 跨目录全局搜索与所属目录标签

## 本次任务做了什么
本次任务把 Dashboard 搜索从“只能搜当前目录”升级成了“当前目录 / 全部文档”可切换模式：
- 工具栏新增搜索范围切换，支持在当前目录搜索和跨目录全局搜索之间切换
- 全局搜索结果会展示所属目录标签，帮助用户快速判断文档上下文
- 搜索接口显式接入 `scope` 参数，并返回 `folder_name` 供前端稳定展示

## 涉及的文件清单
- 后端搜索链路：`server/internal/dto/document_dto.go`、`server/internal/handler/document_handler.go`、`server/internal/service/document_service.go`、`server/internal/repository/document_repository.go`
- 前端类型与请求：`web/src/types/dashboard.ts`、`web/src/api/dashboard.ts`
- 前端状态与页面：`web/src/features/dashboard/useDashboardHome.ts`、`web/src/features/dashboard/DashboardPage.tsx`
- Dashboard 组件：`web/src/features/dashboard/components/DocumentListPanel.tsx`、`web/src/features/dashboard/components/DocumentListToolbar.tsx`、`web/src/features/dashboard/components/DocumentListContent.tsx`、`web/src/features/dashboard/components/DocumentListItem.tsx`
- 新增展示组件：`web/src/features/dashboard/components/DocumentSearchScopeToggle.tsx`、`web/src/features/dashboard/components/DocumentSearchFolderTag.tsx`
- 文档：`docs/api.md`、`docs/plan.md`

## 核心设计决策和原因
- 搜索范围使用显式 `scope` 参数，而不是继续只靠 `folder_id` 缺失与否来推断。
  因为“根目录当前目录搜索”和“全部文档搜索”都会出现 `folder_id` 缺失的情况，如果不显式区分，接口语义会冲突。
- 全局搜索结果直接返回 `folder_name`，而不是要求前端根据 `folder_id` 再拼目录名。
  这样即使前端本地目录列表和搜索结果出现短暂不同步，结果卡片仍能稳定显示所属目录标签。
- 搜索范围切换做成工具栏单选，而不是在切目录时偷偷改变搜索范围。
  这样用户能明确知道自己是在“当前目录搜”还是“全部文档搜”，不会把目录浏览和搜索范围混淆。
- 全局搜索期间切换左侧目录不会清空关键字和结果。
  目录浏览是一个独立上下文；既然用户已经显式选择了“全部文档”，切目录时应该保留搜索结果，避免打断搜索流。

## 前端组件结构和数据流
- `useDashboardHome` 新增 `searchScope`、`isGlobalSearchActive`、`documentPanelTitle`、`documentPanelTotalCount` 等派生状态，并统一管理范围切换、目录切换和搜索请求参数。
- `DocumentListToolbar` 负责展示搜索输入框、搜索范围切换、排序切换、结果数量和清空搜索按钮。
- `DocumentListItem` 在全局搜索态下额外渲染所属目录标签，同时继续复用已有的命中来源标签、高亮摘要和更新时间展示。

## 后端接口流程和搜索范围
- `GET /api/v1/documents/search` 现在支持 `scope=current_folder` 与 `scope=global` 两种模式。
- `scope=current_folder` 时：
  - 传 `folder_id` 表示搜索指定文件夹
  - 不传 `folder_id` 表示搜索根目录
- `scope=global` 时：
  - 忽略目录过滤，搜索当前用户全部文档
  - 同时为每条结果补充 `folder_name`

## 已知 TODO / 待改进项
- 当前所属目录标签只负责展示，不支持点击后自动跳转并切换到对应目录。
- 搜索结果仍按现有排序模式处理，没有引入相关性排序。
- 还没有继续扩展“搜索历史”“最近关键词”“目录维度二次筛选”等增强能力。
