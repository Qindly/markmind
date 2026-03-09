// document.ts - 定义文档详情页与正文保存相关的类型
export interface DocumentDetail {
  id: number;
  folder_id: number | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface GetDocumentDetailResponseData {
  document: DocumentDetail;
}

export interface UpdateDocumentContentRequest {
  content: string;
}

export interface UpdateDocumentContentResponseData {
  document: DocumentDetail;
}
