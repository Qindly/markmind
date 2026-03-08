# 15-shadcn-ui-foundation

## 本次任务做了什么
本轮把前端基础 UI 基座正式切换到了 shadcn/ui 风格实现，并补齐了全站顶部消息系统。核心目标是：保留当前已经确认的暖色护眼主题与圆角边框风格，但把基础交互能力统一到更标准、可扩展的组件体系上。

## 涉及文件清单

- `web/package.json`
- `web/pnpm-lock.yaml`
- `web/src/lib/cn.ts`
- `web/src/components/ui/Button.tsx`
- `web/src/components/ui/Input.tsx`
- `web/src/components/ui/Card.tsx`
- `web/src/components/ui/Toast.tsx`
- `web/src/components/ui/Toaster.tsx`
- `web/src/hooks/useToast.ts`
- `web/src/App.tsx`
- `web/src/styles/globals.css`
- `web/src/features/auth/LoginPage.tsx`
- `web/src/features/auth/RegisterPage.tsx`
- `web/src/features/auth/components/AuthLayout.tsx`
- `web/src/features/auth/components/LoginForm.tsx`
- `web/src/features/auth/components/RegisterForm.tsx`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/useDashboardHome.ts`
- `AGENTS.md`

## 核心设计决策和原因

1. 不直接引入整套现成 UI 包，而是采用 shadcn/ui 的源码式思路
   - shadcn/ui 本身更像一套“源码模板 + 约定”，适合按需把组件源码纳入项目。
   - 这样既能获得更标准的交互结构，又不会失去我们自己的主题控制权。

2. 保留现有配色体系，不回退到 shadcn 默认主题
   - 用户已经多轮确认过当前暖色背景、深灰文字、边框层次和按钮 hover 规则。
   - 因此本轮只把交互基座切换到 shadcn 风格，不改视觉语言。

3. Toast 做成全站顶部消息，而不是继续停留在 Dashboard 局部
   - 顶部居中、从正上方滑入的消息反馈，更贴近 ElMessage 这种用户感知更强的交互方式。
   - 统一接入 `App` 层后，登录页、Dashboard 以及后续更多页面都能复用。

4. 当前只把真正的“基础组件”切到 shadcn 风格
   - `Button`、`Input`、`Card`、`Toast` 已完成统一。
   - 三点菜单、删除确认弹层等复合业务组件暂时保留现有实现，避免这一轮范围失控。

## 前端结构与数据流

- `cn.ts`
  - 由原来的简单字符串拼接，升级为 `clsx + tailwind-merge` 组合，满足 shadcn 风格组件的类名合并需求。
- `Button / Input / Card`
  - 保持原有对外导出名称，避免业务层大面积重写。
  - 内部改为更标准的 variant/forwardRef 结构。
- `Toast / Toaster / useToast`
  - 由 Radix Toast 原语承载交互。
  - `useToast.ts` 维护全局消息状态。
  - `App.tsx` 挂载 `Toaster`，形成全站统一入口。
- `LoginPage`
  - 将路由 state 中的 notice 转成顶部全站消息。
- `useDashboardHome`
  - 删除成功后不再渲染局部 toast，而是直接触发全站顶部消息。

## 已知 TODO / 待改进项

- 当前全站消息系统已经可复用，但首页中的“创建成功 / 修改成功”仍未统一接入，如后续需要可继续迁移。
- 删除确认弹层和三点菜单还不是 shadcn/Radix 风格组件，如果后续继续推进 UI 基建，可以拆成下一轮任务。
- 登录/注册错误提示目前仍保留为页面内联错误块，这是为了保留表单错误的稳定可见性；后续如需统一策略，可再讨论是否加入全站消息。