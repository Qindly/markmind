# 37. Dashboard 文档排序切换

## 本次任务做了什么
本次任务为 Dashboard 右侧文档列表新增了“最近更新 / 标题”排序切换，并让普通列表和当前目录搜索结果统一复用同一套排序规则。

完成之后，用户无论是在正常浏览当前目录，还是已经输入关键字查看搜索结果，都可以在右侧工具栏即时切换排序方式；列表内容会立刻重排，虚拟列表和现有文档操作不需要切换到另一套渲染流程。

此外，本次也补充了 `AGENTS.md` 的组件拆分例外说明：组件行数优先控制在 150 行以内，但当职责已经天然闭合、继续拆分只会增加理解成本时，允许保留必要的超出。

## 涉及的文件清单
- `web/src/types/dashboard.ts`
- `web/src/features/dashboard/documentSort.ts`
- `web/src/features/dashboard/useDashboardHome.ts`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/src/features/dashboard/components/DocumentListToolbar.tsx`
- `web/src/features/dashboard/components/DocumentSortToggle.tsx`
- `AGENTS.md`
- `docs/plan.md`

## 核心设计决策和原因
- 排序逻辑独立抽到 `documentSort.ts`。
  这样首页 Hook 不需要继续堆积排序细节，后续如果再增加“创建时间”或“名称倒序”等排序项，也只需要扩展独立工具模块。
- 排序只在前端本地完成，不改后端接口。
  当前 Dashboard 已经拿到了当前目录列表和搜索结果所需的最小摘要字段，本地重排就能满足需求，没有必要为一个展示层切换增加额外接口复杂度。
- 普通列表与搜索结果共用同一排序模式。
  这样用户不需要记忆“搜索结果一套规则、普通列表另一套规则”，也避免工具栏状态和实际列表顺序不一致。
- 标题排序使用 A-Z 升序，并在标题相同时回退到更新时间倒序。
  这样既符合常见文件管理器的默认认知，也能保证排序结果稳定，不会因为标题重复而出现顺序抖动。

## 前端组件与数据流说明
- `useDashboardHome` 新增 `documentSortMode` 状态，并在普通列表与搜索结果进入渲染前统一调用排序工具函数。
- `DocumentListToolbar` 新增排序切换入口，内部通过 `DocumentSortToggle` 展示“最近更新 / 标题”两种模式。
- `DocumentListPanel` 继续作为右侧列表面板的编排层，只负责把排序状态和切换回调透传给工具栏。
- 虚拟列表仍然消费最终的 `filteredDocuments`，因此排序切换后不会破坏现有滚动窗口计算逻辑。

## 已知 TODO / 待改进项
- 当前排序模式只保存在页面内存中，刷新页面后会恢复成默认的“最近更新”。
- 当前标题排序直接使用浏览器本地字符串比较策略，没有额外接入拼音首字母或更复杂的自然语言排序规则。
