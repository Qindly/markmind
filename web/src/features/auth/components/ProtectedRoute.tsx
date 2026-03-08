// ProtectedRoute.tsx - 保护需要登录后才能访问的页面
import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../../../stores/authStore';

/**
 * ProtectedRoute - 未登录时自动跳转到登录页
 * 参数 props: 受保护页面内容
 * 返回值：路由守卫 JSX 结构
 */
export function ProtectedRoute({ children }: PropsWithChildren) {
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isBootstrapping) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">正在恢复登录状态...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}
