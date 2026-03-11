// ProtectedRoute.tsx - 保护需要登录后才能访问的页面
import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { PageState } from '../../../components/ui/PageState';
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
    return <PageState message="正在恢复登录状态..." />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}
