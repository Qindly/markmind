// DropdownMenu.tsx - 提供基于 Radix DropdownMenu 的暖色下拉菜单组件
import * as React from 'react';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { cn } from '../../lib/cn';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

/**
 * DropdownMenuContent - 下拉菜单面板容器。
 * 参数 props: Radix 内容属性与样式类名。
 * 返回值：菜单面板 JSX 结构。
 */
export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-1 text-[var(--color-text-primary)] shadow-soft data-[side=bottom]:animate-toast-slide-in',
          className,
        )}
        ref={ref}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
}

/**
 * DropdownMenuItem - 下拉菜单单项。
 * 参数 props: 菜单项属性、是否缩进与样式类名。
 * 返回值：菜单项 JSX 结构。
 */
export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, inset = false, ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'relative flex h-10 cursor-default select-none items-center rounded-xl px-3 text-sm outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-[var(--color-button-light-hover)]',
        inset ? 'pl-8' : '',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/**
 * DropdownMenuLabel - 下拉菜单分组标题。
 * 参数 props: 菜单标题属性。
 * 返回值：标题 JSX 结构。
 */
export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => {
  return <DropdownMenuPrimitive.Label className={cn('px-3 py-2 text-xs font-medium text-[var(--color-text-muted)]', className)} ref={ref} {...props} />;
});

DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/**
 * DropdownMenuSeparator - 下拉菜单分隔线。
 * 参数 props: 分隔线属性。
 * 返回值：分隔线 JSX 结构。
 */
export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => {
  return <DropdownMenuPrimitive.Separator className={cn('my-1 h-px bg-[var(--color-border-soft)]', className)} ref={ref} {...props} />;
});

DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
