# 17-dashboard-shadcn-consolidation

## 本次任务做了什么
本轮继续把 Dashboard 往 shadcn/ui 风格基座收口：新增了通用 `Alert` 组件来统一页面内错误提示、加载态与空状态；将左右两侧主面板进一步建立在 `Card` 结构之上；把超出 150 行限制的 `FolderSidebar.tsx` 拆出独立的 `FolderCreateForm.tsx` 和 `FolderRootItem.tsx`。同时对 `AGENTS.md` 做了最后一轮核对，确认当前文件已经整合了三份 AGENTS 文件中的有效新增内容，并删除了 `AGENTS-2.md`、`AGENTS-3.md` 两个仅剩备份意义的乱码快照。

## 涉及文件清单

- `web/src/components/ui/Alert.tsx`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/components/FolderSidebar.tsx`
- `web/src/features/dashboard/components/FolderCreateForm.tsx`
- `web/src/features/dashboard/components/FolderRootItem.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `AGENTS.md`
- `docs/17-dashboard-shadcn-consolidation.md`
- `AGENTS-2.md`（删除）
- `AGENTS-3.md`（删除）

## 核心设计决策和原因

1. 页面内反馈块统一收口到 `Alert`
   - 顶部消息已经由 `Toast / Toaster` 负责瞬时反馈，但 Dashboard 仍有加载占位、空状态、内联错误提示这类“停留型反馈块”。
   - 这类结构继续手写 `div + border + text` 容易和已有 shadcn/ui 基座脱节，因此本轮新增 `Alert` 做统一承载。

2. 主面板继续建立在 `Card` 结构之上
   - 左侧目录栏和右侧文档面板本质上都是页面中的大卡片容器，适合继续往 `Card / CardHeader / CardContent` 收口。
   - 这样后续如果 Dashboard 继续扩展更多分区，结构层次会更稳定。

3. 严格遵守单文件 150 行限制
   - `FolderSidebar.tsx` 已超过约束，因此本轮把新建文件夹表单拆到 `FolderCreateForm.tsx`，把根目录条目拆到 `FolderRootItem.tsx`。
   - 拆分后 Sidebar 仅保留“布局 + 状态切换 + 子组件编排”职责，更符合当前项目的组件拆分规范。

4. `AGENTS.md` 以当前文件作为最终规范来源
   - 经核对，`AGENTS-2.md` / `AGENTS-3.md` 中仍可直接识别的有效新增内容，当前 `AGENTS.md` 已覆盖。
   - 本轮再补回一条“不要使用高饱和艳色”的风格补充说明后，可确认两个备份文件已不再包含独立有效规则，因此删除。

## 前端结构与数据流

- `Alert.tsx`
  - 负责 Dashboard 页面内内联提示的统一结构与样式变体。
- `DashboardPage.tsx`
  - 页面级错误提示改为 `Alert`。
- `FolderSidebar.tsx`
  - 主容器切到 `Card`。
  - 新建文件夹表单外提到 `FolderCreateForm.tsx`。
  - 根目录条目外提到 `FolderRootItem.tsx`。
  - 空目录提示改为 `Alert`。
- `DocumentListPanel.tsx`
  - 主容器切到 `Card`。
  - 加载态与空状态改为 `Alert`。

## 已知 TODO / 待改进项

- Dashboard 的列表项本身仍然是业务组件手写结构，当前重点是统一面板和反馈块；后续如需进一步收口，可以再讨论是否抽象出更通用的列表项基座。
- `AGENTS.md` 目前已是唯一保留规范文件，后续若再次演进提示词，建议直接修改该文件并避免再生成并行备份，减少恢复成本。
