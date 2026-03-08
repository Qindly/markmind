// LoginForm.tsx - 处理登录表单的交互与提交
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { loginUser } from '../../../api/auth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { getErrorMessage } from '../../../lib/getErrorMessage';
import { useAuthStore } from '../../../stores/authStore';

interface LoginFormState {
  identifier: string;
  password: string;
}

/**
 * LoginForm - 登录表单组件。
 * 返回值：登录表单 JSX 结构。
 */
export function LoginForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [formState, setFormState] = useState<LoginFormState>({
    identifier: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof LoginFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!formState.identifier.trim() || !formState.password.trim()) {
      setErrorMessage('请填写账号与密码');
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await loginUser({
        identifier: formState.identifier.trim(),
        password: formState.password,
      });
      setSession(session.access_token, session.user);
      navigate('/');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '登录失败，请稍后重试'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {errorMessage ? (
        <div className="rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-page-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
          {errorMessage}
        </div>
      ) : null}

      <label className="block space-y-2 text-sm font-medium text-[var(--color-text-primary)]">
        <span>账号（邮箱 / 用户名）</span>
        <Input
          autoComplete="username"
          onChange={(event) => updateField('identifier', event.target.value)}
          placeholder="请输入邮箱或用户名"
          value={formState.identifier}
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-[var(--color-text-primary)]">
        <span>密码</span>
        <Input
          autoComplete="current-password"
          onChange={(event) => updateField('password', event.target.value)}
          placeholder="请输入密码"
          type="password"
          value={formState.password}
        />
      </label>

      <Button isLoading={isSubmitting} type="submit">
        登录
      </Button>

      <p className="text-center text-sm text-[var(--color-text-secondary)]">
        还没有账号？
        <Link className="ml-1 font-medium text-[var(--color-text-primary)] underline-offset-4 hover:underline" to="/register">
          去注册
        </Link>
      </p>
    </form>
  );
}