// useDashboardHome.ts - 封装首页列表页的数据加载、删改与创建交互状态
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';

import { logoutUser } from '../../api/auth';
import {
  createDocument,
  createFolder,
  deleteDocument,
  deleteFolder,
  fetchDashboard,
  searchDocuments,
  updateDocument,
  updateFolder,
} from '../../api/dashboard';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import { isRequestCanceled } from '../../lib/isRequestCanceled';
import { useAuthStore } from '../../stores/authStore';
import type {
  DashboardDocumentListItem,
  DocumentItem,
  DocumentSortMode,
  FolderItem,
  SearchDocumentItem,
  SearchScope,
} from '../../types/dashboard';
import { DEFAULT_DOCUMENT_SORT_MODE, sortDocuments } from './documentSort';

type DashboardEntityType = 'folder' | 'document';

const DOCUMENT_SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_SEARCH_SCOPE: SearchScope = 'current_folder';

interface DashboardMenuState {
  type: DashboardEntityType;
  id: number;
}

interface DashboardEditingState {
  type: DashboardEntityType;
  id: number;
  value: string;
}

interface DashboardDeleteState {
  type: DashboardEntityType;
  id: number;
  name: string;
}

interface DashboardMoveState {
  id: number;
  title: string;
  folderId: number | null;
}

function applyUpdatedDocument(documents: DocumentItem[], updatedDocument: DocumentItem): DocumentItem[] {
  return documents.map((document) => (document.id === updatedDocument.id ? updatedDocument : document));
}

function getFolderDisplayName(folders: FolderItem[], folderId: number | null): string {
  if (folderId === null) {
    return '根目录';
  }

  return folders.find((folder) => folder.id === folderId)?.name ?? '未知目录';
}

function cancelActiveSearchRequest(controllerRef: MutableRefObject<AbortController | null>) {
  const activeRequestController = controllerRef.current;
  if (!activeRequestController) {
    return;
  }

  activeRequestController.abort();
  controllerRef.current = null;
}

/**
 * useDashboardHome - 管理首页数据加载、创建、删改与退出登录逻辑。
 * 返回值：首页页面渲染所需的状态与事件回调。
 */
export function useDashboardHome() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const activeSearchRequestControllerRef = useRef<AbortController | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchDocumentItem[] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>(DEFAULT_SEARCH_SCOPE);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');
  const [documentSortMode, setDocumentSortMode] = useState<DocumentSortMode>(DEFAULT_DOCUMENT_SORT_MODE);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuState, setMenuState] = useState<DashboardMenuState | null>(null);
  const [editingState, setEditingState] = useState<DashboardEditingState | null>(null);
  const [deleteState, setDeleteState] = useState<DashboardDeleteState | null>(null);
  const [moveState, setMoveState] = useState<DashboardMoveState | null>(null);
  const [isUpdatingFolder, setIsUpdatingFolder] = useState(false);
  const [isUpdatingDocument, setIsUpdatingDocument] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);
  const [isMovingDocument, setIsMovingDocument] = useState(false);
  const [isSearchingDocuments, setIsSearchingDocuments] = useState(false);
  const normalizedSearchKeyword = searchKeyword.trim();
  const debouncedSearchKeyword = useDebouncedValue(normalizedSearchKeyword, DOCUMENT_SEARCH_DEBOUNCE_MS);
  const searchRequestFolderId = searchScope === 'current_folder' ? selectedFolderId : undefined;
  const isSearchPending =
    normalizedSearchKeyword !== '' && (normalizedSearchKeyword !== debouncedSearchKeyword || isSearchingDocuments);
  const searchResultCount =
    normalizedSearchKeyword === '' || isSearchPending || searchErrorMessage !== '' ? null : (searchResults?.length ?? 0);
  const isGlobalSearchActive = normalizedSearchKeyword !== '' && searchScope === 'global';

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  );

  const currentFolderDocuments = useMemo(
    () => documents.filter((document) => document.folder_id === selectedFolderId),
    [documents, selectedFolderId],
  );

  const visibleDocuments = useMemo(
    () => sortDocuments(currentFolderDocuments, documentSortMode),
    [currentFolderDocuments, documentSortMode],
  );
  const documentPanelTitle = isGlobalSearchActive ? '全部文档' : selectedFolder?.name ?? '根目录';
  const documentPanelTotalCount = isGlobalSearchActive ? documents.length : currentFolderDocuments.length;

  const filteredDocuments = useMemo<DashboardDocumentListItem[]>(() => {
    if (normalizedSearchKeyword === '') {
      return visibleDocuments;
    }

    if (normalizedSearchKeyword !== debouncedSearchKeyword) {
      return searchResults === null ? visibleDocuments : sortDocuments(searchResults, documentSortMode);
    }

    if (debouncedSearchKeyword === '') {
      return visibleDocuments;
    }

    return sortDocuments(searchResults ?? [], documentSortMode);
  }, [debouncedSearchKeyword, documentSortMode, normalizedSearchKeyword, searchResults, visibleDocuments]);

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

  useEffect(() => {
    // 输入继续变化时先中止旧请求，避免过期结果在防抖期间回写页面。
    if (normalizedSearchKeyword === '') {
      cancelActiveSearchRequest(activeSearchRequestControllerRef);
      setIsSearchingDocuments(false);
      return;
    }

    if (normalizedSearchKeyword !== debouncedSearchKeyword) {
      cancelActiveSearchRequest(activeSearchRequestControllerRef);
      setIsSearchingDocuments(false);
    }
  }, [debouncedSearchKeyword, normalizedSearchKeyword]);

  useEffect(() => {
    const normalizedKeyword = debouncedSearchKeyword;

    async function runDocumentSearch() {
      // 只有防抖后的稳定关键字才会真正触发搜索请求。
      if (normalizedKeyword === '') {
        cancelActiveSearchRequest(activeSearchRequestControllerRef);
        setSearchResults(null);
        setSearchErrorMessage('');
        setIsSearchingDocuments(false);
        return;
      }

      const requestController = new AbortController();
      activeSearchRequestControllerRef.current = requestController;
      setIsSearchingDocuments(true);
      setSearchResults(null);
      setSearchErrorMessage('');

      try {
        const response = await searchDocuments(
          {
            keyword: normalizedKeyword,
            scope: searchScope,
            folder_id: searchRequestFolderId,
          },
          {
            signal: requestController.signal,
          },
        );
        if (activeSearchRequestControllerRef.current !== requestController) {
          return;
        }

        setSearchResults(response.documents);
      } catch (error) {
        if (isRequestCanceled(error)) {
          return;
        }

        if (activeSearchRequestControllerRef.current === requestController) {
          setSearchErrorMessage(getErrorMessage(error, '搜索文档失败，请稍后重试'));
        }
      } finally {
        if (activeSearchRequestControllerRef.current === requestController) {
          activeSearchRequestControllerRef.current = null;
          setIsSearchingDocuments(false);
        }
      }
    }

    void runDocumentSearch();

    return () => {
      cancelActiveSearchRequest(activeSearchRequestControllerRef);
    };
  }, [debouncedSearchKeyword, documents, searchRequestFolderId, searchScope]);

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
      setSearchResults(null);
      setSearchErrorMessage('');
      setSearchKeyword('');
      setSelectedFolderId(response.folder.id);
      setSelectedDocumentId(null);
      setMenuState(null);
      setEditingState(null);
      toast({ description: `已创建文件夹「${response.folder.name}」` });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '创建文件夹失败，请稍后重试'));
      throw error;
    } finally {
      setIsCreatingFolder(false);
    }
  }

  async function handleCreateDocument() {
    setErrorMessage('');
    setSearchErrorMessage('');
    setIsCreatingDocument(true);

    try {
      const response = await createDocument({ folder_id: selectedFolderId });
      setDocuments((currentDocuments) => [response.document, ...currentDocuments]);
      setSelectedDocumentId(response.document.id);
      setMenuState(null);
      setEditingState(null);
      setMoveState(null);
      toast({ description: `已创建文档「${response.document.title}」` });
      navigate(`/documents/${response.document.id}/edit`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '创建空文档失败，请稍后重试'));
    } finally {
      setIsCreatingDocument(false);
    }
  }

  function handleSelectFolder(folderId: number | null) {
    setSelectedFolderId(folderId);
    setSelectedDocumentId(null);
    setMenuState(null);
    setEditingState(null);

    if (normalizedSearchKeyword === '') {
      setSearchResults(null);
      setSearchErrorMessage('');
      return;
    }

    if (searchScope === 'current_folder') {
      setSearchResults(null);
      setSearchErrorMessage('');
    }
  }

  function handleChangeSearchKeyword(value: string) {
    setSearchErrorMessage('');
    setSearchKeyword(value);
  }

  function handleChangeSearchScope(scope: SearchScope) {
    if (scope === searchScope) {
      return;
    }

    cancelActiveSearchRequest(activeSearchRequestControllerRef);
    setIsSearchingDocuments(false);
    setSearchResults(null);
    setSearchErrorMessage('');
    setSearchScope(scope);
  }

  function handleChangeDocumentSortMode(sortMode: DocumentSortMode) {
    setDocumentSortMode(sortMode);
  }

  function handleClearSearchKeyword() {
    setSearchResults(null);
    setSearchErrorMessage('');
    setSearchKeyword('');
  }

  function handleSelectDocument(documentId: number) {
    setSelectedDocumentId(documentId);
    setMenuState(null);
    navigate(`/documents/${documentId}/edit`);
  }

  function handleOpenFolderMenu(folderId: number) {
    setEditingState(null);
    setMenuState({ type: 'folder', id: folderId });
  }

  function handleOpenDocumentMenu(documentId: number) {
    setEditingState(null);
    setMenuState({ type: 'document', id: documentId });
  }

  function handleCloseFolderMenu(folderId?: number) {
    setMenuState((currentMenu) => {
      if (currentMenu?.type !== 'folder') {
        return currentMenu;
      }

      if (folderId !== undefined && currentMenu.id !== folderId) {
        return currentMenu;
      }

      return null;
    });
  }

  function handleCloseDocumentMenu(documentId?: number) {
    setMenuState((currentMenu) => {
      if (currentMenu?.type !== 'document') {
        return currentMenu;
      }

      if (documentId !== undefined && currentMenu.id !== documentId) {
        return currentMenu;
      }

      return null;
    });
  }

  function handleStartFolderEditing(folder: FolderItem) {
    setMenuState(null);
    setEditingState({ type: 'folder', id: folder.id, value: folder.name });
  }

  function handleStartDocumentEditing(document: DocumentItem) {
    setMenuState(null);
    setEditingState({ type: 'document', id: document.id, value: document.title });
  }

  function handleChangeEditingValue(value: string) {
    setEditingState((currentEditing) => {
      if (!currentEditing) {
        return currentEditing;
      }

      return { ...currentEditing, value };
    });
  }

  function handleCancelEditing() {
    setEditingState(null);
  }

  async function handleSubmitEditing() {
    if (!editingState) {
      return;
    }

    setErrorMessage('');

    if (editingState.type === 'folder') {
      setIsUpdatingFolder(true);

      try {
        const response = await updateFolder(editingState.id, { name: editingState.value });
        setFolders((currentFolders) =>
          currentFolders.map((folder) => (folder.id === response.folder.id ? response.folder : folder)),
        );
        setEditingState(null);
        toast({ description: `已重命名文件夹为「${response.folder.name}」` });
      } catch (error) {
        setErrorMessage(getErrorMessage(error, '修改文件夹失败，请稍后重试'));
      } finally {
        setIsUpdatingFolder(false);
      }

      return;
    }

    setIsUpdatingDocument(true);

    try {
      const response = await updateDocument(editingState.id, { title: editingState.value });
      setDocuments((currentDocuments) => applyUpdatedDocument(currentDocuments, response.document));
      setEditingState(null);
      toast({ description: `已重命名文档为「${response.document.title}」` });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '修改文档失败，请稍后重试'));
    } finally {
      setIsUpdatingDocument(false);
    }
  }

  function handleRequestDeleteFolder(folder: FolderItem) {
    setMenuState(null);
    setDeleteState({ type: 'folder', id: folder.id, name: folder.name });
  }

  function handleRequestDeleteDocument(document: DocumentItem) {
    setMenuState(null);
    setDeleteState({ type: 'document', id: document.id, name: document.title });
  }

  function handleRequestMoveDocument(document: DocumentItem) {
    setMenuState(null);
    setMoveState({
      id: document.id,
      title: document.title,
      folderId: document.folder_id,
    });
  }

  function handleCancelMoveDocument() {
    setMoveState(null);
  }

  function handleCancelDelete() {
    setDeleteState(null);
  }

  async function handleConfirmMoveDocument(folderId: number | null) {
    const target = moveState;
    if (!target) {
      return;
    }

    setErrorMessage('');
    setIsMovingDocument(true);

    try {
      const response = await updateDocument(target.id, { folder_id: folderId });
      setDocuments((currentDocuments) => applyUpdatedDocument(currentDocuments, response.document));
      if (selectedDocumentId === target.id && response.document.folder_id !== selectedFolderId) {
        setSelectedDocumentId(null);
      }
      setMoveState(null);
      toast({
        description: `已将文档「${response.document.title}」移动到「${getFolderDisplayName(folders, response.document.folder_id)}」`,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '移动文档失败，请稍后重试'));
    } finally {
      setIsMovingDocument(false);
    }
  }

  async function handleConfirmDelete() {
    const target = deleteState;
    if (!target) {
      return;
    }

    setErrorMessage('');

    if (target.type === 'folder') {
      setIsDeletingFolder(true);

      try {
        await deleteFolder(target.id);
        setFolders((currentFolders) => currentFolders.filter((folder) => folder.id !== target.id));
        if (selectedFolderId === target.id) {
          setSelectedFolderId(null);
          setSelectedDocumentId(null);
          if (searchScope === 'current_folder') {
            setSearchResults(null);
            setSearchErrorMessage('');
            setSearchKeyword('');
          }
        }
        setDeleteState(null);
        toast({ description: `已删除文件夹「${target.name}」`, variant: 'destructive' });
      } catch (error) {
        setErrorMessage(getErrorMessage(error, '删除文件夹失败，请稍后重试'));
      } finally {
        setIsDeletingFolder(false);
      }

      return;
    }

    setIsDeletingDocument(true);

    try {
      await deleteDocument(target.id);
      setDocuments((currentDocuments) => currentDocuments.filter((document) => document.id !== target.id));
      if (selectedDocumentId === target.id) {
        setSelectedDocumentId(null);
      }
      setDeleteState(null);
      toast({ description: `已删除文档「${target.name}」`, variant: 'destructive' });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '删除文档失败，请稍后重试'));
    } finally {
      setIsDeletingDocument(false);
    }
  }

  return {
    user,
    folders,
    visibleDocuments,
    filteredDocuments,
    documentPanelTitle,
    documentPanelTotalCount,
    documentSortMode,
    searchScope,
    searchKeyword,
    searchErrorMessage,
    selectedFolderId,
    selectedFolderName: selectedFolder?.name ?? '根目录',
    selectedDocumentId,
    errorMessage,
    isLoading,
    isCreatingFolder,
    isCreatingDocument,
    isLoggingOut,
    isUpdatingFolder,
    isUpdatingDocument,
    isDeletingFolder,
    isDeletingDocument,
    isMovingDocument,
    isSearchingDocuments,
    isSearchPending,
    searchResultCount,
    isGlobalSearchActive,
    folderMenuId: menuState?.type === 'folder' ? menuState.id : null,
    documentMenuId: menuState?.type === 'document' ? menuState.id : null,
    editingFolderId: editingState?.type === 'folder' ? editingState.id : null,
    editingDocumentId: editingState?.type === 'document' ? editingState.id : null,
    editingValue: editingState?.value ?? '',
    deleteTarget: deleteState,
    moveTarget: moveState,
    handleLogout,
    handleCreateFolder,
    handleCreateDocument,
    handleSelectFolder,
    handleSelectDocument,
    handleChangeSearchKeyword,
    handleChangeSearchScope,
    handleChangeDocumentSortMode,
    handleClearSearchKeyword,
    handleOpenFolderMenu,
    handleOpenDocumentMenu,
    handleCloseFolderMenu,
    handleCloseDocumentMenu,
    handleStartFolderEditing,
    handleStartDocumentEditing,
    handleChangeEditingValue,
    handleSubmitEditing,
    handleCancelEditing,
    handleRequestMoveDocument,
    handleRequestDeleteFolder,
    handleRequestDeleteDocument,
    handleCancelMoveDocument,
    handleCancelDelete,
    handleConfirmMoveDocument,
    handleConfirmDelete,
  };
}
