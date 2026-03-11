// renderEChartsSpecialCodeBlock.ts - 按需渲染 ECharts 特殊代码块
import { mountEChartsChart, parseEChartsOption } from '../../../lib/echarts';
import type { SpecialCodeBlockRenderContext } from '../specialCodeBlockRenderers';

// renderEChartsSpecialCodeBlock - 将 ECharts option 代码块渲染到图表容器中。
// 参数 context: 当前代码块源码与视口容器。
// 返回值：用于销毁图表实例的清理函数。
export async function renderEChartsSpecialCodeBlock({
  source,
  viewportElement,
}: SpecialCodeBlockRenderContext): Promise<() => void> {
  const option = parseEChartsOption(source);
  return mountEChartsChart(viewportElement, option);
}
