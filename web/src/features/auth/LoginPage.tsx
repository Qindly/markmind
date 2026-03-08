// LoginPage.tsx - 登录页面容器
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { toast } from '../../hooks/useToast';
import { AuthLayout } from './components/AuthLayout';
import { LoginForm } from './components/LoginForm';

interface LoginLocationState {
  notice?: string;
}

/**
 * LoginPage - 登录页面。
 * 返回值：登录页面 JSX 结构。
 */
export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LoginLocationState | null;

  useEffect(() => {
    if (!locationState?.notice) {
      return;
    }

    toast({ description: locationState.notice });
    navigate(location.pathname, { replace: true });
  }, [location.pathname, locationState?.notice, navigate]);

  return (
    <AuthLayout
      description="输入你的账号与密码，继续回到 MarkMind。"
      footer="推荐先完成登录与注册闭环，再继续做文档列表与编辑器模块。"
      title="欢迎回来"
    >
      <LoginForm />
    </AuthLayout>
  );
}