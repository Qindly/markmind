// document.ts - 封装文档详情查询与正文保存接口请求
import { apiClient } from './client';

import type { ApiResponse } from '../types/api';
import type {
  GetDocumentDetailResponseData,
  UpdateDocumentContentRequest,
  UpdateDocumentContentResponseData,
} from '../types/document';

// fetchDocumentDetail - 请求指定文档的详情数据。
// 参数 documentId: 文档 ID。
// 返回值：文档详情响应数据。
export async function fetchDocumentDetail(documentId: number): Promise<GetDocumentDetailResponseData> {
  const { data } = await apiClient.get<ApiResponse<GetDocumentDetailResponseData>>(`/documents/${documentId}`);
  return data.data;
}

// updateDocumentContent - 保存指定文档的正文内容。
// 参数 documentId: 文档 ID。
// 参数 payload: 文档正文更新参数。
// 返回值：更新后的文档详情数据。
export async function updateDocumentContent(
  documentId: number,
  payload: UpdateDocumentContentRequest,
): Promise<UpdateDocumentContentResponseData> {
  const { data } = await apiClient.put<ApiResponse<UpdateDocumentContentResponseData>>(
    `/documents/${documentId}/content`,
    payload,
  );
  return data.data;
}
