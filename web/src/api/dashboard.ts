// dashboard.ts - 封装首页列表与文件夹/文档操作接口请求
import { apiClient } from './client';

import type { ApiResponse } from '../types/api';
import type {
  CreateDocumentRequest,
  CreateDocumentResponseData,
  CreateFolderRequest,
  CreateFolderResponseData,
  DashboardData,
  DeleteDocumentResponseData,
  DeleteFolderResponseData,
  SearchDocumentsRequest,
  SearchDocumentsResponseData,
  UpdateDocumentRequest,
  UpdateDocumentResponseData,
  UpdateFolderRequest,
  UpdateFolderResponseData,
} from '../types/dashboard';

// fetchDashboard - 请求首页所需的文件夹与文档数据。
// 返回值：首页展示数据。
export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
  return data.data;
}

// searchDocuments - 搜索当前目录标题或正文命中的文档。
// 参数 payload: 搜索关键字与当前目录。
// 返回值：匹配到的文档摘要列表。
export async function searchDocuments(payload: SearchDocumentsRequest): Promise<SearchDocumentsResponseData> {
  const { data } = await apiClient.get<ApiResponse<SearchDocumentsResponseData>>('/documents/search', {
    params: {
      keyword: payload.keyword,
      ...(payload.folder_id === undefined || payload.folder_id === null ? {} : { folder_id: payload.folder_id }),
    },
  });

  return data.data;
}

// createFolder - 创建文件夹。
// 参数 payload: 文件夹创建参数。
// 返回值：新建后的文件夹数据。
export async function createFolder(payload: CreateFolderRequest): Promise<CreateFolderResponseData> {
  const { data } = await apiClient.post<ApiResponse<CreateFolderResponseData>>('/folders', payload);
  return data.data;
}

// updateFolder - 更新文件夹名称。
// 参数 folderId: 文件夹 ID。
// 参数 payload: 文件夹更新参数。
// 返回值：更新后的文件夹数据。
export async function updateFolder(folderId: number, payload: UpdateFolderRequest): Promise<UpdateFolderResponseData> {
  const { data } = await apiClient.put<ApiResponse<UpdateFolderResponseData>>(`/folders/${folderId}`, payload);
  return data.data;
}

// deleteFolder - 删除文件夹。
// 参数 folderId: 文件夹 ID。
// 返回值：删除结果。
export async function deleteFolder(folderId: number): Promise<DeleteFolderResponseData> {
  const { data } = await apiClient.delete<ApiResponse<DeleteFolderResponseData>>(`/folders/${folderId}`);
  return data.data;
}

// createDocument - 创建空文档。
// 参数 payload: 文档创建参数。
// 返回值：新建后的文档数据。
export async function createDocument(payload: CreateDocumentRequest): Promise<CreateDocumentResponseData> {
  const { data } = await apiClient.post<ApiResponse<CreateDocumentResponseData>>('/documents', payload);
  return data.data;
}

// updateDocument - 更新文档标题或归类。
// 参数 documentId: 文档 ID。
// 参数 payload: 文档更新参数。
// 返回值：更新后的文档数据。
export async function updateDocument(documentId: number, payload: UpdateDocumentRequest): Promise<UpdateDocumentResponseData> {
  const { data } = await apiClient.put<ApiResponse<UpdateDocumentResponseData>>(`/documents/${documentId}`, payload);
  return data.data;
}

// deleteDocument - 删除文档。
// 参数 documentId: 文档 ID。
// 返回值：删除结果。
export async function deleteDocument(documentId: number): Promise<DeleteDocumentResponseData> {
  const { data } = await apiClient.delete<ApiResponse<DeleteDocumentResponseData>>(`/documents/${documentId}`);
  return data.data;
}
