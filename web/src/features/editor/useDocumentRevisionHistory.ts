// useDocumentRevisionHistory.ts - 管理编辑页历史版本列表、diff 与回滚交互
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import {
  fetchDocumentRevisionDiff,
  fetchDocumentRevisions,
  rollbackDocumentRevision,
} from '../../api/document';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import type {
  DocumentDetail,
  DocumentRevisionDiff,
  DocumentRevisionSummary,
} from '../../types/document';

export interface UseDocumentRevisionHistoryOptions {
  documentID: number | null;
  document: DocumentDetail | null;
  isDirty: boolean;
  isSaving: boolean;
  setContent: Dispatch<SetStateAction<string>>;
  setDocument: Dispatch<SetStateAction<DocumentDetail | null>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
}

export interface UseDocumentRevisionHistoryResult {
  isOpen: boolean;
  revisions: DocumentRevisionSummary[];
  currentRevision: DocumentRevisionSummary | null;
  selectedRevision: DocumentRevisionSummary | null;
  diff: DocumentRevisionDiff | null;
  errorMessage: string;
  hasUnversionedContent: boolean;
  isLoadingRevisions: boolean;
  isLoadingDiff: boolean;
  isRollingBack: boolean;
  canRollback: boolean;
  handleOpen: () => void;
  handleOpenChange: (open: boolean) => void;
  handleSelectRevision: (revisionID: number) => void;
  handleRollback: () => Promise<void>;
}

interface DiffRevisionPair {
  fromRevision: DocumentRevisionSummary;
  toRevision: DocumentRevisionSummary;
}

function resolveDiffRevisionPair(
  revisions: DocumentRevisionSummary[],
  selectedRevisionID: number | null,
): DiffRevisionPair | null {
  const currentRevision = revisions[0] ?? null;
  const selectedRevision = revisions.find((revision) => revision.id === selectedRevisionID) ?? null;
  if (!currentRevision || !selectedRevision) {
    return null;
  }

  if (selectedRevision.id !== currentRevision.id) {
    return {
      fromRevision: selectedRevision,
      toRevision: currentRevision,
    };
  }

  const previousRevision = revisions[1] ?? null;
  if (!previousRevision) {
    return null;
  }

  return {
    fromRevision: previousRevision,
    toRevision: currentRevision,
  };
}

export function useDocumentRevisionHistory({
  documentID,
  document,
  isDirty,
  isSaving,
  setContent,
  setDocument,
  setErrorMessage,
}: UseDocumentRevisionHistoryOptions): UseDocumentRevisionHistoryResult {
  const [isOpen, setIsOpen] = useState(false);
  const [revisions, setRevisions] = useState<DocumentRevisionSummary[]>([]);
  const [selectedRevisionID, setSelectedRevisionID] = useState<number | null>(null);
  const [diff, setDiff] = useState<DocumentRevisionDiff | null>(null);
  const [errorMessage, setHistoryErrorMessage] = useState('');
  const [hasUnversionedContent, setHasUnversionedContent] = useState(false);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const revisionsRequestIDRef = useRef(0);
  const diffRequestIDRef = useRef(0);

  const currentRevision = revisions[0] ?? null;
  const selectedRevision = useMemo(
    () => revisions.find((revision) => revision.id === selectedRevisionID) ?? null,
    [revisions, selectedRevisionID],
  );
  const diffRevisionPair = useMemo(
    () => resolveDiffRevisionPair(revisions, selectedRevisionID),
    [revisions, selectedRevisionID],
  );

  const canRollback =
    selectedRevision !== null &&
    currentRevision !== null &&
    selectedRevision.id !== currentRevision.id &&
    !hasUnversionedContent &&
    !isDirty &&
    !isSaving &&
    !isRollingBack;

  const loadRevisions = useCallback(async () => {
    if (documentID === null) {
      setRevisions([]);
      setSelectedRevisionID(null);
      setHasUnversionedContent(false);
      return;
    }

    revisionsRequestIDRef.current += 1;
    const currentRequestID = revisionsRequestIDRef.current;
    setIsLoadingRevisions(true);
    setHistoryErrorMessage('');

    try {
      const response = await fetchDocumentRevisions(documentID);
      if (revisionsRequestIDRef.current !== currentRequestID) {
        return;
      }

      setRevisions(response.revisions);
      setHasUnversionedContent(response.has_unversioned_content);
      setSelectedRevisionID((currentSelectedRevisionID) => {
        if (
          currentSelectedRevisionID !== null &&
          response.revisions.some((revision) => revision.id === currentSelectedRevisionID) &&
          currentSelectedRevisionID !== response.revisions[0]?.id
        ) {
          return currentSelectedRevisionID;
        }

        return response.revisions[1]?.id ?? response.revisions[0]?.id ?? null;
      });
    } catch (error) {
      if (revisionsRequestIDRef.current !== currentRequestID) {
        return;
      }

      setHistoryErrorMessage(getErrorMessage(error, '加载历史版本失败，请稍后重试'));
      setRevisions([]);
      setSelectedRevisionID(null);
      setHasUnversionedContent(false);
    } finally {
      if (revisionsRequestIDRef.current === currentRequestID) {
        setIsLoadingRevisions(false);
      }
    }
  }, [documentID]);

  useEffect(() => {
    setIsOpen(false);
    setRevisions([]);
    setSelectedRevisionID(null);
    setDiff(null);
    setHasUnversionedContent(false);
    setHistoryErrorMessage('');
  }, [documentID]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadRevisions();
  }, [isOpen, loadRevisions]);

  useEffect(() => {
    if (!isOpen || documentID === null || !diffRevisionPair) {
      setDiff(null);
      setIsLoadingDiff(false);
      return;
    }

    diffRequestIDRef.current += 1;
    const currentRequestID = diffRequestIDRef.current;
    setIsLoadingDiff(true);

    void (async () => {
      try {
        const response = await fetchDocumentRevisionDiff(
          documentID,
          diffRevisionPair.fromRevision.id,
          diffRevisionPair.toRevision.id,
        );
        if (diffRequestIDRef.current !== currentRequestID) {
          return;
        }

        setDiff(response.diff);
      } catch (error) {
        if (diffRequestIDRef.current !== currentRequestID) {
          return;
        }

        setHistoryErrorMessage(getErrorMessage(error, '加载版本差异失败，请稍后重试'));
        setDiff(null);
      } finally {
        if (diffRequestIDRef.current === currentRequestID) {
          setIsLoadingDiff(false);
        }
      }
    })();
  }, [diffRevisionPair, documentID, isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setHistoryErrorMessage('');
    }
  }, []);

  const handleSelectRevision = useCallback((revisionID: number) => {
    setSelectedRevisionID(revisionID);
  }, []);

  const handleRollback = useCallback(async () => {
    if (documentID === null || document === null || !selectedRevision || !currentRevision) {
      return;
    }

    if (selectedRevision.id === currentRevision.id) {
      toast({ description: '当前已选中最新历史版本。' });
      return;
    }

    if (isDirty || isSaving) {
      setHistoryErrorMessage('当前还有未保存改动，请先保存后再执行回滚。');
      return;
    }

    if (hasUnversionedContent) {
      setHistoryErrorMessage('当前内容仅完成了自动保存，还没有进入历史版本。请先手动保存，再执行回滚。');
      return;
    }

    setIsRollingBack(true);
    setHistoryErrorMessage('');

    try {
      const response = await rollbackDocumentRevision(documentID, selectedRevision.id);
      if (response.rolled_back) {
        setDocument(response.document);
        setContent(response.document.content);
        setErrorMessage('');
        toast({ description: `已回滚到版本 #${selectedRevision.revision_number}` });
        setIsOpen(false);
        return;
      }

      toast({ description: '所选版本已经是当前历史版本。' });
      await loadRevisions();
    } catch (error) {
      setHistoryErrorMessage(getErrorMessage(error, '回滚历史版本失败，请稍后重试'));
    } finally {
      setIsRollingBack(false);
    }
  }, [
    currentRevision,
    document,
    documentID,
    hasUnversionedContent,
    isDirty,
    isSaving,
    loadRevisions,
    selectedRevision,
    setContent,
    setDocument,
    setErrorMessage,
  ]);

  return {
    isOpen,
    revisions,
    currentRevision,
    selectedRevision,
    diff,
    errorMessage,
    hasUnversionedContent,
    isLoadingRevisions,
    isLoadingDiff,
    isRollingBack,
    canRollback,
    handleOpen,
    handleOpenChange,
    handleSelectRevision,
    handleRollback,
  };
}
