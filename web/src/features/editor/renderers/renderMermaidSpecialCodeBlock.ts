// renderMermaidSpecialCodeBlock.ts - 按需渲染 Mermaid 特殊代码块
import { renderMermaidSvg } from '../../../lib/mermaid';
import type { SpecialCodeBlockRenderContext } from '../specialCodeBlockRenderers';

// renderMermaidSpecialCodeBlock - 将 Mermaid 源码渲染到预览区视口容器中。
// 参数 context: 当前代码块源码与视口容器。
// 返回值：无，副作用为写入 SVG 内容。
export async function renderMermaidSpecialCodeBlock({
  source,
  viewportElement,
}: SpecialCodeBlockRenderContext): Promise<void> {
  viewportElement.innerHTML = await renderMermaidSvg(source);
}
