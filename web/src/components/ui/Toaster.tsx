// Toaster.tsx - 渲染全站顶部消息容器
import { useToast } from '../../hooks/useToast';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './Toast';

/**
 * Toaster - 应用级顶部消息容器。
 * 返回值：全站消息 JSX 结构。
 */
export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={2600}>
      {toasts.map(({ id, title, description, variant, duration, ...props }) => (
        <Toast duration={duration} key={id} variant={variant} {...props}>
          <div className="min-w-0 flex-1 space-y-1 pr-1">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? <ToastDescription>{description}</ToastDescription> : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
