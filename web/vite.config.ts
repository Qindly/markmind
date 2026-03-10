import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/src/features/auth/') &&
            !id.includes('/src/features/auth/components/GuestRoute.tsx') &&
            !id.includes('/src/features/auth/components/ProtectedRoute.tsx')
          ) {
            return 'auth-page';
          }

          if (id.includes('/src/features/dashboard/')) {
            return 'dashboard-page';
          }

          if (
            id.includes('/src/lib/markdownPreview.ts') ||
            id.includes('node_modules/unified') ||
            id.includes('node_modules/remark-') ||
            id.includes('node_modules/rehype-') ||
            id.includes('node_modules/highlight.js') ||
            id.includes('node_modules/lowlight') ||
            id.includes('node_modules/katex') ||
            id.includes('node_modules/micromark') ||
            id.includes('node_modules/hast-') ||
            id.includes('node_modules/mdast-') ||
            id.includes('node_modules/unist-') ||
            id.includes('node_modules/vfile') ||
            id.includes('node_modules/trough') ||
            id.includes('node_modules/bail') ||
            id.includes('node_modules/property-information') ||
            id.includes('node_modules/space-separated-tokens') ||
            id.includes('node_modules/comma-separated-tokens') ||
            id.includes('node_modules/parse5')
          ) {
            return 'editor-preview';
          }

          if (
            id.includes('node_modules/mermaid') ||
            id.includes('/src/lib/mermaid.ts') ||
            id.includes('/src/features/editor/renderers/renderMermaidSpecialCodeBlock.ts')
          ) {
            return 'editor-mermaid';
          }

          if (
            id.includes('node_modules/echarts') ||
            id.includes('node_modules/zrender') ||
            id.includes('node_modules/json5') ||
            id.includes('/src/lib/echarts.ts') ||
            id.includes('/src/features/editor/renderers/renderEChartsSpecialCodeBlock.ts')
          ) {
            return 'editor-echarts';
          }

          if (
            (id.includes('/src/features/editor/') &&
              !id.includes('/src/features/editor/renderers/')) ||
            id.includes('/src/lib/codeMirror.ts') ||
            id.includes('node_modules/@codemirror/') ||
            id.includes('node_modules/@uiw/react-codemirror') ||
            id.includes('node_modules/codemirror/')
          ) {
            return 'editor-page';
          }

          return undefined;
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
