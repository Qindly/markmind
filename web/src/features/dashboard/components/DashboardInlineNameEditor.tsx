// DashboardInlineNameEditor.tsx - 提供首页列表项的行内重命名表单
import type { FormEvent, KeyboardEvent } from 'react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export interface DashboardInlineNameEditorProps {
  value: string;
  placeholder: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}

/**
 * DashboardInlineNameEditor - 渲染列表项行内修改表单。
 * 参数 props: 当前值、占位文案、提交状态与交互回调。
 * 返回值：行内编辑 JSX。
 */
export function DashboardInlineNameEditor({
  value,
  placeholder,
  isSubmitting,
  onChange,
  onCancel,
  onSubmit,
}: DashboardInlineNameEditorProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    onCancel();
  }

  return (
    <form className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-3" onSubmit={handleSubmit}>
      <Input
        autoFocus
        maxLength={120}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={value}
      />
      <div className="mt-3 flex gap-2">
        <Button className="h-9 w-auto px-3 text-xs" isLoading={isSubmitting} type="submit">
          保存
        </Button>
        <Button className="h-9 w-auto px-3 text-xs" onClick={onCancel} type="button" variant="danger">
          取消
        </Button>
      </div>
    </form>
  );
}