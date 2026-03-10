# 36. Dashboard 文档搜索与关键字过滤

## 本次任务做了什么
本次任务只处理 Dashboard 右侧当前目录内的文档搜索，没有新增后端接口，而是在前端本地补了一层实时关键字过滤。

完成之后，用户可以在文档列表头部直接输入关键字，按文档标题实时筛选当前目录下的文档；如果没有匹配结果，会显示专门的搜索空状态，并提供“清空搜索”入口。

## 涉及的文件清单
- `web/src/features/dashboard/useDashboardHome.ts`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/src/features/dashboard/components/DocumentListContent.tsx`
- `web/src/features/dashboard/components/DocumentListToolbar.tsx`
- `web/src/features/dashboard/components/DocumentSearchEmptyState.tsx`
- `docs/36-dashboard-document-search.md`

## 核心设计决策和原因
- 搜索只在前端本地完成，不新增后端接口。
  Dashboard 当前已经一次性拿到了当前用户的文档列表，这一轮只做当前目录内标题过滤，本地计算足够简单直接，也不会把范围扩成全文检索。
- 搜索只覆盖当前目录，不做跨目录聚合。
  用户当前已经通过左侧目录栏建立了浏览上下文，这一轮继续沿着“先选目录，再筛文档”的交互走，复杂度更可控。
- 切换目录时清空搜索词。
  这样用户切到新目录后看到的一定是完整结果，不会因为上一个目录的关键字把新目录列表悄悄过滤掉。
- 搜索空状态与“目录本身为空”分开处理。
  当前目录有文档但没有命中结果时，需要明确告诉用户是“搜索没命中”，而不是“目录没有文档”。
- 虚拟列表继续基于过滤后的结果工作。
  这样在大列表搜索场景下仍然只渲染可视区附近条目，不会因为新增搜索而把之前的性能优化打回去。

## 前端数据流说明
- `useDashboardHome` 先根据 `selectedFolderId` 计算当前目录文档，再根据 `searchKeyword` 派生过滤后的结果。
- `DashboardPage` 把过滤结果、原始数量和搜索关键字传给 `DocumentListPanel`。
- `DocumentListPanel` 负责组合头部搜索工具条、过滤结果描述、搜索空状态和现有虚拟列表。

## 已知 TODO / 待改进项
- 当前只支持标题包含匹配，不支持正文搜索、拼音搜索、模糊排序或高亮命中词。
- 当前切换目录会清空关键字；如果后续用户明确希望跨目录保留搜索词，需要重新讨论交互预期。
