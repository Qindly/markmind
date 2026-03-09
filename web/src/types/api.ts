// api.ts - 定义通用接口响应类型
import type { InternalAxiosRequestConfig } from 'axios';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
}

export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
