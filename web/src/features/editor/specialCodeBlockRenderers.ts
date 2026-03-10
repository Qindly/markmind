// specialCodeBlockRenderers.ts - 管理编辑器预览区特殊代码块的渲染器注册、按需加载与分发配置

export interface SpecialCodeBlockRenderContext {
  source: string;
  viewportElement: HTMLDivElement;
}

export interface LoadedSpecialCodeBlockRenderer {
  render: (context: SpecialCodeBlockRenderContext) => Promise<void | (() => void)>;
}

export interface SpecialCodeBlockRenderer {
  language: string;
  displayName: string;
  loadingMessage: string;
  emptyMessage: string;
  load: () => Promise<LoadedSpecialCodeBlockRenderer>;
  getErrorMessage: (error: unknown) => string;
}

let mermaidRendererPromise: Promise<LoadedSpecialCodeBlockRenderer> | null = null;
let echartsRendererPromise: Promise<LoadedSpecialCodeBlockRenderer> | null = null;

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

// loadMermaidRenderer - 按需加载 Mermaid 代码块渲染器模块。
// 返回值：包含 Mermaid 渲染函数的运行时对象。
function loadMermaidRenderer(): Promise<LoadedSpecialCodeBlockRenderer> {
  if (!mermaidRendererPromise) {
    mermaidRendererPromise = import('./renderers/renderMermaidSpecialCodeBlock').then((module) => ({
      render: module.renderMermaidSpecialCodeBlock,
    }));
  }

  return mermaidRendererPromise;
}

// loadEChartsRenderer - 按需加载 ECharts 代码块渲染器模块。
// 返回值：包含 ECharts 渲染函数的运行时对象。
function loadEChartsRenderer(): Promise<LoadedSpecialCodeBlockRenderer> {
  if (!echartsRendererPromise) {
    echartsRendererPromise = import('./renderers/renderEChartsSpecialCodeBlock').then((module) => ({
      render: module.renderEChartsSpecialCodeBlock,
    }));
  }

  return echartsRendererPromise;
}

export const specialCodeBlockRenderers: SpecialCodeBlockRenderer[] = [
  {
    language: 'mermaid',
    displayName: 'Mermaid',
    loadingMessage: '正在加载 Mermaid 渲染器...',
    emptyMessage: '请填写 Mermaid 图表内容。',
    load: loadMermaidRenderer,
    getErrorMessage: (error) => getDefaultErrorMessage(error, '请检查当前 Mermaid 语法是否完整。'),
  },
  {
    language: 'echarts',
    displayName: 'ECharts',
    loadingMessage: '正在加载 ECharts 渲染器...',
    emptyMessage: '请编写 `{}`、`option = {}` 或 `const option = {}`。',
    load: loadEChartsRenderer,
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
