// auth.ts - 封装鉴权相关接口请求函数
import { apiClient, bareClient } from './client';

import type { ApiResponse } from '../types/api';
import type {
  AuthSessionData,
  CurrentUserResponseData,
  LoginRequest,
  LogoutResponseData,
  RegisterRequest,
  RegisterResponseData,
} from '../types/auth';

// registerUser - 请求注册接口
// 参数 payload: 注册表单数据
// 返回值：注册成功后的用户信息
export async function registerUser(payload: RegisterRequest): Promise<RegisterResponseData> {
  const { data } = await bareClient.post<ApiResponse<RegisterResponseData>>('/auth/register', payload);
  return data.data;
}

// loginUser - 请求登录接口
// 参数 payload: 登录表单数据
// 返回值：登录成功后的会话数据
export async function loginUser(payload: LoginRequest): Promise<AuthSessionData> {
  const { data } = await bareClient.post<ApiResponse<AuthSessionData>>('/auth/login', payload);
  return data.data;
}

// refreshSession - 请求刷新接口
// 返回值：刷新成功后的会话数据
export async function refreshSession(): Promise<AuthSessionData> {
  const { data } = await bareClient.post<ApiResponse<AuthSessionData>>('/auth/refresh');
  return data.data;
}

// fetchCurrentUser - 请求当前用户信息
// 返回值：当前登录用户信息
export async function fetchCurrentUser() {
  const { data } = await apiClient.get<ApiResponse<CurrentUserResponseData>>('/auth/me');
  return data.data.user;
}

// logoutUser - 请求登出接口
// 返回值：登出结果
export async function logoutUser(): Promise<LogoutResponseData> {
  const { data } = await bareClient.post<ApiResponse<LogoutResponseData>>('/auth/logout');
  return data.data;
}
