// useSelectionToolbar.ts - 管理编辑器选区浮层定位与视口跟随
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';

import { buildEditorSelectionSnapshot, type EditorSelectionSnapshot } from './selectionAI';

interface SelectionActionState {
  top: number;
  left: number;
}

export interface UseSelectionToolbarResult {
  selectionActionState: SelectionActionState | null;
  selectionSnapshot: EditorSelectionSnapshot | null;
  selectedText: string;
  editorViewRef: React.MutableRefObject<EditorView | null>;
  /** 冻结到弹窗中的快照 */
  dialogSnapshot: EditorSelectionSnapshot | null;
  freezeSelection: () => EditorSelectionSnapshot | null;
  clearDialogSnapshot: () => void;
  handleEditorReady: (view: EditorView) => void;
  handleSelectionChange: (view: EditorView) => void;
}

export function useSelectionToolbar(isDialogOpen: boolean): UseSelectionToolbarResult {
  const editorViewRef = useRef<EditorView | null>(null);
  const [selectionSnapshot, setSelectionSnapshot] = useState<EditorSelectionSnapshot | null>(null);
  const [dialogSnapshot, setDialogSnapshot] = useState<EditorSelectionSnapshot | null>(null);

  const updateSnapshot = useCallback(
    (view: EditorView) => {
      if (isDialogOpen) {
        setSelectionSnapshot(null);
        return;
      }
      setSelectionSnapshot(buildEditorSelectionSnapshot(view));
    },
    [isDialogOpen],
  );

  // 视口变化时重新计算位置
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    function handleViewportChange() {
      updateSnapshot(view!);
    }

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    view.scrollDOM.addEventListener('scroll', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      view.scrollDOM.removeEventListener('scroll', handleViewportChange);
    };
  }, [isDialogOpen, updateSnapshot]);

  const freezeSelection = useCallback(() => {
    if (!selectionSnapshot) return null;
    setDialogSnapshot(selectionSnapshot);
    setSelectionSnapshot(null);
    return selectionSnapshot;
  }, [selectionSnapshot]);

  const clearDialogSnapshot = useCallback(() => {
    setDialogSnapshot(null);
  }, []);

  const handleEditorReady = useCallback(
    (view: EditorView) => {
      editorViewRef.current = view;
      updateSnapshot(view);
    },
    [updateSnapshot],
  );

  return {
    selectionActionState: selectionSnapshot
      ? { top: selectionSnapshot.toolbarTop, left: selectionSnapshot.toolbarLeft }
      : null,
    selectionSnapshot,
    selectedText: dialogSnapshot?.text ?? selectionSnapshot?.text ?? '',
    editorViewRef,
    dialogSnapshot,
    freezeSelection,
    clearDialogSnapshot,
    handleEditorReady,
    handleSelectionChange: updateSnapshot,
  };
}
