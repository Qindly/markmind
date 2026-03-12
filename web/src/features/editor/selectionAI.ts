// selectionAI.ts - 提供编辑器选区 AI 入口所需的选区快照与结果写回工具
import type { EditorView } from '@codemirror/view';

const SELECTION_CONTEXT_WINDOW_SIZE = 240;
const FLOATING_ACTION_OFFSET = 12;
const FLOATING_ACTION_WIDTH = 126;
const FLOATING_ACTION_HEIGHT = 64;
const FLOATING_ACTION_WINDOW_PADDING = 12;

export type AIApplyMode = 'insert' | 'replace';

export interface EditorSelectionSnapshot {
  from: number;
  to: number;
  text: string;
  contextBefore: string;
  contextAfter: string;
  toolbarTop: number;
  toolbarLeft: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * buildEditorSelectionSnapshot - 基于当前 CodeMirror 视图生成可用于 AI 请求的选区快照。
 * 参数 view: 当前编辑器视图实例。
 * 返回值：选区快照；当选区为空或无法定位时返回 null。
 */
export function buildEditorSelectionSnapshot(view: EditorView): EditorSelectionSnapshot | null {
  const selection = view.state.selection.main;
  if (selection.empty || !view.hasFocus) {
    return null;
  }

  const selectedText = view.state.doc.sliceString(selection.from, selection.to);
  if (selectedText.trim() === '') {
    return null;
  }

  const selectionCoords = view.coordsAtPos(selection.to) ?? view.coordsAtPos(selection.from);
  if (!selectionCoords) {
    return null;
  }

  const documentText = view.state.doc.toString();
  return {
    from: selection.from,
    to: selection.to,
    text: selectedText,
    contextBefore: documentText.slice(Math.max(0, selection.from - SELECTION_CONTEXT_WINDOW_SIZE), selection.from),
    contextAfter: documentText.slice(selection.to, Math.min(documentText.length, selection.to + SELECTION_CONTEXT_WINDOW_SIZE)),
    toolbarTop: clamp(
      selectionCoords.bottom + FLOATING_ACTION_OFFSET,
      FLOATING_ACTION_WINDOW_PADDING,
      window.innerHeight - FLOATING_ACTION_HEIGHT - FLOATING_ACTION_WINDOW_PADDING,
    ),
    toolbarLeft: clamp(
      selectionCoords.right - FLOATING_ACTION_WIDTH / 2,
      FLOATING_ACTION_WINDOW_PADDING,
      window.innerWidth - FLOATING_ACTION_WIDTH - FLOATING_ACTION_WINDOW_PADDING,
    ),
  };
}

/**
 * applyAITextToEditor - 将 AI 结果写回到当前编辑器中。
 * 参数 view: 当前编辑器视图实例。
 * 参数 selection: 打开弹窗时冻结的选区快照。
 * 参数 nextText: AI 返回的可写回文本。
 * 参数 mode: 写回模式，支持替换选区或插入到选区后。
 */
export function applyAITextToEditor(
  view: EditorView,
  selection: EditorSelectionSnapshot,
  nextText: string,
  mode: AIApplyMode,
) {
  const insertFrom = mode === 'replace' ? selection.from : selection.to;
  const insertTo = mode === 'replace' ? selection.to : selection.to;

  view.dispatch({
    changes: {
      from: insertFrom,
      to: insertTo,
      insert: nextText,
    },
    selection: {
      anchor: insertFrom + nextText.length,
    },
    scrollIntoView: true,
  });
  view.focus();
}
