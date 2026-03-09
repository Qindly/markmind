// FolderCreateForm.tsx - 渲染首页左侧目录栏中的新建文件夹表单
import type { FormEvent } from 'react';

import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

export interface FolderCreateFormProps {
  value: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

/**
 * FolderCreateForm - 新建文件夹的行内表单。
 * 参数 props: 输入值、提交状态与交互回调。
 * 返回值：新建表单 JSX 结构。
 */
export function FolderCreateForm({ value, isSubmitting, onChange, onSubmit, onCancel }: FolderCreateFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <Card className="mt-4 rounded-2xl shadow-none">
      <CardContent className="p-4 pt-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input autoFocus maxLength={64} onChange={(event) => onChange(event.target.value)} placeholder="请输入文件夹名称" value={value} />
          <div className="flex gap-3">
            <Button className="h-10 w-auto px-4" isLoading={isSubmitting} type="submit">
              确认创建
            </Button>
            <Button className="h-10 w-auto px-4" disabled={isSubmitting} onClick={onCancel} type="button" variant="danger">
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
