// dashboard.ts - 封装首页列表与创建操作的接口请求
import { apiClient } from './client';

import type { ApiResponse } from '../types/api';
import type {
  CreateDocumentRequest,
  CreateDocumentResponseData,
  CreateFolderRequest,
  CreateFolderResponseData,
  DashboardData,
} from '../types/dashboard';

// fetchDashboard - 请求首页所需的文件夹与文档数据
// 返回值：首页展示数据
export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
  return data.data;
}

// createFolder - 创建文件夹
// 参数 payload: 文件夹创建参数
// 返回值：新建后的文件夹数据
export async function createFolder(payload: CreateFolderRequest): Promise<CreateFolderResponseData> {
  const { data } = await apiClient.post<ApiResponse<CreateFolderResponseData>>('/folders', payload);
  return data.data;
}

// createDocument - 创建空文档
// 参数 payload: 文档创建参数
// 返回值：新建后的文档数据
export async function createDocument(payload: CreateDocumentRequest): Promise<CreateDocumentResponseData> {
  const { data } = await apiClient.post<ApiResponse<CreateDocumentResponseData>>('/documents', payload);
  return data.data;
}
