// useDocumentEditor.ts - 封装编辑页的文档加载、刷新与编辑态组合逻辑
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchDocumentDetail } from '../../api/document';
import { getErrorMessage } from '../../lib/getErrorMessage';
import type { DocumentDetail, DocumentSavePhase } from '../../types/document';
import { useDocumentSaveController } from './useDocumentSaveController';

export interface UseDocumentEditorResult {
  document: DocumentDetail | null;
  content: string;
  errorMessage: string;
  statusMessage: string;
  savePhase: DocumentSavePhase;
  isDirty: boolean;
  isLeaveDialogOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  handleBack: () => void;
  handleCancelLeave: () => void;
  handleConfirmLeave: () => void;
  handleContentChange: (value: string) => void;
  handleSave: () => Promise<void>;
  reloadDocument: () => void;
}

/**
 * useDocumentEditor - 管理编辑页的文档加载、刷新与正文编辑组合状态。
 * 返回值：编辑页渲染所需的状态与交互回调。
 */
export function useDocumentEditor(): UseDocumentEditorResult {
  const navigate = useNavigate();
  const { id } = useParams();
  const documentID = useMemo(() => {
    const parsedID = Number(id);
    return Number.isInteger(parsedID) && parsedID > 0 ? parsedID : null;
  }, [id]);

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);

  const saveController = useDocumentSaveController({
    documentID,
    document,
    content,
    setContent,
    setDocument,
    setErrorMessage,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      if (documentID === null) {
        setDocument(null);
        setContent('');
        setErrorMessage('文档 ID 无效，请返回首页后重试');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetchDocumentDetail(documentID);
        if (cancelled) {
          return;
        }

        setDocument(response.document);
        setContent(response.document.content);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDocument(null);
        setContent('');
        setErrorMessage(getErrorMessage(error, '加载文档详情失败，请稍后重试'));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentID, reloadSeed]);

  const reloadDocument = useCallback(() => {
    setReloadSeed((currentSeed) => currentSeed + 1);
  }, []);

  const navigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleCancelLeave = useCallback(() => {
    setIsLeaveDialogOpen(false);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    setIsLeaveDialogOpen(false);
    navigateHome();
  }, [navigateHome]);

  const handleBack = useCallback(() => {
    if (saveController.isDirty || saveController.isSaving) {
      setIsLeaveDialogOpen(true);
      return;
    }

    navigateHome();
  }, [navigateHome, saveController.isDirty, saveController.isSaving]);

  return {
    document,
    content,
    errorMessage,
    statusMessage: saveController.statusMessage,
    savePhase: saveController.savePhase,
    isDirty: saveController.isDirty,
    isLeaveDialogOpen,
    isLoading,
    isSaving: saveController.isSaving,
    handleBack,
    handleCancelLeave,
    handleConfirmLeave,
    handleContentChange: saveController.handleContentChange,
    handleSave: saveController.handleSave,
    reloadDocument,
  };
}
