// getErrorMessage.ts - 从请求异常中提取适合展示给用户的错误文案
import axios from 'axios';

import type { ApiErrorResponse } from '../types/api';

// getErrorMessage - 提取接口错误消息
// 参数 error: 任意异常对象
// 参数 fallback: 默认兜底文案
// 返回值：适合直接展示的错误提示
export function getErrorMessage(error: unknown, fallback = '请求失败，请稍后再试'): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
}
