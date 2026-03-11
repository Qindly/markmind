# 08-warm-theme-dashboard-polish

## 本次任务做了什么

将项目整体视觉从偏冷的白灰背景调整为更护眼的淡黄色背景氛围，同时保留主内容卡片、文字与主要交互的黑白极简风格。除此之外，还修复了首页新建文件夹表单中取消按钮不易识别的问题，并将首页布局调整为更接近全屏展示。

## 涉及文件清单

- `web/src/styles/globals.css`
- `web/src/components/ui/Button.tsx`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/components/FolderSidebar.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/src/features/auth/components/AuthLayout.tsx`
- `web/src/features/auth/components/LoginForm.tsx`

## 核心设计决策和原因

1. 保留“内容白、背景暖”的信息层级
   - 页面背景与弱提示底板切换为淡黄色，增强护眼感。
   - 承载真实内容的卡片、输入框和主按钮继续保持白底或黑底主视觉，避免信息层级被冲淡。

2. 通过通用按钮变体统一语义
   - 在 `Button` 中加入默认、次级、危险三类视觉变体。
   - 首页取消按钮改为危险态红色，解决白底上文字不明显的问题，也让“取消”语义更清楚。

3. 首页改为近全屏布局
   - 去掉首页原本的居中限宽，让左侧导航更贴近页面左边。
   - 同时保留少量页面边距，避免界面完全顶死浏览器边缘而显得拥挤。

4. 登录注册页保留深色品牌面板
   - 页面整体氛围切到暖色，但左侧品牌介绍区继续保留深色，维持视觉锚点与品牌识别度。

## 前端结构与数据流

- 本次任务只调整视觉层，不改变首页、登录页、注册页的状态流和接口调用逻辑。
- 首页仍然由 `DashboardPage` 组合左侧目录栏与右侧文档列表，状态仍由 `useDashboardHome` 管理。
- 鉴权页仍沿用 `AuthLayout + LoginForm / RegisterForm` 的拆分结构，仅调整布局与提示样式。

## 已知 TODO / 待改进项

- 当前暖色主题仍以类名和全局变量配合实现，后续如果页面继续增多，可以再抽象成更完整的主题 token 体系。
- 当前仅覆盖首页和鉴权页的主要视觉场景，未来新增页面时需要继续复用这套暖色背景语义。
