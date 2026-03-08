// DashboardPage.tsx - 登录后的临时首页占位页
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logoutUser } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { getErrorMessage } from '../../lib/getErrorMessage';
import { useAuthStore } from '../../stores/authStore';

/**
 * DashboardPage - 登录成功后的首页占位页
 * 返回值：占位首页 JSX 结构
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await logoutUser();
      clearSession();
      navigate('/login', {
        replace: true,
        state: { notice: '你已安全退出登录' },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '退出登录失败，请稍后重试'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>登录成功</CardTitle>
          <CardDescription>这是一块用于验证鉴权闭环的首页占位区，后续可以替换成真正的文档列表页面。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p>当前用户：{user?.username}</p>
            <p className="mt-2">邮箱：{user?.email}</p>
          </div>

          {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">{errorMessage}</div> : null}

          <Button className="max-w-40" isLoading={isSubmitting} onClick={handleLogout} type="button">
            退出登录
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
