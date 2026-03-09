// dashboard.ts - 定义首页文件夹与文档列表相关类型
export interface FolderItem {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: number;
  folder_id: number | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  folders: FolderItem[];
  documents: DocumentItem[];
}

export interface CreateFolderRequest {
  name: string;
}

export interface CreateFolderResponseData {
  folder: FolderItem;
}

export interface UpdateFolderRequest {
  name: string;
}

export interface UpdateFolderResponseData {
  folder: FolderItem;
}

export interface DeleteFolderResponseData {
  deleted_id: number;
}

export interface CreateDocumentRequest {
  folder_id?: number | null;
  title?: string;
}

export interface CreateDocumentResponseData {
  document: DocumentItem;
}

export interface UpdateDocumentRequest {
  title: string;
}

export interface UpdateDocumentResponseData {
  document: DocumentItem;
}

export interface DeleteDocumentResponseData {
  deleted_id: number;
}