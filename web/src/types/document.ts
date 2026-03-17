// document.ts - 定义文档详情页、历史版本与正文保存相关的类型
export interface DocumentDetail {
  id: number;
  folder_id: number | null;
  title: string;
  content: string;
  has_unversioned_content: boolean;
  created_at: string;
  updated_at: string;
}

export type DocumentSavePhase = 'dirty' | 'autosaving' | 'manual-saving' | 'saved' | 'save-error';

export type DocumentContentSaveMode = 'auto' | 'manual';

export interface GetDocumentDetailResponseData {
  document: DocumentDetail;
}

export interface UpdateDocumentContentRequest {
  content: string;
  save_mode: DocumentContentSaveMode;
}

export interface UpdateDocumentContentResponseData {
  document: DocumentDetail;
}

export type DocumentRevisionOperation = 'create' | 'update' | 'rollback' | 'seed';

export interface DocumentRevisionSummary {
  id: number;
  revision_number: number;
  operation: DocumentRevisionOperation;
  content_size: number;
  preview: string;
  source_revision_id: number | null;
  created_at: string;
}

export interface ListDocumentRevisionsResponseData {
  revisions: DocumentRevisionSummary[];
  has_unversioned_content: boolean;
}

export type DocumentRevisionDiffLineType = 'equal' | 'insert' | 'delete';

export interface DocumentRevisionDiffLine {
  type: DocumentRevisionDiffLineType;
  content: string;
  old_line_number: number | null;
  new_line_number: number | null;
}

export interface DocumentRevisionDiffStats {
  added_lines: number;
  deleted_lines: number;
  unchanged_lines: number;
}

export interface DocumentRevisionDiff {
  from_revision: DocumentRevisionSummary;
  to_revision: DocumentRevisionSummary;
  stats: DocumentRevisionDiffStats;
  lines: DocumentRevisionDiffLine[];
}

export interface GetDocumentRevisionDiffResponseData {
  diff: DocumentRevisionDiff;
}

export interface RollbackDocumentRevisionResponseData {
  document: DocumentDetail;
  revision: DocumentRevisionSummary;
  rolled_back: boolean;
}
