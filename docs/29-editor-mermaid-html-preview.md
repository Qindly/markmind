# 29. 编辑器 Mermaid 与安全 HTML 预览

## 本次任务做了什么
本次任务继续围绕编辑页右侧实时预览做增强，补上了两个紧密相关的小能力：
- 支持 Markdown 中的原生 HTML 在安全白名单范围内进入预览结果
- 支持 ```mermaid``` 代码块在预览区自动渲染为 Mermaid 图表

这样做完之后，编辑页右侧预览不再只覆盖基础 Markdown、代码高亮和公式，也能承接更接近真实知识库笔记的结构化展示内容。

## 涉及的文件清单
- `web/package.json`
- `web/pnpm-lock.yaml`
- `web/src/lib/markdownPreview.ts`
- `web/src/lib/mermaid.ts`
- `web/src/features/editor/useMermaidPreview.ts`
- `web/src/features/editor/components/MarkdownPreview.tsx`
- `web/src/features/editor/components/EditorWorkspace.tsx`
- `web/src/styles/globals.css`

## 核心设计决策和原因
- 原生 HTML 没有直接放开，而是采用 `remark-rehype({ allowDangerousHtml: true }) + rehype-raw + rehype-sanitize` 的组合。
  这样可以先把 Markdown 中的 HTML 解析进预览树，再通过白名单决定保留哪些标签和属性，避免把危险内容直接塞进 `dangerouslySetInnerHTML`。
- HTML 白名单只开放安全子集。
  当前重点支持 `details`、`summary`、`kbd`、`mark`、`sub`、`sup`、`div`、`span` 等常见展示标签，继续禁止脚本、内联事件和高风险嵌入内容，避免这一轮任务扩到安全策略重构。
- Mermaid 渲染放在客户端增强层，而不是塞回 unified 字符串管线里。
  这样 `markdownPreview` 仍然只负责“把 Markdown 变成安全 HTML”，Mermaid 作为运行时图表库单独由 `useMermaidPreview` 接管，职责边界更清楚，后面接 ECharts 时也能沿着同样的增强思路继续扩。
- Mermaid 使用惰性加载和统一主题配置。
  编辑器里并不是每篇文档都会写 Mermaid，所以运行时按需加载更合适；同时在工具层统一暖色主题变量，避免图表视觉风格和当前编辑页主题脱节。

## 前端组件结构和数据流说明
- `renderMarkdownPreview` 先把 Markdown 解析成安全 HTML，并同步提取标题数据给 TOC。
- `useEditorToc` 继续负责目录树、激活标题和预览 HTML 的产出。
- `MarkdownPreview` 仍然只负责把 HTML 挂进预览容器，但现在会额外调用 `useMermaidPreview` 扫描 `language-mermaid` 代码块并原地替换成图表。
- Mermaid 渲染失败时不会中断预览，其错误提示会插在原始代码块前面，原始 Mermaid 源码仍然保留，方便继续排查语法问题。

## 已知 TODO / 待改进项
- 当前特殊代码块增强只接入了 Mermaid，后续如果继续做 ECharts，建议抽一层更明确的代码块分发入口。
- 原生 HTML 目前只开放安全白名单子集，后续如果真的需要更丰富的嵌入内容，需要单独讨论安全边界，而不是直接继续放宽。
- Mermaid 目前只做预览区渲染，没有加入源码折叠、复制 SVG 或导出图片等增强功能。
