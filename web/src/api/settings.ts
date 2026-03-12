// settings.ts - 封装设置页 AI Provider 配置相关接口请求
import { apiClient } from './client';

import type { ApiResponse } from '../types/api';
import type {
  GetAISettingsResponseData,
  TestAISettingsRequest,
  TestAISettingsResponseData,
  UpdateAISettingsRequest,
  UpdateAISettingsResponseData,
} from '../types/settings';

// fetchAISettings - 请求当前用户的 AI Provider 配置摘要。
// 返回值：设置页展示所需的 AI 配置摘要。
export async function fetchAISettings(): Promise<GetAISettingsResponseData> {
  const { data } = await apiClient.get<ApiResponse<GetAISettingsResponseData>>('/settings/ai');
  return data.data;
}

// updateAISettings - 更新当前用户的 AI Provider 配置。
// 参数 payload: 待保存的 AI Provider 配置。
// 返回值：保存后的 AI 配置摘要。
export async function updateAISettings(payload: UpdateAISettingsRequest): Promise<UpdateAISettingsResponseData> {
  const { data } = await apiClient.put<ApiResponse<UpdateAISettingsResponseData>>('/settings/ai', payload);
  return data.data;
}

// testAISettings - 测试当前表单中的 AI Provider 配置是否可用。
// 参数 payload: 当前准备测试的 Provider 配置。
// 返回值：Provider 连通性与模型可用性测试结果。
export async function testAISettings(payload: TestAISettingsRequest): Promise<TestAISettingsResponseData> {
  const { data } = await apiClient.post<ApiResponse<TestAISettingsResponseData>>('/settings/ai/test', payload);
  return data.data;
}
