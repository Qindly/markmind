# 20-display-layer-shadcn-unification

## 本次任务做了什么
本轮继续完成路线 B：把剩余的展示层片段统一收口到 shadcn/ui 风格基座。新增了 `Eyebrow`、`InfoBlock`、`SectionHeader`、`EmptyState` 等展示组件，用来统一品牌介绍块、区块头部、空状态和信息摘要；同时拆出 `FolderSidebarHeader`，把 Dashboard 左侧目录栏顶部的用户信息与目录说明区统一到新的展示组件中。AuthLayout、DocumentListPanel、FolderSidebar、PageState 以及 Toaster 的部分文案承载结构也同步切换到这套展示基座。

## 涉及文件清单

- `web/src/components/ui/Eyebrow.tsx`
- `web/src/components/ui/InfoBlock.tsx`
- `web/src/components/ui/SectionHeader.tsx`
- `web/src/components/ui/EmptyState.tsx`
- `web/src/features/dashboard/components/FolderSidebarHeader.tsx`
- `web/src/features/auth/components/AuthLayout.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/src/features/dashboard/components/FolderSidebar.tsx`
- `web/src/components/ui/PageState.tsx`
- `web/src/components/ui/Toaster.tsx`
- `AGENTS.md`
- `docs/20-display-layer-shadcn-unification.md`

## 核心设计决策和原因

1. 展示层也统一进入 `components/ui/`
   - 之前项目已经基本完成了交互层的 shadcn/ui 收口，但页面里仍有不少手写的展示片段。
   - 这轮把这些“无业务逻辑但会反复出现”的展示结构抽到 `components/ui/`，让页面组件只保留业务编排。

2. 小型辅助标题与信息摘要拆开处理
   - `Eyebrow` 负责承载 `MARKMIND`、`Dashboard` 这类小型辅助标题。
   - `InfoBlock` 负责承载标题 + 说明文案组合，适合品牌介绍、用户摘要、底部说明等多种场景。
   - 这样比把所有展示块硬塞进一个“大组件”更容易复用和组合。

3. 区块头部与空状态做成显式组件
   - `SectionHeader` 统一了区块的标题、副标题和右侧操作区。
   - `EmptyState` 统一了空状态和轻提示内容块，替代页面内散落的提示壳子。
   - 这两个组件已经覆盖 Auth、Dashboard 和全屏状态页中的主要展示模式。

## 前端结构与数据流

- `Eyebrow.tsx`
  - 负责统一辅助标题的文字样式。
- `InfoBlock.tsx`
  - 负责统一信息摘要、品牌介绍与说明文案的展示结构。
- `SectionHeader.tsx`
  - 负责统一区块头部与操作按钮区域。
- `EmptyState.tsx`
  - 负责统一空状态与轻提示内容块。
- `FolderSidebarHeader.tsx`
  - 负责组合目录栏顶部的用户信息摘要与“新建文件夹”标题区。

## 已知 TODO / 待改进项

- 当前页面最外层的 `main / div / flex / grid` 仍然作为布局容器保留，这些属于布局骨架而不是可复用展示片段，暂不继续抽象。
- 如果未来新增编辑器页或更多设置页，可以直接优先复用 `SectionHeader`、`InfoBlock`、`EmptyState`，避免再次出现手写展示块回流。
