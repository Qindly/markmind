// useAuthBootstrap.ts - 负责在应用启动时恢复登录态
import { useEffect } from 'react';

import { fetchCurrentUser, refreshSession } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

// useAuthBootstrap - 优先使用现有 Access Token 恢复当前会话
// 如果 Access Token 已失效，则回退到 Refresh Token 刷新流程
export function useAuthBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const finishBootstrap = useAuthStore((state) => state.finishBootstrap);

  useEffect(() => {
    if (!isBootstrapping) {
      return;
    }

    let cancelled = false;

    async function bootstrapSession() {
      let shouldRefresh = true;

      if (accessToken) {
        try {
          const user = await fetchCurrentUser();
          if (!cancelled) {
            setUser(user);
          }
          shouldRefresh = false;
        } catch {
          shouldRefresh = true;
        }
      }

      if (!shouldRefresh) {
        if (!cancelled) {
          finishBootstrap();
        }
        return;
      }

      try {
        const session = await refreshSession();
        if (!cancelled) {
          setSession(session.access_token, session.user);
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          finishBootstrap();
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearSession, finishBootstrap, isBootstrapping, setSession, setUser]);
}
