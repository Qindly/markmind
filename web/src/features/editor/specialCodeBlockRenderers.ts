// specialCodeBlockRenderers.ts - 管理编辑器预览区特殊代码块的渲染器注册与分发配置
import { mountEChartsChart, parseEChartsOption } from '../../lib/echarts';
import { renderMermaidSvg } from '../../lib/mermaid';

export interface SpecialCodeBlockRenderContext {
  source: string;
  viewportElement: HTMLDivElement;
}

export interface SpecialCodeBlockRenderer {
  language: string;
  displayName: string;
  emptyMessage: string;
  render: (context: SpecialCodeBlockRenderContext) => Promise<void | (() => void)>;
  getErrorMessage: (error: unknown) => string;
}

// getDefaultErrorMessage - 为特殊代码块渲染失败提供统一兜底提示。
// 参数 error: 渲染过程中抛出的异常对象。
// 参数 fallbackMessage: 当前渲染器的默认文案。
// 返回值：适合直接展示在预览区的错误信息。
function getDefaultErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
}

// renderMermaidBlock - 将 Mermaid 文本渲染到指定视口容器中。
// 参数 context: 当前代码块源码和渲染容器。
async function renderMermaidBlock({
  source,
  viewportElement,
}: SpecialCodeBlockRenderContext): Promise<void> {
  viewportElement.innerHTML = await renderMermaidSvg(source);
}

// renderEChartsBlock - 将 ECharts option 对象渲染到指定图表容器中。
// 参数 context: 当前代码块源码和渲染容器。
// 返回值：用于销毁图表实例的清理函数。
async function renderEChartsBlock({
  source,
  viewportElement,
}: SpecialCodeBlockRenderContext): Promise<() => void> {
  const option = parseEChartsOption(source);
  return mountEChartsChart(viewportElement, option);
}

export const specialCodeBlockRenderers: SpecialCodeBlockRenderer[] = [
  {
    language: 'mermaid',
    displayName: 'Mermaid',
    emptyMessage: '请填写 Mermaid 图表内容。',
    render: renderMermaidBlock,
    getErrorMessage: (error) => getDefaultErrorMessage(error, '请检查当前 Mermaid 语法是否完整。'),
  },
  {
    language: 'echarts',
    displayName: 'ECharts',
    emptyMessage: '请编写 `{}`、`option = {}` 或 `const option = {}`。',
    render: renderEChartsBlock,
    getErrorMessage: (error) =>
      getDefaultErrorMessage(
        error,
        '请确认当前 echarts 代码块使用的是 `{}`、`option = {}` 或 `const option = {}`。',
      ),
  },
];

// getSpecialCodeBlockRenderer - 根据代码块语言名称返回已注册的特殊渲染器。
// 参数 language: 去掉 language- 前缀后的代码块语言名。
// 返回值：命中的渲染器配置，未命中时返回 undefined。
export function getSpecialCodeBlockRenderer(language: string): SpecialCodeBlockRenderer | undefined {
  return specialCodeBlockRenderers.find((renderer) => renderer.language === language);
}
