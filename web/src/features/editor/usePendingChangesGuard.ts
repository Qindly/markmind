// usePendingChangesGuard.ts - 为编辑页提供浏览器级未保存内容离开提醒
import { useCallback } from 'react';
import { useBeforeUnload } from 'react-router-dom';

// usePendingChangesGuard - 在存在未保存内容时拦截刷新、关闭标签页等浏览器离开操作。
// 参数 shouldBlock: 是否需要阻止离开当前页面。
export function usePendingChangesGuard(shouldBlock: boolean) {
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (!shouldBlock) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    },
    [shouldBlock],
  );

  useBeforeUnload(handleBeforeUnload, { capture: true });
}
