# 23. 编辑页运行时修复

## 本次任务做了什么
本次修复了编辑页进入后白屏的问题，核心是处理编辑页离开拦截逻辑与当前路由架构不兼容导致的运行时异常。

## 涉及的文件清单
- `web/src/features/editor/usePendingChangesGuard.ts`
- `web/src/features/editor/useDocumentEditor.ts`

## 核心设计决策和原因
- 当前项目使用的是 `BrowserRouter + Routes`，并不是 Data Router。
- `unstable_usePrompt` 底层依赖 `useBlocker`，而 `useBlocker` 需要 Data Router 上下文，因此在当前架构下会直接引发运行时错误。
- 本次采用最小修复方案：移除站内路由级别的 `usePrompt`，保留 `useBeforeUnload` 处理刷新、关闭标签页等浏览器级离开提醒。
- 为了不让用户点击“返回首页”时无提示离开，额外在编辑页返回动作上补充了一个确认弹窗。

## 已知 TODO / 待改进项
- 当前还没有恢复站内通用路由拦截能力。
- 如果后续确实需要更完整的页面级离开拦截，可以单独规划迁移到 `createBrowserRouter + RouterProvider`，再接 `useBlocker` 或自定义确认对话框。
