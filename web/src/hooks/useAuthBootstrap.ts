// useAuthBootstrap.ts - 在应用启动时尝试恢复登录会话
import { useEffect } from 'react';

import { fetchCurrentUser, refreshSession } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

// useAuthBootstrap - 尝试从现有 AT 或 RT 中恢复会话
// 返回值：无
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
      try {
        if (accessToken) {
          const user = await fetchCurrentUser();
          if (!cancelled) {
            setUser(user);
          }
          return;
        }

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
