# 16-dashboard-radix-interactions

## 本次任务做了什么
本轮继续推进 Dashboard 的交互基座重构：把首页文件夹 / 文档项右侧的三点菜单切换为 Radix DropdownMenu，把删除确认弹层切换为 Radix AlertDialog，并把创建、修改、删除三类操作的反馈统一接入全站顶部 `Toaster`。同时修复了 `Toast.tsx` 中已经写进源码的中文乱码注释，并按历史与备份内容把 `AGENTS.md` 的最新 UI 规范补回到正确中文。

## 涉及文件清单

- `web/package.json`
- `web/pnpm-lock.yaml`
- `web/src/components/ui/DropdownMenu.tsx`
- `web/src/components/ui/AlertDialog.tsx`
- `web/src/components/ui/Toast.tsx`
- `web/src/features/dashboard/components/DashboardItemMenu.tsx`
- `web/src/features/dashboard/components/DashboardDeleteDialog.tsx`
- `web/src/features/dashboard/useDashboardHome.ts`
- `AGENTS.md`
- `docs/16-dashboard-radix-interactions.md`

## 核心设计决策和原因

1. 三点菜单改用 Radix DropdownMenu，而不是继续手写点击外部关闭逻辑
   - 旧实现依赖手动监听 `mousedown` 来判断点击外部关闭，维护成本高，也不利于后续在更多页面复用。
   - 改成 Radix 后，菜单开关、焦点管理和关闭时机由原语托底，前端只需要保留受控 `open` 状态即可。
   - 菜单视觉仍服从当前暖色主题，不回退默认 shadcn 样式。

2. 删除确认改用 Radix AlertDialog
   - 旧实现自己监听 `Escape` 并手写遮罩点击关闭，和三点菜单一样属于“能用但不好复用”的交互实现。
   - 改成 AlertDialog 后，关闭行为、聚焦与语义结构更完整，后续如果还有删除确认场景可以直接复用。

3. 首页全部成功操作统一走顶部消息
   - 创建文件夹、创建文档、修改文件夹、修改文档全部补齐成功消息。
   - 删除继续使用红色危险消息，和用户已经确认的反馈颜色保持一致。
   - 这样首页所有核心操作都走同一条反馈通路，交互感知更统一。

4. `AGENTS.md` 采用“历史基线 + 新规则回填”的方式恢复
   - 主体内容以 Git 历史中的正常中文版本为参考。
   - 当前暖色主题规范与 shadcn/ui 基座补充说明，则按后续备份文件里仍可识别的新增原句恢复。
   - 对其他源码文件不追求逐字还原，只要中文注释可读、语义正确即可。

## 前端结构与数据流

- `DropdownMenu.tsx`
  - 封装暖色主题下拉菜单基础组件，提供 `Content`、`Item`、`Label`、`Separator` 等可复用结构。
- `AlertDialog.tsx`
  - 封装暖色主题确认弹窗基础组件，提供 `Content`、`Header`、`Footer`、`Title`、`Description` 等结构。
- `DashboardItemMenu.tsx`
  - 使用受控 `open` 状态接入 `DropdownMenu`。
  - 保留原有 `isOpen / onToggle / onClose` 接口，避免业务层大面积重构。
- `DashboardDeleteDialog.tsx`
  - 使用 `Boolean(target)` 作为弹窗打开条件。
  - 关闭弹窗时统一回调 `onCancel`，删除确认继续调用 `onConfirm`。
- `useDashboardHome.ts`
  - 维持原有状态组织方式，只在创建 / 修改成功分支补充 `toast(...)`。

## 已知 TODO / 待改进项

- 目前首页的列表、菜单、删除确认已经切到 Radix 原语，但更多复合组件仍是业务层手写结构，后续可以继续向统一的 shadcn/ui 风格基座迁移。
- `AGENTS-2.md`、`AGENTS-3.md` 本身仍是乱码备份快照，如果后续不再需要回溯来源，可以考虑在单独任务中决定是否清理。
