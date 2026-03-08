// authStore.ts - 管理全局鉴权状态
import { create } from 'zustand';

import type { AuthUser } from '../types/auth';

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  finishBootstrap: () => void;
}

// useAuthStore - 提供全局登录态读写能力
// 返回值：Zustand 鉴权状态仓库
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  setAccessToken: (accessToken) =>
    set((state) => ({
      accessToken,
      isAuthenticated: Boolean(accessToken && state.user),
    })),
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: Boolean(state.accessToken && user),
    })),
  setSession: (accessToken, user) =>
    set({
      accessToken,
      user,
      isAuthenticated: true,
    }),
  clearSession: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    }),
  finishBootstrap: () => set({ isBootstrapping: false }),
}));
