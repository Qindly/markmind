// DocumentSearchFolderTag.tsx - 渲染 Dashboard 全局搜索结果的所属目录标签
import { cn } from '../../../lib/cn';

export interface DocumentSearchFolderTagProps {
  folderName: string;
  isSelected: boolean;
}

/**
 * DocumentSearchFolderTag - 展示全局搜索结果所属目录标签。
 * 参数 props: 所属目录名称与当前是否选中。
 * 返回值：目录标签 JSX；目录名为空时返回 null。
 */
export function DocumentSearchFolderTag({ folderName, isSelected }: DocumentSearchFolderTagProps) {
  if (folderName.trim() === '') {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none',
        isSelected
          ? 'border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.18)] text-[var(--color-option-selected-text)]'
          : 'border-[var(--color-border-soft)] bg-[rgba(20,20,19,0.05)] text-[var(--color-text-primary)]',
      )}
    >
      {folderName}
    </span>
  );
}
