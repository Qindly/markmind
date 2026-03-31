// useEditorSelectionAI.ts - 管理编辑器选区 AI 浮层、弹窗、流式结果与写回流程
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { streamMagicEdit, streamTranslation } from '../../api/ai';
import { fetchAISettings } from '../../api/settings';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import type { AIRequestStatus } from '../../types/ai';
import type { DocumentDetail } from '../../types/document';
import { applyAITextToEditor, type AIApplyMode } from './selectionAI';
import { copyAIResult, useAIStreamRequest } from './useAIStreamRequest';
import { useSelectionToolbar } from './useSelectionToolbar';

export interface UseEditorSelectionAIResult {
  selectionActionState: { top: number; left: number } | null;
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
  handleEditorReady: (view: import('@codemirror/view').EditorView) => void;
  handleSelectionChange: (view: import('@codemirror/view').EditorView) => void;
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

const MAGIC_EDIT_STREAM_OPTIONS = {
  extractResult: (r: { result: string }) => r.result,
  fallbackErrorMessage: '魔法笔处理失败，请稍后重试',
} as const;

const TRANSLATE_STREAM_OPTIONS = {
  extractResult: (r: { translated_text: string }) => r.translated_text,
  fallbackErrorMessage: '翻译处理失败，请稍后重试',
} as const;

export function useEditorSelectionAI(document: DocumentDetail | null): UseEditorSelectionAIResult {
  const navigate = useNavigate();

  // --- 弹窗开关 ---
  const [isMagicEditDialogOpen, setIsMagicEditDialogOpen] = useState(false);
  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);

  // --- 选区浮层 ---
  const toolbar = useSelectionToolbar(isMagicEditDialogOpen || isTranslateDialogOpen);

  // --- 流式请求 ---
  const magicEdit = useAIStreamRequest(streamMagicEdit, MAGIC_EDIT_STREAM_OPTIONS);
  const translate = useAIStreamRequest(streamTranslation, TRANSLATE_STREAM_OPTIONS);

  // --- 表单状态 ---
  const [magicInstruction, setMagicInstruction] = useState('');
  const [translateSourceLanguage, setTranslateSourceLanguage] = useState(DEFAULT_TRANSLATE_SOURCE_LANGUAGE);
  const [translateTargetLanguage, setTranslateTargetLanguage] = useState(DEFAULT_TRANSLATE_TARGET_LANGUAGE);

  // --- AI 配置检查 ---
  const [isAIConfigured, setIsAIConfigured] = useState<boolean | null>(null);

  const ensureAIConfigured = useCallback(async () => {
    if (!document) return false;

    if (isAIConfigured === true) return true;

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
  }, [document, isAIConfigured, navigate]);

  // --- 结果写回 ---
  const applyResult = useCallback(
    (text: string, mode: AIApplyMode, onClose: () => void) => {
      const view = toolbar.editorViewRef.current;
      if (!view || !toolbar.dialogSnapshot) return;

      applyAITextToEditor(view, toolbar.dialogSnapshot, text, mode);
      toast({ description: 'AI 结果已写入文档' });
      onClose();
    },
    [toolbar.editorViewRef, toolbar.dialogSnapshot],
  );

  // --- 关闭弹窗 ---
  const closeMagicEditDialog = useCallback(() => {
    magicEdit.reset();
    setMagicInstruction('');
    setIsMagicEditDialogOpen(false);
    toolbar.clearDialogSnapshot();
  }, [magicEdit, toolbar]);

  const closeTranslateDialog = useCallback(() => {
    translate.reset();
    setTranslateSourceLanguage(DEFAULT_TRANSLATE_SOURCE_LANGUAGE);
    setTranslateTargetLanguage(DEFAULT_TRANSLATE_TARGET_LANGUAGE);
    setIsTranslateDialogOpen(false);
    toolbar.clearDialogSnapshot();
  }, [translate, toolbar]);

  // --- 打开弹窗 ---
  const handleOpenMagicEdit = useCallback(async () => {
    if (!toolbar.selectionSnapshot || !(await ensureAIConfigured())) return;

    magicEdit.reset();
    setMagicInstruction('');
    toolbar.freezeSelection();
    setIsMagicEditDialogOpen(true);
  }, [toolbar, ensureAIConfigured, magicEdit]);

  const handleOpenTranslate = useCallback(async () => {
    if (!toolbar.selectionSnapshot || !(await ensureAIConfigured())) return;

    translate.reset();
    setTranslateSourceLanguage(DEFAULT_TRANSLATE_SOURCE_LANGUAGE);
    setTranslateTargetLanguage(DEFAULT_TRANSLATE_TARGET_LANGUAGE);
    toolbar.freezeSelection();
    setIsTranslateDialogOpen(true);
  }, [toolbar, ensureAIConfigured, translate]);

  // --- 提交请求 ---
  const handleSubmitMagicEdit = useCallback(async () => {
    if (!toolbar.dialogSnapshot || !document || magicEdit.status === 'streaming') return;

    await magicEdit.submit({
      document_id: document.id,
      selected_text: toolbar.dialogSnapshot.text,
      instruction: magicInstruction,
      context_before: toolbar.dialogSnapshot.contextBefore,
      context_after: toolbar.dialogSnapshot.contextAfter,
    });
  }, [toolbar.dialogSnapshot, document, magicEdit, magicInstruction]);

  const handleSubmitTranslate = useCallback(async () => {
    if (!toolbar.dialogSnapshot || !document || translate.status === 'streaming') return;

    await translate.submit({
      document_id: document.id,
      selected_text: toolbar.dialogSnapshot.text,
      source_language: translateSourceLanguage,
      target_language: translateTargetLanguage,
      context_before: toolbar.dialogSnapshot.contextBefore,
      context_after: toolbar.dialogSnapshot.contextAfter,
    });
  }, [toolbar.dialogSnapshot, document, translate, translateSourceLanguage, translateTargetLanguage]);

  // --- 组装返回值 ---
  return useMemo(
    () => ({
      selectionActionState: toolbar.selectionActionState,
      isMagicEditDialogOpen,
      isTranslateDialogOpen,
      magicInstruction,
      magicResult: magicEdit.result,
      magicErrorMessage: magicEdit.errorMessage,
      magicStatus: magicEdit.status,
      translateSourceLanguage,
      translateTargetLanguage,
      translateResult: translate.result,
      translateErrorMessage: translate.errorMessage,
      translateStatus: translate.status,
      selectedText: toolbar.selectedText,
      handleEditorReady: toolbar.handleEditorReady,
      handleSelectionChange: toolbar.handleSelectionChange,
      handleOpenMagicEdit,
      handleOpenTranslate,
      handleMagicInstructionChange: setMagicInstruction,
      handleTranslateSourceLanguageChange: setTranslateSourceLanguage,
      handleTranslateTargetLanguageChange: setTranslateTargetLanguage,
      handleMagicEditDialogOpenChange: (open: boolean) => {
        if (!open) closeMagicEditDialog();
      },
      handleTranslateDialogOpenChange: (open: boolean) => {
        if (!open) closeTranslateDialog();
      },
      handleSubmitMagicEdit,
      handleSubmitTranslate,
      handleAbortMagicEdit: magicEdit.abort,
      handleAbortTranslate: translate.abort,
      handleApplyMagicEditReplace: async () => applyResult(magicEdit.result, 'replace', closeMagicEditDialog),
      handleApplyMagicEditInsert: async () => applyResult(magicEdit.result, 'insert', closeMagicEditDialog),
      handleCopyMagicEditResult: async () => {
        await copyAIResult(magicEdit.result);
        closeMagicEditDialog();
      },
      handleApplyTranslateReplace: async () => applyResult(translate.result, 'replace', closeTranslateDialog),
      handleApplyTranslateInsert: async () => applyResult(translate.result, 'insert', closeTranslateDialog),
      handleCopyTranslateResult: async () => {
        await copyAIResult(translate.result);
        closeTranslateDialog();
      },
    }),
    [
      toolbar.selectionActionState,
      toolbar.selectedText,
      toolbar.handleEditorReady,
      toolbar.handleSelectionChange,
      isMagicEditDialogOpen,
      isTranslateDialogOpen,
      magicInstruction,
      magicEdit,
      translateSourceLanguage,
      translateTargetLanguage,
      translate,
      handleOpenMagicEdit,
      handleOpenTranslate,
      handleSubmitMagicEdit,
      handleSubmitTranslate,
      closeMagicEditDialog,
      closeTranslateDialog,
      applyResult,
    ],
  );
}
