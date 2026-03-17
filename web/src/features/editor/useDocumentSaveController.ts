// useDocumentSaveController.ts - 管理编辑页正文保存、自动保存与离开保护
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { updateDocumentContent } from '../../api/document';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import type { DocumentContentSaveMode, DocumentDetail, DocumentSavePhase } from '../../types/document';
import { getSaveStatusMessage } from './getSaveStatusMessage';
import { usePendingChangesGuard } from './usePendingChangesGuard';
const AUTO_SAVE_DELAY = 1500;
type SaveMode = DocumentContentSaveMode;
export interface UseDocumentSaveControllerOptions {
  documentID: number | null;
  document: DocumentDetail | null;
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  setDocument: Dispatch<SetStateAction<DocumentDetail | null>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
}
export interface UseDocumentSaveControllerResult {
  savePhase: DocumentSavePhase;
  statusMessage: string;
  isDirty: boolean;
  isSaving: boolean;
  canManualSave: boolean;
  handleContentChange: (value: string) => void;
  handleSave: () => Promise<void>;
}
// useDocumentSaveController - 管理正文草稿、自动保存、手动保存与未保存离开提醒。
export function useDocumentSaveController({
  documentID,
  document,
  content,
  setContent,
  setDocument,
  setErrorMessage,
}: UseDocumentSaveControllerOptions): UseDocumentSaveControllerResult {
  const [savePhase, setSavePhase] = useState<DocumentSavePhase>('saved');
  const [hasUnversionedContent, setHasUnversionedContent] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const latestDocumentRef = useRef<DocumentDetail | null>(null);
  const latestContentRef = useRef(content);
  const isSavingRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const isSaving = savePhase === 'autosaving' || savePhase === 'manual-saving';
  const isDirty = document !== null && content !== document.content;
  const canManualSave = isDirty || hasUnversionedContent;
  const statusMessage = useMemo(() => getSaveStatusMessage(savePhase, lastSavedAt), [lastSavedAt, savePhase]);
  latestContentRef.current = content;
  usePendingChangesGuard(isDirty || isSaving);
  useEffect(() => {
    latestDocumentRef.current = document;
    if (!document) {
      setHasUnversionedContent(false);
      setLastSavedAt(null);
      return;
    }
    setHasUnversionedContent(document.has_unversioned_content);
    if (content === document.content && !isSavingRef.current) {
      setLastSavedAt(document.updated_at);
      setSavePhase('saved');
    }
  }, [content, document]);
  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimerRef.current === null) {
      return;
    }
    window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = null;
  }, []);
  const persistContent = useCallback(
    async (mode: SaveMode) => {
      const currentDocument = latestDocumentRef.current;
      if (documentID === null || currentDocument === null) {
        return;
      }

      const contentToSave = latestContentRef.current;
      if (contentToSave === currentDocument.content && mode !== 'manual') {
        return;
      }
      if (isSavingRef.current) {
        queuedSaveRef.current = true;
        return;
      }

      clearAutoSaveTimer();
      isSavingRef.current = true;
      setSavePhase(mode === 'manual' ? 'manual-saving' : 'autosaving');
      setErrorMessage('');

      try {
        const response = await updateDocumentContent(documentID, {
          content: contentToSave,
          save_mode: mode,
        });
        const savedDocument = { ...response.document, content: contentToSave };
        latestDocumentRef.current = savedDocument;
        setDocument(savedDocument);
        setHasUnversionedContent(response.document.has_unversioned_content);
        setLastSavedAt(response.document.updated_at);

        const hasNewChanges = latestContentRef.current !== contentToSave;
        setSavePhase(hasNewChanges ? 'dirty' : 'saved');
        if (mode === 'manual' && !hasNewChanges) {
          toast({ description: '文档内容已保存' });
        }
      } catch (error) {
        const message = getErrorMessage(error, mode === 'manual' ? '手动保存失败，请稍后重试' : '自动保存失败，请稍后重试');
        setErrorMessage(message);
        setSavePhase('save-error');
        if (mode === 'manual') {
          toast({ description: message, variant: 'destructive' });
        }
      } finally {
        isSavingRef.current = false;
        const savedSnapshot = latestDocumentRef.current?.content;
        const shouldFollowUpSave = queuedSaveRef.current;
        queuedSaveRef.current = false;
        if (shouldFollowUpSave && savedSnapshot !== undefined && latestContentRef.current !== savedSnapshot) {
          void persistContent('auto');
        }
      }
    },
    [clearAutoSaveTimer, documentID, setDocument, setErrorMessage],
  );
  useEffect(() => {
    if (documentID === null || document === null || isSavingRef.current || !isDirty) {
      return;
    }
    clearAutoSaveTimer();
    autoSaveTimerRef.current = window.setTimeout(() => {
      autoSaveTimerRef.current = null;
      void persistContent('auto');
    }, AUTO_SAVE_DELAY);
    return clearAutoSaveTimer;
  }, [clearAutoSaveTimer, document, documentID, isDirty, persistContent]);
  useEffect(() => clearAutoSaveTimer, [clearAutoSaveTimer]);
  function handleContentChange(value: string) {
    setContent(value);
    setErrorMessage('');
    setSavePhase((currentSavePhase) =>
      currentSavePhase === 'autosaving' || currentSavePhase === 'manual-saving' ? currentSavePhase : 'dirty',
    );
  }
  async function handleSave() { await persistContent('manual'); }
  return { savePhase, statusMessage, isDirty, isSaving, canManualSave, handleContentChange, handleSave };
}
