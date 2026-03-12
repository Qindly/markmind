// client.ts - 封装带鉴权与自动刷新能力的 axios 实例
import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '../stores/authStore';
import type { ApiResponse, RetryableRequestConfig } from '../types/api';
import type { AuthSessionData } from '../types/auth';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export const bareClient = axios.create({
  baseURL,
  withCredentials: true,
});

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

function setAuthorizationHeader(config: InternalAxiosRequestConfig, token: string): void {
  const headers = AxiosHeaders.from(config.headers);
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
}

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

function buildAPIURL(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseURL}${normalizedPath}`;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = bareClient
      .post<ApiResponse<AuthSessionData>>('/auth/refresh')
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.data.access_token, data.data.user);
        return data.data.access_token;
      })
      .catch((error) => {
        useAuthStore.getState().clearSession();
        redirectToLogin();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// fetchWithAuth - 为 fetch 请求补齐 Access Token 与 401 自动刷新。
// 仅适用于请求体可安全重放的接口，例如 JSON 请求和流式读取。
export async function fetchWithAuth(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = useAuthStore.getState().accessToken;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    ...init,
    credentials: 'include',
    headers,
  };

  let response = await fetch(buildAPIURL(path), requestInit);
  if (response.status !== 401 || path.includes('/auth/refresh')) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  const retryHeaders = new Headers(init.headers);
  if (refreshedToken) {
    retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);
  }

  response = await fetch(buildAPIURL(path), {
    ...init,
    credentials: 'include',
    headers: retryHeaders,
  });

  return response;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    setAuthorizationHeader(config, token);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const requestURL = originalRequest?.url ?? '';

    if (
      !originalRequest ||
      originalRequest._retry ||
      error.response?.status !== 401 ||
      requestURL.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const token = await refreshAccessToken();
      if (token) {
        setAuthorizationHeader(originalRequest, token);
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
