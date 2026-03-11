// EditorInfoPanel.tsx - 渲染编辑页左上角的紧凑文档状态概览卡片
import { cn } from '../../../lib/cn';
import type { DocumentDetail, DocumentSavePhase } from '../../../types/document';
import { formatEditorDateTime } from '../formatEditorDateTime';

export interface EditorInfoPanelProps {
  document: DocumentDetail;
  savePhase: DocumentSavePhase;
  statusMessage: string;
  className?: string;
}

interface InfoMetaItemProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function getStatusValueClassName(savePhase: DocumentSavePhase): string | undefined {
  switch (savePhase) {
    case 'save-error':
      return 'text-[var(--color-toast-danger-text)]';
    case 'dirty':
    case 'autosaving':
    case 'manual-saving':
      return 'text-[var(--color-text-primary)]';
    case 'saved':
    default:
      return undefined;
  }
}

function InfoMetaItem({ label, value, valueClassName }: InfoMetaItemProps) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className={cn('text-xs leading-6 text-[var(--color-text-secondary)]', valueClassName)}>{value}</p>
    </div>
  );
}

/**
 * EditorInfoPanel - 展示文档标题、保存状态与时间信息。
 * 参数 props: 文档详情、保存阶段、状态文案和可选样式扩展。
 * 返回值：左上角紧凑概览卡片 JSX。
 */
export function EditorInfoPanel({
  document,
  savePhase,
  statusMessage,
  className,
}: EditorInfoPanelProps) {
  return (
    <section
      className={cn(
        'space-y-4 rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-4',
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          文档概览
        </p>
        <h2 className="line-clamp-2 text-base font-medium leading-7 text-[var(--color-text-primary)]">
          {document.title}
        </h2>
      </div>

      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-1">
        <InfoMetaItem
          label="保存状态"
          value={statusMessage}
          valueClassName={getStatusValueClassName(savePhase)}
        />
        <InfoMetaItem label="创建时间" value={formatEditorDateTime(document.created_at)} />
        <InfoMetaItem label="最近更新" value={formatEditorDateTime(document.updated_at)} />
      </div>
    </section>
  );
}
