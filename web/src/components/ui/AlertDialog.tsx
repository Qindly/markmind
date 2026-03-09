// AlertDialog.tsx - 提供基于 Radix AlertDialog 的暖色确认弹窗组件
import * as React from 'react';

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

import { cn } from '../../lib/cn';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;
export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;

/**
 * AlertDialogOverlay - 确认弹窗遮罩层。
 * 参数 props: 遮罩层属性与样式类名。
 * 返回值：遮罩 JSX 结构。
 */
export const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  return <AlertDialogPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-[var(--color-overlay)]', className)} ref={ref} {...props} />;
});

AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

/**
 * AlertDialogContent - 确认弹窗主体容器。
 * 参数 props: 内容属性与样式类名。
 * 返回值：弹窗 JSX 结构。
 */
export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-6 shadow-soft',
          className,
        )}
        ref={ref}
        {...props}
      />
    </AlertDialogPortal>
  );
});

AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-3', className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex justify-end gap-3', className)} {...props} />;
}

/**
 * AlertDialogTitle - 确认弹窗标题。
 * 参数 props: 标题属性。
 * 返回值：标题 JSX 结构。
 */
export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  return <AlertDialogPrimitive.Title className={cn('text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]', className)} ref={ref} {...props} />;
});

AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

/**
 * AlertDialogDescription - 确认弹窗说明文案。
 * 参数 props: 描述属性。
 * 返回值：描述 JSX 结构。
 */
export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  return <AlertDialogPrimitive.Description className={cn('text-sm leading-6 text-[var(--color-text-secondary)]', className)} ref={ref} {...props} />;
});

AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
