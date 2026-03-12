// useEditorSelectionAI.ts - 管理编辑器选区 AI 浮层、弹窗、流式结果与写回流程
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { EditorView } from '@codemirror/view';
import { useNavigate } from 'react-router-dom';

import { streamMagicEdit, streamTranslation } from '../../api/ai';
import { fetchAISettings } from '../../api/settings';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import type { AIRequestStatus } from '../../types/ai';
import type { DocumentDetail } from '../../types/document';
import { applyAITextToEditor, buildEditorSelectionSnapshot, type AIApplyMode, type EditorSelectionSnapshot } from './selectionAI';

interface SelectionActionState {
  top: number;
  left: number;
}

export interface UseEditorSelectionAIResult {
  selectionActionState: SelectionActionState | null;
  isMagicEditDialogOpen: boolean;
  isTranslateDialogOpen: boolean;
  magicInstruction: string;
  magicResult: string;
  magicErrorMessage: string;
  magicStatus: AIRequestStatus;
  translateSourceLanguage: string;
  translateTargetLanguage: string;
  translateResult: string;
  translateErrorMessage: string;
  translateStatus: AIRequestStatus;
  selectedText: string;
  handleEditorReady: (view: EditorView) => void;
  handleSelectionChange: (view: EditorView) => void;
  handleOpenMagicEdit: () => Promise<void>;
  handleOpenTranslate: () => Promise<void>;
  handleMagicInstructionChange: (value: string) => void;
  handleTranslateSourceLanguageChange: (value: string) => void;
  handleTranslateTargetLanguageChange: (value: string) => void;
  handleMagicEditDialogOpenChange: (open: boolean) => void;
  handleTranslateDialogOpenChange: (open: boolean) => void;
  handleSubmitMagicEdit: () => Promise<void>;
  handleSubmitTranslate: () => Promise<void>;
  handleAbortMagicEdit: () => void;
  handleAbortTranslate: () => void;
  handleApplyMagicEditReplace: () => Promise<void>;
  handleApplyMagicEditInsert: () => Promise<void>;
  handleCopyMagicEditResult: () => Promise<void>;
  handleApplyTranslateReplace: () => Promise<void>;
  handleApplyTranslateInsert: () => Promise<void>;
  handleCopyTranslateResult: () => Promise<void>;
}

const DEFAULT_TRANSLATE_SOURCE_LANGUAGE = 'auto';
const DEFAULT_TRANSLATE_TARGET_LANGUAGE = '中文';

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function disposeActiveRequest(controllerRef: MutableRefObject<AbortController | null>): void {
  const activeController = controllerRef.current;
  if (!activeController) {
    return;
  }

  controllerRef.current = null;
  activeController.abort();
}

/**
 * useEditorSelectionAI - 管理编辑器选区 AI 浮层、弹窗与结果回填流程。
 * 参数 document: 当前打开的文档详情。
 * 返回值：编辑器 AI 交互所需的状态与回调。
 */
export function useEditorSelectionAI(document: DocumentDetail | null): UseEditorSelectionAIResult {
  const navigate = useNavigate();
  const editorViewRef = useRef<EditorView | null>(null);
  const magicEditAbortControllerRef = useRef<AbortController | null>(null);
  const translateAbortControllerRef = useRef<AbortController | null>(null);
  const [selectionSnapshot, setSelectionSnapshot] = useState<EditorSelectionSnapshot | null>(null);
  const [dialogSelectionSnapshot, setDialogSelectionSnapshot] = useState<EditorSelectionSnapshot | null>(null);
  const [isMagicEditDialogOpen, setIsMagicEditDialogOpen] = useState(false);
  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);
  const [magicInstruction, setMagicInstruction] = useState('');
  const [magicResult, setMagicResult] = useState('');
  const [magicErrorMessage, setMagicErrorMessage] = useState('');
  const [magicStatus, setMagicStatus] = useState<AIRequestStatus>('idle');
  const [translateSourceLanguage, setTranslateSourceLanguage] = useState(DEFAULT_TRANSLATE_SOURCE_LANGUAGE);
  const [translateTargetLanguage, setTranslateTargetLanguage] = useState(DEFAULT_TRANSLATE_TARGET_LANGUAGE);
  const [translateResult, setTranslateResult] = useState('');
  const [translateErrorMessage, setTranslateErrorMessage] = useState('');
  const [translateStatus, setTranslateStatus] = useState<AIRequestStatus>('idle');
  const [isAIConfigured, setIsAIConfigured] = useState<boolean | null>(null);

  const updateSelectionSnapshot = useCallback(
    (view: EditorView) => {
      if (isMagicEditDialogOpen || isTranslateDialogOpen) {
        setSelectionSnapshot(null);
        return;
      }

      setSelectionSnapshot(buildEditorSelectionSnapshot(view));
    },
    [isMagicEditDialogOpen, isTranslateDialogOpen],
  );

  useEffect(() => {
    const currentView = editorViewRef.current;
    if (!currentView) {
      return;
    }

    const view = currentView;

    function handleViewportChange() {
      updateSelectionSnapshot(view);
    }

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    view.scrollDOM.addEventListener('scroll', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      view.scrollDOM.removeEventListener('scroll', handleViewportChange);
    };
  }, [isMagicEditDialogOpen, isTranslateDialogOpen, updateSelectionSnapshot]);

  useEffect(() => {
    return () => {
      disposeActiveRequest(magicEditAbortControllerRef);
      disposeActiveRequest(translateAbortControllerRef);
    };
  }, []);

  function resetMagicEditState() {
    setMagicInstruction('');
    setMagicResult('');
    setMagicErrorMessage('');
    setMagicStatus('idle');
  }

  function resetTranslateState() {
    setTranslateSourceLanguage(DEFAULT_TRANSLATE_SOURCE_LANGUAGE);
    setTranslateTargetLanguage(DEFAULT_TRANSLATE_TARGET_LANGUAGE);
    setTranslateResult('');
    setTranslateErrorMessage('');
    setTranslateStatus('idle');
  }

  function clearDialogSelection() {
    setDialogSelectionSnapshot(null);
  }

  async function ensureAIConfigured() {
    if (!document) {
      return false;
    }

    if (isAIConfigured === true) {
      return true;
    }

    if (isAIConfigured === false) {
      toast({ description: '请先在设置页完成 AI Provider 配置', variant: 'destructive' });
      navigate(`/settings?from=editor&document_id=${document.id}`);
      return false;
    }

    try {
      const response = await fetchAISettings();
      const configured = Boolean(
        response.settings.base_url.trim() && response.settings.model.trim() && response.settings.has_api_key,
      );
      setIsAIConfigured(configured);

      if (!configured) {
        toast({ description: '请先在设置页完成 AI Provider 配置', variant: 'destructive' });
        navigate(`/settings?from=editor&document_id=${document.id}`);
      }

      return configured;
    } catch (error) {
      toast({ description: getErrorMessage(error, '读取 AI 设置失败，请稍后重试'), variant: 'destructive' });
      return false;
    }
  }

  function closeMagicEditDialog() {
    disposeActiveRequest(magicEditAbortControllerRef);
    setIsMagicEditDialogOpen(false);
    clearDialogSelection();
    resetMagicEditState();
  }

  function closeTranslateDialog() {
    disposeActiveRequest(translateAbortControllerRef);
    setIsTranslateDialogOpen(false);
    clearDialogSelection();
    resetTranslateState();
  }

  async function handleOpenMagicEdit() {
    if (!selectionSnapshot || !(await ensureAIConfigured())) {
      return;
    }

    disposeActiveRequest(magicEditAbortControllerRef);
    resetMagicEditState();
    setDialogSelectionSnapshot(selectionSnapshot);
    setSelectionSnapshot(null);
    setIsMagicEditDialogOpen(true);
  }

  async function handleOpenTranslate() {
    if (!selectionSnapshot || !(await ensureAIConfigured())) {
      return;
    }

    disposeActiveRequest(translateAbortControllerRef);
    resetTranslateState();
    setDialogSelectionSnapshot(selectionSnapshot);
    setSelectionSnapshot(null);
    setIsTranslateDialogOpen(true);
  }

  async function handleSubmitMagicEdit() {
    if (!dialogSelectionSnapshot || !document || magicStatus === 'streaming') {
      return;
    }

    disposeActiveRequest(magicEditAbortControllerRef);

    const requestController = new AbortController();
    magicEditAbortControllerRef.current = requestController;
    setMagicStatus('streaming');
    setMagicErrorMessage('');
    setMagicResult('');

    try {
      const response = await streamMagicEdit(
        {
          document_id: document.id,
          selected_text: dialogSelectionSnapshot.text,
          instruction: magicInstruction,
          context_before: dialogSelectionSnapshot.contextBefore,
          context_after: dialogSelectionSnapshot.contextAfter,
        },
        {
          signal: requestController.signal,
          onChunk: (delta) => {
            if (magicEditAbortControllerRef.current !== requestController) {
              return;
            }

            setMagicResult((currentResult) => currentResult + delta);
          },
        },
      );

      if (magicEditAbortControllerRef.current !== requestController) {
        return;
      }

      setMagicResult(response.result);
      setMagicStatus('completed');
    } catch (error) {
      if (magicEditAbortControllerRef.current !== requestController) {
        return;
      }

      if (isAbortError(error)) {
        setMagicStatus('aborted');
        return;
      }

      setMagicStatus('idle');
      setMagicErrorMessage(getErrorMessage(error, '魔法笔处理失败，请稍后重试'));
    } finally {
      if (magicEditAbortControllerRef.current === requestController) {
        magicEditAbortControllerRef.current = null;
      }
    }
  }

  async function handleSubmitTranslate() {
    if (!dialogSelectionSnapshot || !document || translateStatus === 'streaming') {
      return;
    }

    disposeActiveRequest(translateAbortControllerRef);

    const requestController = new AbortController();
    translateAbortControllerRef.current = requestController;
    setTranslateStatus('streaming');
    setTranslateErrorMessage('');
    setTranslateResult('');

    try {
      const response = await streamTranslation(
        {
          document_id: document.id,
          selected_text: dialogSelectionSnapshot.text,
          source_language: translateSourceLanguage,
          target_language: translateTargetLanguage,
          context_before: dialogSelectionSnapshot.contextBefore,
          context_after: dialogSelectionSnapshot.contextAfter,
        },
        {
          signal: requestController.signal,
          onChunk: (delta) => {
            if (translateAbortControllerRef.current !== requestController) {
              return;
            }

            setTranslateResult((currentResult) => currentResult + delta);
          },
        },
      );

      if (translateAbortControllerRef.current !== requestController) {
        return;
      }

      setTranslateResult(response.translated_text);
      setTranslateStatus('completed');
    } catch (error) {
      if (translateAbortControllerRef.current !== requestController) {
        return;
      }

      if (isAbortError(error)) {
        setTranslateStatus('aborted');
        return;
      }

      setTranslateStatus('idle');
      setTranslateErrorMessage(getErrorMessage(error, '翻译处理失败，请稍后重试'));
    } finally {
      if (translateAbortControllerRef.current === requestController) {
        translateAbortControllerRef.current = null;
      }
    }
  }

  async function copyResult(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ description: 'AI 结果已复制到剪贴板' });
    } catch {
      toast({ description: '复制结果失败，请手动复制', variant: 'destructive' });
    }
  }

  async function applyResult(text: string, mode: AIApplyMode, onClose: () => void) {
    const view = editorViewRef.current;
    if (!view || !dialogSelectionSnapshot) {
      return;
    }

    applyAITextToEditor(view, dialogSelectionSnapshot, text, mode);
    toast({ description: 'AI 结果已写入文档' });
    onClose();
  }

  function handleEditorReady(view: EditorView) {
    editorViewRef.current = view;
    updateSelectionSnapshot(view);
  }

  return {
    selectionActionState: selectionSnapshot
      ? {
          top: selectionSnapshot.toolbarTop,
          left: selectionSnapshot.toolbarLeft,
        }
      : null,
    isMagicEditDialogOpen,
    isTranslateDialogOpen,
    magicInstruction,
    magicResult,
    magicErrorMessage,
    magicStatus,
    translateSourceLanguage,
    translateTargetLanguage,
    translateResult,
    translateErrorMessage,
    translateStatus,
    selectedText: dialogSelectionSnapshot?.text ?? selectionSnapshot?.text ?? '',
    handleEditorReady,
    handleSelectionChange: updateSelectionSnapshot,
    handleOpenMagicEdit,
    handleOpenTranslate,
    handleMagicInstructionChange: setMagicInstruction,
    handleTranslateSourceLanguageChange: setTranslateSourceLanguage,
    handleTranslateTargetLanguageChange: setTranslateTargetLanguage,
    handleMagicEditDialogOpenChange: (open) => {
      if (!open) {
        closeMagicEditDialog();
      }
    },
    handleTranslateDialogOpenChange: (open) => {
      if (!open) {
        closeTranslateDialog();
      }
    },
    handleSubmitMagicEdit,
    handleSubmitTranslate,
    handleAbortMagicEdit: () => {
      magicEditAbortControllerRef.current?.abort();
    },
    handleAbortTranslate: () => {
      translateAbortControllerRef.current?.abort();
    },
    handleApplyMagicEditReplace: async () => applyResult(magicResult, 'replace', closeMagicEditDialog),
    handleApplyMagicEditInsert: async () => applyResult(magicResult, 'insert', closeMagicEditDialog),
    handleCopyMagicEditResult: async () => {
      await copyResult(magicResult);
      closeMagicEditDialog();
    },
    handleApplyTranslateReplace: async () => applyResult(translateResult, 'replace', closeTranslateDialog),
    handleApplyTranslateInsert: async () => applyResult(translateResult, 'insert', closeTranslateDialog),
    handleCopyTranslateResult: async () => {
      await copyResult(translateResult);
      closeTranslateDialog();
    },
  };
}
