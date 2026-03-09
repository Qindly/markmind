# 11-same-surface-border-only

## 本次任务做了什么

在上一轮三层容器配色的基础上，继续将视觉层级进一步简化：除了按钮组件保留独立配色规则，其余绝大多数组件都改为与页面背景相同的 `#FAF9F5`，主要通过淡黑灰色边框来区分层级和边界。

## 涉及文件清单

- `web/src/styles/globals.css`
- `web/src/components/ui/Input.tsx`
- `web/src/features/auth/components/AuthLayout.tsx`
- `web/src/features/auth/components/LoginForm.tsx`
- `web/src/features/auth/components/RegisterForm.tsx`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/components/FolderSidebar.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`

## 核心设计决策和原因

1. 非按钮组件不再通过底色深浅区分
   - 页面背景与主要容器都统一为 `#FAF9F5`。
   - 组件之间主要通过淡黑灰色边框来建立存在感，减少视觉噪音。

2. 按钮继续保留独立语义
   - 深色主按钮仍然使用 `#141413` / `#3C3C3B` / `#FFFFFF`。
   - 浅色按钮继续使用 `#FAF9F5` / `#E8E6DC` / `#73726C`，并依赖边框与背景区分。

3. 选中态从“换底色”改为“加重边框”
   - 首页文件夹列表和文档列表的选中态不再强调背景变化。
   - 改为使用更深一点的边框色与更实一点的文字颜色，让选中态更克制。

4. 提示块与错误块也回到同色背景
   - 普通提示、空状态、错误提示的背景都与页面同色。
   - 错误场景仅通过边框和文字颜色保留语义强调。

## 前端结构与数据流

- 本次依然只改视觉，不改业务逻辑、路由逻辑、接口与状态管理。
- 按钮规则保持不变，其余组件收敛到统一的同色背景语义。

## 已知 TODO / 待改进项

- 后续如果接入编辑器页面，需要继续遵守“非按钮同色 + 边框区分”的风格。
- 如果后续发现某些场景信息层级不够明显，可以优先微调边框粗细和文字权重，而不是重新引入多层底色。
