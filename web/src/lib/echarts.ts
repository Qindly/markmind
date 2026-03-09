// echarts.ts - 封装 ECharts 运行时加载、option 解析与图表挂载逻辑
import JSON5 from 'json5';
import type { EChartsOption } from 'echarts';

type EChartsModule = typeof import('echarts');

let echartsModulePromise: Promise<EChartsModule> | null = null;

const ECHARTS_OPTION_ASSIGNMENT_PATTERN = /^(?:const\s+)?option\s*=\s*([\s\S]+)$/;

// getEChartsModule - 懒加载 ECharts 运行时，避免未使用图表时增加首屏负担。
// 返回值：可用于初始化图表实例的 ECharts 模块。
async function getEChartsModule(): Promise<EChartsModule> {
  if (!echartsModulePromise) {
    echartsModulePromise = import('echarts');
  }

  return echartsModulePromise;
}

// getEChartsParseErrorMessage - 将 option 解析错误整理为统一提示文案。
// 参数 error: JSON5 解析阶段抛出的异常对象。
// 返回值：适合直接展示给用户的中文错误信息。
function getEChartsParseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return `option 对象解析失败：${error.message.trim()}`;
  }

  return 'option 对象解析失败，请检查逗号、引号和括号是否完整。';
}

// normalizeEChartsOptionSource - 将代码块源码标准化为可交给 JSON5 解析的对象文本。
// 参数 source: 当前 echarts 代码块中的原始文本。
// 返回值：去掉安全前缀后的 option 对象字符串。
function normalizeEChartsOptionSource(source: string): string {
  const trimmedSource = source.trim();
  if (!trimmedSource) {
    throw new Error('代码块不能为空，请编写 `{}`、`option = {}` 或 `const option = {}`。');
  }

  const sourceWithoutTrailingSemicolon = trimmedSource.replace(/;\s*$/, '');
  if (
    sourceWithoutTrailingSemicolon.startsWith('let option') ||
    sourceWithoutTrailingSemicolon.startsWith('var option')
  ) {
    throw new Error('仅支持 `{}`、`option = {}` 和 `const option = {}` 三种安全写法。');
  }

  if (
    sourceWithoutTrailingSemicolon.startsWith('{') &&
    sourceWithoutTrailingSemicolon.endsWith('}')
  ) {
    return sourceWithoutTrailingSemicolon;
  }

  const assignmentMatch = sourceWithoutTrailingSemicolon.match(ECHARTS_OPTION_ASSIGNMENT_PATTERN);
  if (!assignmentMatch) {
    throw new Error('仅支持 `{}`、`option = {}` 和 `const option = {}` 三种安全写法。');
  }

  const optionSource = assignmentMatch[1]?.trim() ?? '';
  if (!optionSource.startsWith('{') || !optionSource.endsWith('}')) {
    throw new Error('仅支持把 option 赋值为对象字面量，不支持函数调用或其它脚本片段。');
  }

  return optionSource;
}

// parseEChartsOption - 解析代码块中的 ECharts option 对象。
// 参数 source: 当前 echarts 代码块中的原始文本。
// 返回值：可直接传给 ECharts 的 option 对象。
export function parseEChartsOption(source: string): EChartsOption {
  const normalizedOptionSource = normalizeEChartsOptionSource(source);

  try {
    const parsedValue = JSON5.parse(normalizedOptionSource);
    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      throw new Error('option 顶层必须是对象。');
    }

    return parsedValue as EChartsOption;
  } catch (error) {
    throw new Error(getEChartsParseErrorMessage(error));
  }
}

// mountEChartsChart - 在指定容器中挂载 ECharts 图表并返回清理函数。
// 参数 container: 用于承载图表的容器元素。
// 参数 option: 已经解析完成的 ECharts option 对象。
// 返回值：用于销毁图表实例和观察器的清理函数。
export async function mountEChartsChart(
  container: HTMLDivElement,
  option: EChartsOption,
): Promise<() => void> {
  const echartsModule = await getEChartsModule();
  const chart = echartsModule.init(container, undefined, {
    renderer: 'canvas',
  });

  chart.setOption(option);
  chart.resize();

  const resizeObserver = new ResizeObserver(() => {
    chart.resize();
  });
  resizeObserver.observe(container);

  return () => {
    resizeObserver.disconnect();
    chart.dispose();
  };
}
