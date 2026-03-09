// cn.ts - 提供 shadcn/ui 风格的类名合并工具
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn - 合并并去重 Tailwind 类名。
 * 参数 inputs: 任意数量的类名片段。
 * 返回值：整理后的类名字符串。
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}