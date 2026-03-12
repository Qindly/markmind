// ai.ts - 封装编辑器局部 AI 功能接口请求
import { apiClient } from './client';

import type { ApiResponse } from '../types/api';
import type { MagicEditRequest, MagicEditResponseData, TranslateRequest, TranslateResponseData } from '../types/ai';

// requestMagicEdit - 请求魔法笔局部改写结果。
// 参数 payload: 当前选区与自定义指令。
// 返回值：AI 生成的局部改写结果。
export async function requestMagicEdit(payload: MagicEditRequest): Promise<MagicEditResponseData> {
  const { data } = await apiClient.post<ApiResponse<MagicEditResponseData>>('/ai/magic-edit', payload);
  return data.data;
}

// requestTranslation - 请求当前选区的双语翻译结果。
// 参数 payload: 当前选区、源语言与目标语言。
// 返回值：AI 生成的翻译结果与双语 Markdown 文本。
export async function requestTranslation(payload: TranslateRequest): Promise<TranslateResponseData> {
  const { data } = await apiClient.post<ApiResponse<TranslateResponseData>>('/ai/translate', payload);
  return data.data;
}
