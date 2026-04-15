// document.ts - 封装文档详情、历史版本与正文保存接口请求
import { apiClient } from './client';

import type { ApiResponse } from '../types/api';
import type {
  GetDocumentDetailResponseData,
  GetDocumentRevisionDiffResponseData,
  ListDocumentRevisionsResponseData,
  RollbackDocumentRevisionResponseData,
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

// fetchDocumentRevisions - 获取指定文档的历史版本列表。
// 参数 documentId: 文档 ID。
// 返回值：历史版本列表响应数据。
export async function fetchDocumentRevisions(documentId: number): Promise<ListDocumentRevisionsResponseData> {
  const { data } = await apiClient.get<ApiResponse<ListDocumentRevisionsResponseData>>(
    `/documents/${documentId}/revisions`,
  );
  return data.data;
}

// fetchDocumentRevisionDiff - 获取两个历史版本之间的文本 diff。
// 参数 documentId: 文档 ID。
// 参数 fromRevisionId: 被对比的历史版本 ID。
// 参数 toRevisionId: 作为目标参考的历史版本 ID。
// 返回值：diff 响应数据。
export async function fetchDocumentRevisionDiff(
  documentId: number,
  fromRevisionId: number,
  toRevisionId: number,
): Promise<GetDocumentRevisionDiffResponseData> {
  const { data } = await apiClient.get<ApiResponse<GetDocumentRevisionDiffResponseData>>(
    `/documents/${documentId}/revisions/diff`,
    {
      params: {
        from_revision_id: fromRevisionId,
        to_revision_id: toRevisionId,
      },
    },
  );
  return data.data;
}

// rollbackDocumentRevision - 将指定文档回滚到某个历史版本。
// 参数 documentId: 文档 ID。
// 参数 revisionId: 目标历史版本 ID。
// 返回值：回滚后的文档详情与结果版本信息。
export async function rollbackDocumentRevision(
  documentId: number,
  revisionId: number,
): Promise<RollbackDocumentRevisionResponseData> {
  const { data } = await apiClient.post<ApiResponse<RollbackDocumentRevisionResponseData>>(
    `/documents/${documentId}/revisions/${revisionId}/rollback`,
  );
  return data.data;
}
