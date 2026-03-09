// useDocumentEditor.ts - 封装编辑页的数据加载、正文编辑与保存逻辑
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchDocumentDetail, updateDocumentContent } from '../../api/document';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import type { DocumentDetail } from '../../types/document';

export interface UseDocumentEditorResult {
  document: DocumentDetail | null;
  content: string;
  errorMessage: string;
  statusMessage: string;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  handleBack: () => void;
  handleContentChange: (value: string) => void;
  handleSave: () => Promise<void>;
  reloadDocument: () => void;
}

/**
 * useDocumentEditor - 管理编辑页的文档加载、正文编辑与手动保存状态。
 * 返回值：编辑页渲染所需的状态与事件回调。
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
  const [isSaving, setIsSaving] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);

  const isDirty = document !== null && content !== document.content;
  const statusMessage = isLoading
    ? '正在加载文档内容...'
    : isSaving
      ? '正在保存文档内容...'
      : isDirty
        ? '你有尚未保存的更改'
        : '内容已保存';

  const reloadDocument = useCallback(() => {
    setReloadSeed((currentSeed) => currentSeed + 1);
  }, []);

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

  function handleBack() {
    navigate('/');
  }

  function handleContentChange(value: string) {
    setContent(value);
    if (errorMessage) {
      setErrorMessage('');
    }
  }

  async function handleSave() {
    if (documentID === null || document === null || isSaving || !isDirty) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const response = await updateDocumentContent(documentID, { content });
      setDocument(response.document);
      setContent(response.document.content);
      toast({ description: '文档内容已保存' });
    } catch (error) {
      const message = getErrorMessage(error, '保存文档内容失败，请稍后重试');
      setErrorMessage(message);
      toast({ description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  return {
    document,
    content,
    errorMessage,
    statusMessage,
    isDirty,
    isLoading,
    isSaving,
    handleBack,
    handleContentChange,
    handleSave,
    reloadDocument,
  };
}
