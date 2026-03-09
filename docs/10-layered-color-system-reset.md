# 10-layered-color-system-reset

## 本次任务做了什么

根据新的视觉要求，将上一版偏深的暖色主题重置为更克制的三层容器配色体系。新的规则以 `#FAF9F5` 作为页面背景，以白色作为一级主容器，通过白色与浅米色交替来区分组件层级，同时统一按钮、文字和边框颜色。

## 涉及文件清单

- `web/src/styles/globals.css`
- `web/src/components/ui/Button.tsx`
- `web/src/components/ui/Card.tsx`
- `web/src/components/ui/Input.tsx`
- `web/src/features/auth/components/AuthLayout.tsx`
- `web/src/features/auth/components/LoginForm.tsx`
- `web/src/features/auth/components/RegisterForm.tsx`
- `web/src/features/dashboard/components/FolderSidebar.tsx`
- `web/src/features/dashboard/components/DocumentListPanel.tsx`
- `web/tailwind.config.ts`
- `web/tailwind.config.js`

## 核心设计决策和原因

1. 固定三层容器颜色，不再自由推导暖色层级
   - 页面背景固定为 `#FAF9F5`。
   - 一级容器固定为 `#FFFFFF`。
   - 二级容器固定为 `#FAF9F5`。
   - 三级容器如有需要则回到 `#FFFFFF`。
   - 这样可以让组件嵌套关系始终稳定，不会因为继续“设计发挥”而越调越深。

2. 按钮区分回到两个明确基准
   - 主按钮使用 `#141413`，文字白色，hover 为 `#3C3C3B`。
   - 浅色按钮使用 `#FAF9F5`，文字 `#73726C`，hover 为 `#E8E6DC`。
   - 当按钮与背景直接相连时，允许两者同色，只靠淡灰边框区分。

3. 文字与边框统一收敛
   - 主文字统一为 `#3D3D3A`。
   - 次级文字统一为 `#73726C`。
   - 所有普通边框统一改为淡灰色，避免出现上一版偏棕、偏深的边框观感。

4. 首页与鉴权页都遵守同一层级规则
   - 登录注册页、首页侧栏、首页主文档区全部作为一级白色容器。
   - 容器内部的表单块、列表项、空状态和说明块统一回到二级浅色背景。
   - 选中项在必要时通过“白底 + 更明显边框”突出，而不再依赖深色底块。

## 前端结构与数据流

- 本次仍然只改样式系统，不改接口、状态、页面结构和业务逻辑。
- 鉴权模块与首页模块的组件拆分保持不变，只替换内部视觉层级与按钮样式。
- 后续新增页面时，只需继续沿用这套三层颜色规则，不需要重新设计新的容器色。

## 已知 TODO / 待改进项

- 当前危险按钮仍保留红色强调，后续如果需要也可以再统一出更细的状态色规范。
- 编辑器页面尚未接入，后续实现时也需要遵守这套页面背景 / 一级容器 / 二级容器的层级规则。
