# 31. 编辑器 ECharts Option 写法兼容

## 本次任务做了什么
本次任务没有扩新功能，而是补了一次 ECharts 代码块输入兼容性修正。

在上一轮里，`echarts` 代码块只支持“直接写对象字面量”这一种格式，因此很多从官方文档或教程里复制过来的示例会因为带有 `option =` 或 `const option =` 而被误判为非法脚本。

这次修正之后，编辑器预览区会同时支持下面三种安全写法：
- `{ ... }`
- `option = { ... }`
- `const option = { ... }`

## 涉及的文件清单
- `web/src/lib/echarts.ts`
- `web/src/features/editor/specialCodeBlockRenderers.ts`

## 核心设计决策和原因
- 兼容逻辑只放在 `parseEChartsOption` 前面的标准化步骤里。
  这样渲染器和图表挂载逻辑都不用改，仍然保持“解析 option -> 初始化图表”的单向流程。
- 继续坚持“只提取对象，不执行脚本”。
  当前实现只是识别并剥离 `option =` / `const option =` 这种安全前缀，最后仍然把对象文本交给 `JSON5.parse`，不会引入 `eval` 或任意脚本执行风险。
- 明确不支持 `let option =`、`var option =`、函数调用和其它表达式。
  这样可以兼容最常见的教程格式，同时保持输入边界简单明确，不把这一层演化成一个 JS 解释器。

## 前端组件结构和数据流说明
- `useSpecialCodeBlockPreview` 和 ECharts 渲染器本轮不变。
- `renderEChartsBlock` 仍然调用 `parseEChartsOption` 获取解析后的对象。
- `parseEChartsOption` 现在会先标准化代码块源码，再交给 `JSON5.parse`。

## 已知 TODO / 待改进项
- 当前仍然不支持 formatter 函数、外部变量引用和任意可执行逻辑。
- 如果后续确实要支持更复杂的 ECharts 示例，需要先重新讨论安全边界，而不是继续直接放宽解析规则。
