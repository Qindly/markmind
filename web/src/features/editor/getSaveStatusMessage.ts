// getSaveStatusMessage.ts - 提供编辑页保存状态的统一文案
import type { DocumentSavePhase } from '../../types/document';
import { formatEditorDateTime } from './formatEditorDateTime';

// getSaveStatusMessage - 根据保存阶段与最近保存时间生成状态文案。
// 参数 savePhase: 当前保存阶段。
// 参数 lastSavedAt: 最近一次成功保存时间。
// 返回值：展示给用户的状态文案。
export function getSaveStatusMessage(savePhase: DocumentSavePhase, lastSavedAt: string | null): string {
  switch (savePhase) {
    case 'dirty':
      return '检测到未保存的更改，暂停输入后会自动保存';
    case 'autosaving':
      return '正在自动保存最新内容...';
    case 'manual-saving':
      return '正在手动保存文档内容...';
    case 'save-error':
      return '保存失败，请继续编辑后重试或手动立即保存';
    case 'saved':
    default:
      return lastSavedAt ? `最近已保存于 ${formatEditorDateTime(lastSavedAt)}` : '内容已保存';
  }
}
