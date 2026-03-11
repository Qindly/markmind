# 41. Dashboard 搜索结果数量与命中来源标签

## 本次任务做了什么
本次任务继续补齐 Dashboard 当前目录搜索的结果语义层，让搜索结果不再只停留在“有无命中”：
- 搜索框右侧会明确展示当前关键字的结果数量
- 每条搜索结果会展示命中来源标签，区分标题命中、正文命中和双命中
- 搜索接口同步返回 `match_sources`，前后端对命中来源的语义保持一致

## 涉及的文件清单
- 后端 DTO 与服务：`server/internal/dto/document_dto.go`、`server/internal/service/document_service.go`
- 后端工具与测试：`server/internal/util/search_match.go`、`server/internal/util/search_match_test.go`
- 前端类型与状态：`web/src/types/dashboard.ts`、`web/src/features/dashboard/useDashboardHome.ts`
- 前端展示层：`web/src/features/dashboard/DashboardPage.tsx`
- Dashboard 列表组件：`web/src/features/dashboard/components/DocumentListPanel.tsx`、`web/src/features/dashboard/components/DocumentListToolbar.tsx`、`web/src/features/dashboard/components/DocumentListItem.tsx`、`web/src/features/dashboard/components/DocumentSearchMatchTags.tsx`
- 文案与文档：`web/src/features/dashboard/documentListPanelLayout.ts`、`docs/api.md`、`docs/plan.md`

## 核心设计决策和原因
- 命中来源由后端显式返回，而不是前端根据标题高亮和摘要片段自行猜测。
  这样前端展示语义和后端搜索规则保持一致，后续如果搜索规则调整，也不需要让前端重复实现一遍命中判定。
- 命中来源类型固定为 `title` / `content`，并锁定返回顺序为标题优先、正文次之。
  这样前端标签渲染不需要再额外排序，也能避免同一份搜索结果在不同地方出现标签顺序漂移。
- 搜索结果数量单独展示在工具栏，而不是继续把“匹配到几篇”塞进描述文案里。
  这样列表头的总量说明和搜索态结果数各自承担不同语义，用户更容易快速扫读。
- 搜索中的小状态和列表中的大状态继续分层处理。
  工具栏结果数会在搜索未完成时显示“搜索中...”，而右侧列表主体仍只在真正发出请求时切到搜索空态，避免防抖阶段把已有结果闪掉。

## 前端组件结构和数据流
- `useDashboardHome` 继续负责搜索关键字、防抖关键字、搜索请求状态和搜索结果，同时新增 `isSearchPending` 与 `searchResultCount` 两个展示层派生状态。
- `DocumentListToolbar` 负责展示搜索输入框、排序切换、结果数量和清空搜索按钮。
- `DocumentListItem` 继续负责搜索标题高亮与摘要展示，并通过 `DocumentSearchMatchTags` 渲染来源标签。

## 后端接口流程和命中判定
- `GET /api/v1/documents/search` 的查询范围保持不变，仍然只搜索当前目录中的标题和正文。
- 服务层在组装响应时，除了生成 `snippet`，还会根据标题和正文是否命中关键字补出 `match_sources`。
- 命中来源判定被提取到 `search_match.go` 工具中，并补了标题命中、正文命中、双命中三类测试。

## 已知 TODO / 待改进项
- 当前搜索结果数量只反映当前目录命中数，还没有扩展到跨目录全局搜索或更复杂的统计维度。
- 命中来源标签只区分标题和正文，不包含“标题前缀命中”“精确命中”等更细粒度语义。
- 搜索结果目前仍按现有排序规则展示，没有引入相关性排序或命中位置优先级。
