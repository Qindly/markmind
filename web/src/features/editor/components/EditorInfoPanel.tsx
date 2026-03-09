// EditorInfoPanel.tsx - 渲染编辑页左侧的文档信息与保存状态面板
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../lib/cn';
import type { DocumentDetail, DocumentSavePhase } from '../../../types/document';
import { formatEditorDateTime } from '../formatEditorDateTime';

export interface EditorInfoPanelProps {
  document: DocumentDetail;
  savePhase: DocumentSavePhase;
  statusMessage: string;
}

function getStatusInputClassName(savePhase: DocumentSavePhase): string | undefined {
  switch (savePhase) {
    case 'save-error':
      return 'border-[var(--color-toast-danger-border)] text-[var(--color-toast-danger-text)]';
    case 'dirty':
    case 'autosaving':
    case 'manual-saving':
      return 'border-[var(--color-border-strong)] text-[var(--color-text-primary)]';
    case 'saved':
    default:
      return undefined;
  }
}

/**
 * EditorInfoPanel - 展示文档只读信息与保存状态。
 * 参数 props: 文档详情、保存阶段与状态文案。
 * 返回值：信息面板 JSX 结构。
 */
export function EditorInfoPanel({ document, savePhase, statusMessage }: EditorInfoPanelProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-5">
      <FormField label="文档标题" message="当前阶段仍在首页列表里重命名标题，编辑页先专注正文编辑闭环。">
        <Input readOnly value={document.title} />
      </FormField>
      <FormField label="保存状态" message="停止输入约 1.5 秒后会自动保存，仍可使用顶部按钮立即手动保存。">
        <Input className={cn(getStatusInputClassName(savePhase))} readOnly value={statusMessage} />
      </FormField>
      <FormField label="创建时间">
        <Input readOnly value={formatEditorDateTime(document.created_at)} />
      </FormField>
      <FormField label="最近更新">
        <Input readOnly value={formatEditorDateTime(document.updated_at)} />
      </FormField>
    </section>
  );
}
