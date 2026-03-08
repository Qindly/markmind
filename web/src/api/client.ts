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
