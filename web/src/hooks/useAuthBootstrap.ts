// useAuthBootstrap.ts - ????????????????
import { useEffect } from 'react';

import { fetchCurrentUser, refreshSession } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

// useAuthBootstrap - ? sessionStorage ? Refresh Token ?????
// ?????
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
