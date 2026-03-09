// App.tsx - 配置应用根路由与全站顶部消息容器
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Toaster } from './components/ui/Toaster';
import { GuestRoute } from './features/auth/components/GuestRoute';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { EditorPage } from './features/editor/EditorPage';
import { useAuthBootstrap } from './hooks/useAuthBootstrap';

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
              <LoginPage />
            </GuestRoute>
          }
          path="/login"
        />
        <Route
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
          path="/register"
        />
        <Route
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
          path="/"
        />
        <Route
          element={
            <ProtectedRoute>
              <EditorPage />
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