// Toast.tsx - 鎻愪緵鍩轰簬 Radix Toast 鐨?shadcn/ui 椋庢牸娑堟伅缁勪欢
import * as React from 'react';

import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '../../lib/cn';

export const ToastProvider = ToastPrimitives.Provider;

/**
 * ToastViewport - 鍏ㄧ珯娑堟伅鐨勯《閮ㄥ眳涓鍣ㄣ€? * 杩斿洖鍊硷細娑堟伅瑙嗗彛 JSX 缁撴瀯銆? */
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Viewport
      className={cn(
        'pointer-events-none fixed left-1/2 top-4 z-[120] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 p-4 sm:max-w-lg',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border px-4 py-3 shadow-soft transition-all data-[state=open]:animate-toast-slide-in data-[state=closed]:animate-toast-hide',
  {
    variants: {
      variant: {
        default: 'border-[var(--color-border-soft)] bg-[var(--color-page-bg)] text-[var(--color-text-primary)]',
        destructive: 'border-[var(--color-toast-danger-border)] bg-[var(--color-toast-danger-bg)] text-[var(--color-toast-danger-text)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {}

/**
 * Toast - 鍗曟潯娑堟伅缁勪欢銆? * 鍙傛暟 props: Toast 鍘熻灞炴€т笌瑙嗚鍙樹綋銆? * 杩斿洖鍊硷細鍗曟潯娑堟伅 JSX 缁撴瀯銆? */
export const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProps>(
  ({ className, variant, ...props }, ref) => {
    return <ToastPrimitives.Root className={cn(toastVariants({ variant }), className)} ref={ref} {...props} />;
  },
);

Toast.displayName = ToastPrimitives.Root.displayName;

/**
 * ToastTitle - 娑堟伅鏍囬銆? * 杩斿洖鍊硷細鏍囬 JSX 缁撴瀯銆? */
export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => {
  return <ToastPrimitives.Title className={cn('text-sm font-medium', className)} ref={ref} {...props} />;
});

ToastTitle.displayName = ToastPrimitives.Title.displayName;

/**
 * ToastDescription - 娑堟伅姝ｆ枃銆? * 杩斿洖鍊硷細姝ｆ枃 JSX 缁撴瀯銆? */
export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => {
  return <ToastPrimitives.Description className={cn('text-sm leading-6', className)} ref={ref} {...props} />;
});

ToastDescription.displayName = ToastPrimitives.Description.displayName;

/**
 * ToastClose - 娑堟伅鍏抽棴鎸夐挳銆? * 杩斿洖鍊硷細鍏抽棴鎸夐挳 JSX 缁撴瀯銆? */
export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Close
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-current transition hover:bg-[rgba(20,20,19,0.06)]',
        className,
      )}
      ref={ref}
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  );
});

ToastClose.displayName = ToastPrimitives.Close.displayName;