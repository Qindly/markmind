# 30. 编辑器特殊代码块分发器与 ECharts 预览

## 本次任务做了什么
本次任务把编辑页右侧预览里的特殊代码块增强从“只支持 Mermaid 的单点实现”升级成了“统一分发入口 + 多渲染器”的结构，并接入了第二个实际渲染器 ECharts。

完成之后，编辑器预览区对特殊代码块的效果变成了：
- ` ```mermaid ` 代码块会继续自动渲染成 Mermaid 图
- ` ```echarts ` 代码块会在预览区自动渲染成图表
- 普通代码块仍保持原来的语法高亮展示，不会被误处理
- 渲染失败时会展示错误提示，同时保留原始代码块源码，方便继续修改

## 涉及的文件清单
- `web/package.json`
- `web/pnpm-lock.yaml`
- `web/src/lib/echarts.ts`
- `web/src/lib/mermaid.ts`
- `web/src/features/editor/specialCodeBlockRenderers.ts`
- `web/src/features/editor/useSpecialCodeBlockPreview.ts`
- `web/src/features/editor/components/MarkdownPreview.tsx`
- `web/src/features/editor/components/EditorWorkspace.tsx`
- `web/src/styles/globals.css`

## 核心设计决策和原因
- 特殊代码块的入口统一收敛到 `useSpecialCodeBlockPreview`。
  这样 `MarkdownPreview` 仍然只负责挂载预览 HTML，真正的特殊代码块识别、分发、替换与清理由单独 hook 统一处理，后续继续接更多渲染器时不会再堆一排单独 hook。
- 渲染器通过注册表管理，而不是把语言判断写死在 hook 里。
  当前只接入 Mermaid 和 ECharts，但结构上已经变成“语言名 -> 渲染器配置”的模式，后面如果加第三种特殊代码块，只需要补一个新渲染器而不是改整条预览链。
- `echarts` 代码块只支持直接编写 option 对象。
  解析阶段使用 `json5`，允许更接近教程示例的对象写法，比如单引号、未加引号的 key 和尾逗号，但不支持 `const option = ...`、函数体和任意脚本片段，避免把本轮任务扩成脚本沙箱问题。
- ECharts 图表实例的生命周期放在工具层封装。
  `mountEChartsChart` 负责初始化图表、设置 option、监听容器尺寸变化以及销毁实例，hook 层只负责调用和回收，职责边界更清楚。

## 前端组件结构和数据流说明
- `renderMarkdownPreview` 继续负责把 Markdown 转成安全 HTML，并产出 TOC 需要的标题数据。
- `MarkdownPreview` 先把 HTML 塞进预览容器，再调用 `useSpecialCodeBlockPreview` 扫描 `pre > code` 节点。
- `useSpecialCodeBlockPreview` 会根据代码块的 `language-*` class 提取语言名，再去 `specialCodeBlockRenderers` 注册表里查找对应渲染器。
- Mermaid 渲染器仍然调用 `renderMermaidSvg`，但现在是通过统一分发器接入。
- ECharts 渲染器会先把代码块文本解析为 option 对象，再初始化图表实例并绑定容器尺寸变化监听。

## 已知 TODO / 待改进项
- 当前 ECharts 只支持直接写 option 对象，不支持 formatter 函数、外部变量引用或任意脚本逻辑。
- 由于新增了 ECharts 运行时，前端产物体积进一步上涨；如果后续继续接更多图表库，建议单独规划更细的懒加载或 manual chunks。
- 当前特殊代码块只覆盖 Mermaid 和 ECharts，后续如果真的要继续扩展，建议把“代码块标题栏 / 复制源码 / 折叠源码”等交互也统一沉淀到这一层。
