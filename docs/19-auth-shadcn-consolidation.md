# 19-auth-shadcn-consolidation

## 本次任务做了什么
本轮继续把前端剩余的鉴权区域收口到 shadcn/ui 风格基座：新增了轻量表单字段组件 `FormField` 与字段提示组件 `FieldMessage`，同时补充了全屏页面状态组件 `PageState`，用于统一游客路由和受保护路由在启动阶段的占位展示。登录页与注册页的表单、错误提示、布局卡片结构也同步迁移到现有的 `Card / Input / Button / Alert` 体系中。

## 涉及文件清单

- `web/src/components/ui/FieldMessage.tsx`
- `web/src/components/ui/FormField.tsx`
- `web/src/components/ui/PageState.tsx`
- `web/src/features/auth/components/AuthLayout.tsx`
- `web/src/features/auth/components/LoginForm.tsx`
- `web/src/features/auth/components/RegisterForm.tsx`
- `web/src/features/auth/components/GuestRoute.tsx`
- `web/src/features/auth/components/ProtectedRoute.tsx`
- `docs/19-auth-shadcn-consolidation.md`

## 核心设计决策和原因

1. 只补轻量表单展示基座，不引入完整表单系统
   - 当前登录和注册表单字段数量很少，交互逻辑也不复杂。
   - 如果此时引入完整表单系统，会明显超出当前任务范围，也会增加理解成本。
   - 因此这一轮只补“标签 + 控件 + 提示”的展示层组件，保持工程化与克制并存。

2. 路由启动占位统一收口到页面状态组件
   - `GuestRoute` 和 `ProtectedRoute` 原先各自手写全屏居中文案，结构分散且不利于后续扩展。
   - 新增 `PageState` 后，这类全屏状态可以用同一套暖色卡片结构承载，和全站 UI 基座保持一致。

3. AuthLayout 继续建立在 Card 基座上
   - 左侧介绍区与右侧表单区本质上都是页面中的卡片容器，继续用 `Card` 能和 Dashboard 的收口方向保持一致。
   - 嵌套卡片只通过边框与留白区分层级，不再依赖更深的背景色差。

4. 错误提示统一交给 Alert 负责
   - 登录与注册表单顶部的错误块原本是手写危险容器。
   - 改为 `Alert` 后，危险提示与 Dashboard 页面内错误块共享同一套视觉与结构语义。

## 前端结构与数据流

- `FormField.tsx`
  - 负责渲染字段标签、控件区与可选提示文案。
- `FieldMessage.tsx`
  - 负责承载字段下方的次级说明或危险提示。
- `PageState.tsx`
  - 负责全屏居中状态卡片，当前用于鉴权路由的启动阶段占位。
- `LoginForm.tsx` / `RegisterForm.tsx`
  - 保持原有提交逻辑与前端校验规则不变，只替换表单展示结构。
- `AuthLayout.tsx`
  - 保持双栏布局不变，只把视觉容器进一步统一到 `Card` 体系下。

## 已知 TODO / 待改进项

- 当前 `FormField` 和 `FieldMessage` 只覆盖基础展示需求，后续如果表单页增多，再考虑是否需要补充更完整的字段描述、字段错误状态或表单分组组件。
- 登录页和注册页底部的跳转提示目前仍是各自页面中的轻量文案结构；如果未来鉴权页继续扩展，可以再评估是否提取为单独的鉴权页辅助组件。
