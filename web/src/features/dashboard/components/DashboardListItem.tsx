// DashboardListItem.tsx - 提供首页目录与文档列表共用的列表项壳子
import type { ReactNode } from 'react';

import { Card, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../lib/cn';

export interface DashboardListItemProps {
  isSelected: boolean;
  onSelect: () => void;
  children: ReactNode;
  action?: ReactNode;
  actionClassName?: string;
  className?: string;
  contentClassName?: string;
  buttonClassName?: string;
}

/**
 * DashboardListItem - 统一首页列表项的边框、悬浮与选中态外壳。
 * 参数 props: 选中状态、点击回调、主内容、可选操作区与样式扩展。
 * 返回值：列表项壳子 JSX。
 */
export function DashboardListItem({
  isSelected,
  onSelect,
  children,
  action,
  actionClassName,
  className,
  contentClassName,
  buttonClassName,
}: DashboardListItemProps) {
  return (
    <Card
      className={cn(
        'rounded-2xl shadow-none transition',
        isSelected
          ? 'border-[var(--color-option-selected)] bg-[var(--color-option-selected)] text-[var(--color-option-selected-text)]'
          : 'border-[var(--color-border-soft)] bg-[var(--color-page-bg)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-button-light-hover)]',
        className,
      )}
    >
      <CardContent className={cn('flex gap-3 p-0', contentClassName)}>
        <button
          className={cn(
            'min-w-0 flex-1 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[rgba(20,20,19,0.05)]',
            buttonClassName,
          )}
          onClick={onSelect}
          type="button"
        >
          {children}
        </button>
        {action ? <div className={cn('shrink-0', actionClassName)}>{action}</div> : null}
      </CardContent>
    </Card>
  );
}
