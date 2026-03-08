// Card.tsx - 提供登录注册页面复用的卡片容器组件
import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';

import { cn } from '../../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children?: ReactNode;
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: ReactNode;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

/**
 * Card - 卡片容器组件
 * 参数 props: 标准 div 属性
 * 返回值：卡片 JSX 结构
 */
export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface-level-1)] p-8 shadow-soft', className)} {...props} />;
}

/**
 * CardHeader - 卡片头部容器
 * 参数 props: 标准 div 属性
 * 返回值：头部 JSX 结构
 */
export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('space-y-2', className)} {...props} />;
}

/**
 * CardTitle - 卡片标题
 * 参数 props: 标准标题属性
 * 返回值：标题 JSX 结构
 */
export function CardTitle({ className, ...props }: CardTitleProps) {
  return <h1 className={cn('text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]', className)} {...props} />;
}

/**
 * CardDescription - 卡片描述
 * 参数 props: 标准段落属性
 * 返回值：描述 JSX 结构
 */
export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p className={cn('text-sm leading-6 text-[var(--color-text-secondary)]', className)} {...props} />;
}

/**
 * CardContent - 卡片正文容器
 * 参数 props: 标准 div 属性
 * 返回值：正文 JSX 结构
 */
export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('mt-8', className)} {...props} />;
}

/**
 * CardSection - 轻量内容包装组件
 * 参数 children: 需要包裹的子节点
 * 返回值：内容片段 JSX 结构
 */
export function CardSection({ children }: PropsWithChildren) {
  return <div className="space-y-6">{children}</div>;
}
