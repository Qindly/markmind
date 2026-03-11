// mermaid.ts - 封装 Mermaid 运行时加载与暖色主题渲染配置
import type mermaid from 'mermaid';

type MermaidInstance = typeof mermaid;

let mermaidModulePromise: Promise<MermaidInstance> | null = null;
let hasInitialized = false;
let renderSequence = 0;

// getMermaidInstance - 懒加载 Mermaid 模块并只初始化一次全局配置。
// 返回值：可直接调用 render 的 Mermaid 实例。
async function getMermaidInstance(): Promise<MermaidInstance> {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import('mermaid').then((module) => module.default);
  }

  const mermaidInstance = await mermaidModulePromise;
  if (!hasInitialized) {
    mermaidInstance.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: "Inter, 'Segoe UI', sans-serif",
      themeVariables: {
        background: '#FAF9F5',
        clusterBkg: '#F3F1E8',
        clusterBorder: '#D8D6CF',
        edgeLabelBackground: '#FAF9F5',
        lineColor: '#73726C',
        mainBkg: '#FAF9F5',
        nodeBorder: '#C9C7BF',
        primaryBorderColor: '#C9C7BF',
        primaryColor: '#ECE6D8',
        primaryTextColor: '#3D3D3A',
        secondaryBorderColor: '#D8D6CF',
        secondaryColor: '#F3F1E8',
        tertiaryBorderColor: '#D8D6CF',
        tertiaryColor: '#FAF9F5',
      },
    });
    hasInitialized = true;
  }

  return mermaidInstance;
}

// renderMermaidSvg - 将 Mermaid 源码渲染为 SVG 字符串。
// 参数 source: 当前代码块中的 Mermaid 文本内容。
// 返回值：可直接插入页面的 SVG 字符串。
export async function renderMermaidSvg(source: string): Promise<string> {
  const mermaidInstance = await getMermaidInstance();
  renderSequence += 1;

  const { svg } = await mermaidInstance.render(`markmind-mermaid-${renderSequence}`, source);
  return svg;
}
