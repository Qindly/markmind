// cn.ts - 拼接 Tailwind 类名字符串
export type ClassValue = string | false | null | undefined;

// cn - 过滤空值后拼接类名
// 参数 values: 待拼接的类名片段
// 返回值：整理后的类名字符串
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
