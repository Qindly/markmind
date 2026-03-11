// App.tsx - 配置应用根路由与全站顶部消息容器
import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { PageState } from './components/ui/PageState';
import { Toaster } from './components/ui/Toaster';
import { GuestRoute } from './features/auth/components/GuestRoute';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { useAuthBootstrap } from './hooks/useAuthBootstrap';

const LazyLoginPage = lazy(async () => ({
  default: (await import('./features/auth/LoginPage')).LoginPage,
}));

const LazyRegisterPage = lazy(async () => ({
  default: (await import('./features/auth/RegisterPage')).RegisterPage,
}));

const LazyDashboardPage = lazy(async () => ({
  default: (await import('./features/dashboard/DashboardPage')).DashboardPage,
}));

const LazyEditorPage = lazy(async () => ({
  default: (await import('./features/editor/EditorPage')).EditorPage,
}));

/**
 * App - 根组件。
 * 返回值：应用路由与全站消息容器 JSX 结构。
 */
export function App() {
  useAuthBootstrap();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <GuestRoute>
              <Suspense fallback={<PageState message="正在加载登录页..." />}>
                <LazyLoginPage />
              </Suspense>
            </GuestRoute>
          }
          path="/login"
        />
        <Route
          element={
            <GuestRoute>
              <Suspense fallback={<PageState message="正在加载注册页..." />}>
                <LazyRegisterPage />
              </Suspense>
            </GuestRoute>
          }
          path="/register"
        />
        <Route
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageState message="正在加载首页..." />}>
                <LazyDashboardPage />
              </Suspense>
            </ProtectedRoute>
          }
          path="/"
        />
        <Route
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageState message="正在加载编辑页..." />}>
                <LazyEditorPage />
              </Suspense>
            </ProtectedRoute>
          }
          path="/documents/:id/edit"
        />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
