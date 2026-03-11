// RegisterPage.tsx - 注册页面容器
import { AuthLayout } from './components/AuthLayout';
import { RegisterForm } from './components/RegisterForm';

/**
 * RegisterPage - 注册页面。
 * 返回值：注册页面 JSX 结构。
 */
export function RegisterPage() {
  return (
    <AuthLayout
      description="填写基础信息，开始搭建属于你的云端知识库。"
      footer="注册成功后会返回登录页，再由你手动完成登录。"
      title="创建你的账号"
    >
      <RegisterForm />
    </AuthLayout>
  );
}