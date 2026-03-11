# 18-dashboard-item-shadcn-refactor

## 本次任务做了什么
本轮继续把 Dashboard 的细颗粒度组件往 shadcn/ui 基座收口：新增了业务级共享组件 `DashboardListItem`，把根目录条目、文件夹条目和文档条目统一到同一套卡片壳子、边框、悬浮态与选中态之下；同时把行内重命名表单改成基于 `Card + CardContent + Input + Button` 的组合结构，减少首页中手写 `div + border` 的分散实现。

## 涉及文件清单

- `web/src/features/dashboard/components/DashboardListItem.tsx`
- `web/src/features/dashboard/components/FolderRootItem.tsx`
- `web/src/features/dashboard/components/FolderSidebarItem.tsx`
- `web/src/features/dashboard/components/DocumentListItem.tsx`
- `web/src/features/dashboard/components/DashboardInlineNameEditor.tsx`
- `docs/18-dashboard-item-shadcn-refactor.md`

## 核心设计决策和原因

1. 使用业务级共享组件，而不是继续在通用 `ui/` 下抽象
   - 目录项和文档项虽然都属于“列表项”，但它们的布局细节仍然强依赖 Dashboard 业务。
   - 把共性收敛到 `features/dashboard/components/DashboardListItem.tsx`，既能统一样式，又不会把过于业务化的结构塞进通用组件层。

2. 列表项统一建立在 `Card` 基座之上
   - 这一轮不是只复用类名，而是让根目录、文件夹、文档三种列表项都建立在 `Card + CardContent` 之上。
   - 这样可以和之前已经改造过的主面板、弹窗、提示块保持一致的 shadcn/ui 基座思路。

3. 行内重命名表单也同步收口
   - 仅仅统一列表展示态还不够，编辑态如果继续手写边框容器，视觉与结构会重新分叉。
   - 因此把 `DashboardInlineNameEditor` 也切到 `Card`，保证展示态和编辑态的容器语义一致。

## 前端结构与数据流

- `DashboardListItem.tsx`
  - 负责列表项外层卡片、默认态、悬浮态、选中态与按钮焦点样式。
  - 通过 `action` 插槽承载右侧三点菜单，避免文件夹项和文档项重复写布局壳子。
- `FolderRootItem.tsx`
  - 改为基于 `DashboardListItem` 渲染根目录项。
- `FolderSidebarItem.tsx`
  - 只保留文件夹自身文案与菜单行为，容器与交互壳子交给 `DashboardListItem`。
- `DocumentListItem.tsx`
  - 只保留标题、更新时间、编号等文档字段展示，统一复用共享壳子。
- `DashboardInlineNameEditor.tsx`
  - 编辑态改为 `Card + Input + Button` 组合，和展示态保持同一套设计语言。

## 已知 TODO / 待改进项

- Dashboard 里仍有少量业务按钮使用的是已有 `Button` 组件直接微调类名；如果后续希望进一步收口，可以继续梳理是否需要补充更细的 `Button` 变体。
- 当前这轮聚焦的是首页列表区域，编辑器页与鉴权页的细颗粒度组件是否继续统一到同一基座，可以在下一轮任务中再单独拆分讨论。
