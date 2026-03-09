# 09-claude-theme-refactor

## 本次任务做了什么

参考 Claude 官网的暖米黄阅读风格，对 MarkMind 现有前端样式进行了一次整体重构。新的视觉体系不再以冷灰黑白卡片为主，而是改为“淡黄色主背景 + 黑色文字 + 浅深层级区分组件”的护眼设计。

## 涉及文件清单

- `web/src/styles/globals.css`
- `web/src/components/ui/Button.tsx`
- `web/src/components/ui/Card.tsx`
- `web/src/components/ui/Input.tsx`
- `web/src/features/auth/components/AuthLayout.tsx`
- `web/src/features/auth/components/LoginForm.tsx`
- `web/src/features/auth/components/RegisterForm.tsx`
- `web/src/features/auth/components/GuestRoute.tsx`
- `web/src/features/auth/components/ProtectedRoute.tsx`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/components/FolderSidebar.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/tailwind.config.ts`
- `web/tailwind.config.js`

## 核心设计决策和原因

1. 以暖色阅读体验替代冷色科技感
   - 参考 Claude 官网的整体气质，采用低饱和淡黄色作为页面主背景。
   - 让页面更适合 Markdown 与文档类场景的长时间阅读，而不是继续强调偏冷的“控制台感”。

2. 深色只保留给文字与主按钮
   - 移除登录页原先的大面积深色品牌面板。
   - 深色只用于正文文字、标题和主按钮，避免整体对比过强导致视觉疲劳。

3. 组件层级主要靠背景深浅区分
   - 一级容器、二级容器、输入框、空状态、选中态都采用浅黄色不同深浅进行分层。
   - 不再依赖纯白卡片或纯黑选中块来制造视觉差异。

4. 通用组件先统一，再让页面自然收敛
   - 先重构全局变量、按钮、输入框、卡片和阴影，再把登录、注册和首页页面切到同一语义。
   - 这样后续新增页面时，可以直接沿用暖色主题而不是继续手写零散颜色类。

## 前端结构与数据流

- 本次只调整视觉系统，不改变任何接口、状态管理和页面业务流程。
- 鉴权页仍使用 `AuthLayout + LoginForm / RegisterForm` 的拆分方式。
- 首页仍使用 `DashboardPage + FolderSidebar + DocumentListPanel + useDashboardHome` 的结构，只是把视觉语义替换成新的暖色主题。

## 已知 TODO / 待改进项

- 当前只是完成了现有页面的 Claude 风格收敛，后续新增编辑器页面时也需要继续复用这套暖色层级体系。
- 如果后续页面数量增多，可以把现在的颜色变量再进一步抽象成更明确的 surface / text / status 设计 token 命名。
