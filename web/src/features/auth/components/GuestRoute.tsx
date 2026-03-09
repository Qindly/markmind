// GuestRoute.tsx - 保护仅游客可访问的页面
import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { PageState } from '../../../components/ui/PageState';
import { useAuthStore } from '../../../stores/authStore';

/**
 * GuestRoute - 已登录时自动跳转到首页
 * 参数 props: 游客页面内容
 * 返回值：路由守卫 JSX 结构
 */
export function GuestRoute({ children }: PropsWithChildren) {
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isBootstrapping) {
    return <PageState message="正在准备页面..." />;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  return <>{children}</>;
}
