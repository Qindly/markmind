# 24. Markdown 预览质量修复

## 本次任务做了什么
本次围绕编辑页右侧预览的可读性与可用性做了一轮质量修复，重点补齐了三个部分：
- 修复有序列表与无序列表的展示，让编号与层级 marker 正常可见
- 为 fenced code block 接入语法高亮，并改成符合当前暖色主题的高亮配色
- 为 Markdown 预览补齐数学公式能力，同时支持内联公式和块级公式

## 涉及的文件清单
- 依赖与锁文件：`web/package.json`、`web/pnpm-lock.yaml`
- 预览管线：`web/src/lib/markdownPreview.ts`
- 全局样式：`web/src/styles/globals.css`
- 应用入口：`web/src/main.tsx`

## 核心设计决策和原因
- 继续沿用 `unified` 管线，在工具层集中扩展 `remark-math`、`rehype-katex` 与 `rehype-highlight`，避免把解析和渲染细节散落到页面组件。
- `rehype-sanitize` 仍然保留在管线中，并放在高亮与公式插件之前，先对 Markdown 转出的基础 HTML 做清洗，再让受信任的插件生成增强结构，这样能在安全边界和功能完整性之间保持平衡。
- 列表样式优先通过 CSS 修复，而不是额外插入 DOM 结构。这样不会污染渲染结果，也更方便后续继续扩展 TOC、锚点跳转等能力。
- 代码高亮不直接套用默认深色主题，而是根据项目当前暖色护眼风格手工定义 token 颜色，避免预览区域出现突兀的深色块。

## 前端结构与数据流说明
- `MarkdownPreview` 仍然只负责接收 Markdown 文本并展示 HTML。
- `renderMarkdownToHtml` 在 `web/src/lib/markdownPreview.ts` 中统一处理 GFM、公式、高亮和安全清洗。
- `web/src/styles/globals.css` 负责把列表 marker、代码高亮 token 和公式展示外观统一到项目现有主题。

## 已知 TODO / 待改进项
- 当前已经补齐公式渲染，但 Mermaid、ECharts 等特殊代码块还没有进入统一渲染分发层。
- 代码高亮目前使用通用高亮方案，后续如果要更细的语言体验，可以再单独规划语言包收敛与主题细化。
- 列表层级 marker 已恢复，但如果后续要支持更复杂的富文本粘贴内容，还可以再追加一轮边界样式测试。
