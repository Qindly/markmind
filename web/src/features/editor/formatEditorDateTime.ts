// formatEditorDateTime.ts - 提供编辑器模块通用的时间格式化函数
// formatEditorDateTime - 将 ISO 时间字符串格式化为中文可读时间。
// 参数 value: 原始时间字符串。
// 返回值：格式化后的时间文案。
export function formatEditorDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '时间未知';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
