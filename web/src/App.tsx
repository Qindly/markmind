// App.tsx - 应用根组件与路由配置
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { GuestRoute } from './features/auth/components/GuestRoute';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { useAuthBootstrap } from './hooks/useAuthBootstrap';

/**
 * App - 根组件
 * 返回值：应用路由 JSX 结构
 */
export function App() {
  useAuthBootstrap();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
