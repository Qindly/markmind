# 36. Dashboard 标题与正文搜索

## 本次任务做了什么
本次任务把 Dashboard 的文档搜索从“前端本地标题过滤”升级成了“当前目录内标题 + 正文搜索”。

完成之后，用户在右侧文档列表头部输入关键字时，会通过后端搜索接口同时匹配当前目录下的文档标题和正文内容；搜索结果仍然沿用首页现有的文档卡片、菜单操作和虚拟列表，不会切成另一套结果页。

## 涉及的文件清单
- `server/internal/dto/document_dto.go`
- `server/internal/repository/document_repository.go`
- `server/internal/service/document_service.go`
- `server/internal/handler/document_handler.go`
- `server/internal/handler/router.go`
- `server/cmd/api/main.go`
- `web/src/types/dashboard.ts`
- `web/src/api/dashboard.ts`
- `web/src/features/dashboard/useDashboardHome.ts`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/src/features/dashboard/components/DocumentListContent.tsx`
- `web/src/features/dashboard/components/DocumentListToolbar.tsx`
- `web/src/features/dashboard/components/DocumentSearchEmptyState.tsx`
- `docs/api.md`
- `docs/plan.md`

## 核心设计决策和原因
- 没有把文档正文直接塞进 `GET /api/v1/dashboard`。
  Dashboard 首页本来只需要文档摘要，如果把所有正文一起返回，会让首页数据量随着文档规模迅速膨胀，不适合作为长期方案。
- 单独新增 `GET /api/v1/documents/search`。
  这样搜索逻辑可以独立演进，后续不管是做高亮、分页还是全文索引，都不会反过来污染首页基础接口。
- 搜索范围继续固定在“当前目录”。
  这样用户仍然先通过左侧目录建立浏览上下文，再在右侧精确检索当前目录内容，交互心智更稳定。
- 空关键字不触发后端搜索。
  用户没有输入关键字时，页面继续直接使用首页已加载的当前目录文档列表，避免无意义请求。
- 搜索结果继续复用现有虚拟列表。
  这样大结果集场景下仍然只渲染可视区附近条目，不会因为增加正文搜索把之前的性能优化抵消掉。

## 前后端数据流说明
- 前端在 `useDashboardHome` 中维护 `searchKeyword`、`searchResults`、`isSearchingDocuments` 和 `searchErrorMessage`。
- 当关键字非空时，前端调用 `GET /api/v1/documents/search`，并把当前选中目录作为 `folder_id` 查询参数传给后端；根目录不传 `folder_id`。
- 后端 service 会先校验关键字与目录归属，再由 repository 执行标题 + 正文的 `ILIKE` 搜索。
- 搜索成功后，前端使用搜索结果替换右侧列表数据源；切换目录时会清空关键字和搜索结果。

## 已知 TODO / 待改进项
- 当前只做基础包含匹配，不支持高亮命中词、拼音检索、模糊排序或全文索引。
- 当前搜索结果仍按 `updated_at DESC, id DESC` 排序，后续如果要做相关性排序，需要单独设计排序规则。
