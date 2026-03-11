# 26. 编辑页布局与 TOC 交互修正

## 本次任务做了什么
本次围绕编辑页的可用性与视觉层级做了一轮针对性修正，重点解决了四个问题：
- 将顶部信息区调整为 2 行 2 列的状态卡片，不再占用左侧目录空间
- 将 TOC 目录导航改成桌面端固定在屏幕左侧的导航栏
- 修复点击 TOC 后未稳定滚动到对应预览标题的问题
- 将项目的选中色统一收口到更柔和的 #F3EADF

## 涉及的文件清单
- 编辑页布局：web/src/features/editor/components/EditorWorkspace.tsx
- 顶部信息区：web/src/features/editor/components/EditorInfoPanel.tsx
- TOC 面板与目录项：web/src/features/editor/components/EditorTocPanel.tsx、web/src/features/editor/components/EditorTocItem.tsx
- TOC 联动逻辑：web/src/features/editor/useEditorToc.ts
- 全局主题与选中色：web/src/styles/globals.css
- 列表项菜单选中态：web/src/features/dashboard/components/DashboardItemMenu.tsx

## 核心设计决策和原因
- 顶部信息区改成居中的 2x2 卡片布局，让状态信息更像概览，也不再挤占目录导航区域。
- TOC 在桌面端使用固定定位，这样页面整体滚动时目录仍然可见；移动端则自动退回普通流式布局，避免遮挡正文。
- 目录点击跳转从滚动预览容器调整为滚动页面到预览标题，因为当前预览区域本身并不是内部滚动容器，这样更符合实际页面滚动行为。
- 当前章节高亮改为基于窗口滚动位置推导，并继续保留 hash 同步与祖先自动展开，保证目录、页面和地址栏三者状态一致。
- 选中色统一切换到 #F3EADF 后，相关文字同步改回深色系，保持淡黄色背景下的可读性。

## 已知 TODO / 待改进项
- 当前 TOC 仍然只负责预览导航，还没有做到点击目录后同步定位 CodeMirror 光标。
- 固定 TOC 目前只在桌面端启用，后续如果要进一步优化移动端，可以单独规划抽屉式目录导航。
- 顶部信息区目前仍然是只读展示，后续如果要支持编辑页直接改标题，可以在此区域继续扩展交互。
