// LoginPage.tsx - 登录页面容器
import { useLocation } from 'react-router-dom';

import { AuthLayout } from './components/AuthLayout';
import { LoginForm } from './components/LoginForm';

interface LoginLocationState {
  notice?: string;
}

/**
 * LoginPage - 登录页面
 * 返回值：登录页 JSX 结构
 */
export function LoginPage() {
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;

  return (
    <AuthLayout
      title="欢迎回来"
      description="输入你的账号与密码，继续回到 MarkMind。"
      footer="推荐先完成登录与注册闭环，再继续做文档列表与编辑器模块。"
    >
      <LoginForm notice={locationState?.notice} />
    </AuthLayout>
  );
}
