// authStore.ts - ????????? Access Token ???
import { create } from 'zustand';

import type { AuthUser } from '../types/auth';

const ACCESS_TOKEN_STORAGE_KEY = 'markmind_access_token';

function readAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistAccessToken(accessToken: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (accessToken) {
      window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
      return;
    }

    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return;
  }
}

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

// useAuthStore - ???????????
// ????Zustand ??????
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: readAccessToken(),
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  setAccessToken: (accessToken) => {
    persistAccessToken(accessToken);
    set((state) => ({
      accessToken,
      isAuthenticated: Boolean(accessToken && state.user),
    }));
  },
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: Boolean(state.accessToken && user),
    })),
  setSession: (accessToken, user) => {
    persistAccessToken(accessToken);
    set({
      accessToken,
      user,
      isAuthenticated: true,
    });
  },
  clearSession: () => {
    persistAccessToken(null);
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
  finishBootstrap: () => set({ isBootstrapping: false }),
}));
