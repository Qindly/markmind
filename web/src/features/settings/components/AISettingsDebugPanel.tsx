// AISettingsDebugPanel.tsx - 展示设置页 Provider 探活返回的调试请求与响应详情
import type { AIProviderDebugInfo } from '../../../types/settings';

export interface AISettingsDebugPanelProps {
  debugInfo: AIProviderDebugInfo;
}

function formatDebugHeaders(headers?: Record<string, string>) {
  if (!headers || Object.keys(headers).length === 0) {
    return '无';
  }

  return JSON.stringify(headers, null, 2);
}

/**
 * AISettingsDebugPanel - 展示设置页测试接口返回的上游请求与响应调试信息。
 * 参数 props: 当前一次探活返回的调试快照。
 * 返回值：可展开的调试详情面板。
 */
export function AISettingsDebugPanel({ debugInfo }: AISettingsDebugPanelProps) {
  return (
    <details className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-primary)]">查看本次上游请求与返回</summary>
      <div className="mt-4 space-y-4 text-sm text-[var(--color-text-primary)]">
        <section className="space-y-2">
          <h3 className="font-medium">请求信息</h3>
          <pre className="overflow-x-auto rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3 leading-6 text-[var(--color-text-primary)]">
{`${debugInfo.request_method} ${debugInfo.request_url}

headers:
${formatDebugHeaders(debugInfo.request_headers)}

body:
${debugInfo.request_body || '无'}`}
          </pre>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">返回信息</h3>
          <pre className="overflow-x-auto rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3 leading-6 text-[var(--color-text-primary)]">
{`status: ${debugInfo.response_status_code ?? '无响应'}

headers:
${formatDebugHeaders(debugInfo.response_headers)}

body:
${debugInfo.response_body || debugInfo.network_error || '无'}`}
          </pre>
        </section>
      </div>
    </details>
  );
}
