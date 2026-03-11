# 38. Dashboard 搜索命中高亮与正文摘要

## 本次任务做了什么
本次任务为 Dashboard 当前目录搜索结果补上了“正文摘要片段 + 关键字高亮”能力。

完成之后，用户在右侧输入关键字搜索文档时，不再只能看到标题和更新时间；如果正文中存在匹配内容，列表会展示命中附近的纯文本摘要片段；标题与摘要中的关键字也会同步高亮，让搜索结果的命中原因更直观。

## 涉及的文件清单
- `server/internal/dto/document_dto.go`
- `server/internal/service/document_service.go`
- `server/internal/util/search_snippet.go`
- `server/internal/util/search_snippet_test.go`
- `web/src/types/dashboard.ts`
- `web/src/features/dashboard/useDashboardHome.ts`
- `web/src/features/dashboard/documentSort.ts`
- `web/src/features/dashboard/documentSearchHighlight.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/src/features/dashboard/components/DocumentListContent.tsx`
- `web/src/features/dashboard/components/DocumentListItem.tsx`
- `docs/api.md`
- `docs/plan.md`

## 核心设计决策和原因
- 搜索结果返回结构从普通文档摘要中解耦，单独增加 `snippet`。
  这样首页普通列表仍然保持轻量，而搜索结果可以按自己的展示需求独立演进，不会反向污染 `GET /api/v1/dashboard` 的基础数据结构。
- 正文摘要由后端生成，前端只负责渲染和高亮。
  文档正文存储的是 Markdown 原文，如果前端在列表里临时处理，会把摘要生成逻辑散落到展示层；放在后端统一生成可以保证接口语义稳定，也方便后续扩展搜索策略。
- 正文命中时优先截取命中附近片段；只有标题命中时才回退到正文开头摘要。
  这样能最大化体现“为什么命中”，同时避免标题命中但正文没有上下文时整张卡片显得过空。
- 高亮只做纯文本切分，不引入新的重型依赖。
  Dashboard 搜索结果只需要轻量文本高亮，不值得为此把 Markdown 渲染或复杂语法分析搬进列表项。

## 前后端数据流说明
- 后端在 `SearchDocuments` 服务中继续沿用当前目录标题 + 正文查询，但在组装返回值时会先把 Markdown 正文清洗为纯文本，再生成 `snippet`。
- 前端把搜索结果类型从普通 `DocumentItem` 拆成搜索专用结构，继续沿用现有搜索状态、排序切换和虚拟列表链路。
- `DocumentListItem` 在搜索态下根据结果项中的 `snippet` 和当前关键字渲染高亮文本；普通列表仍保持原来的简洁展示。

## 已知 TODO / 待改进项
- 当前摘要长度采用固定窗口，不支持按屏幕宽度或用户偏好动态调整。
- 当前高亮基于前端纯文本匹配，不包含命中数量、相关性评分或多关键字分词能力。
