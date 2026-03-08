// useDashboardHome.ts - 封装首页列表页的数据加载与交互状态
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logoutUser } from '../../api/auth';
import { createDocument, createFolder, fetchDashboard } from '../../api/dashboard';
import { getErrorMessage } from '../../lib/getErrorMessage';
import { useAuthStore } from '../../stores/authStore';
import type { DocumentItem, FolderItem } from '../../types/dashboard';

// useDashboardHome - 管理首页数据加载、创建与退出登录逻辑
// 返回值：首页页面渲染所需的状态与事件回调
export function useDashboardHome() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  );

  const visibleDocuments = useMemo(
    () => documents.filter((document) => document.folder_id === selectedFolderId),
    [documents, selectedFolderId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchDashboard();
        if (cancelled) {
          return;
        }

        setFolders(data.folders);
        setDocuments(data.documents);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error, '加载首页列表失败，请稍后重试'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setErrorMessage('');
    setIsLoggingOut(true);

    try {
      await logoutUser();
      clearSession();
      navigate('/login', {
        replace: true,
        state: { notice: '你已安全退出登录' },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '退出登录失败，请稍后重试'));
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleCreateFolder(name: string) {
    setErrorMessage('');
    setIsCreatingFolder(true);

    try {
      const response = await createFolder({ name });
      setFolders((currentFolders) => [...currentFolders, response.folder]);
      setSelectedFolderId(response.folder.id);
      setSelectedDocumentId(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '创建文件夹失败，请稍后重试'));
      throw error;
    } finally {
      setIsCreatingFolder(false);
    }
  }

  async function handleCreateDocument() {
    setErrorMessage('');
    setIsCreatingDocument(true);

    try {
      const response = await createDocument({ folder_id: selectedFolderId });
      setDocuments((currentDocuments) => [response.document, ...currentDocuments]);
      setSelectedDocumentId(response.document.id);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '创建空文档失败，请稍后重试'));
    } finally {
      setIsCreatingDocument(false);
    }
  }

  return {
    user,
    folders,
    visibleDocuments,
    selectedFolderId,
    selectedFolderName: selectedFolder?.name ?? '根目录',
    selectedDocumentId,
    errorMessage,
    isLoading,
    isCreatingFolder,
    isCreatingDocument,
    isLoggingOut,
    handleLogout,
    handleCreateFolder,
    handleCreateDocument,
    handleSelectFolder: (folderId: number | null) => {
      setSelectedFolderId(folderId);
      setSelectedDocumentId(null);
    },
    handleSelectDocument: setSelectedDocumentId,
  };
}
