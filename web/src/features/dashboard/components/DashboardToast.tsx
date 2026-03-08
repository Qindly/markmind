// DashboardToast.tsx - 渲染首页删除操作后的红色反馈提示
export interface DashboardToastProps {
  message: string;
  onClose: () => void;
}

/**
 * DashboardToast - 展示删除成功后的红色 toast 提示。
 * 参数 props: 提示文案与关闭回调。
 * 返回值：toast JSX。
 */
export function DashboardToast({ message, onClose }: DashboardToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-[var(--color-toast-danger-border)] bg-[var(--color-toast-danger-bg)] px-4 py-3 shadow-soft">
      <div className="min-w-0 flex-1 text-sm leading-6 text-[var(--color-toast-danger-text)]">{message}</div>
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--color-toast-danger-text)] transition hover:bg-[rgba(181,51,51,0.08)]" onClick={onClose} type="button">
        ×
      </button>
    </div>
  );
}