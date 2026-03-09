// RegisterForm.tsx - 处理注册表单的交互与提交
import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { registerUser } from '../../../api/auth';
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { getErrorMessage } from '../../../lib/getErrorMessage';

interface RegisterFormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * RegisterForm - 注册表单组件。
 * 返回值：注册表单 JSX 结构。
 */
export function RegisterForm() {
  const navigate = useNavigate();
  const usernameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const [formState, setFormState] = useState<RegisterFormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof RegisterFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!formState.username.trim() || !formState.email.trim() || !formState.password || !formState.confirmPassword) {
      setErrorMessage('请完整填写注册信息');
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setErrorMessage('两次输入的密码不一致');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        username: formState.username.trim(),
        email: formState.email.trim(),
        password: formState.password,
        confirm_password: formState.confirmPassword,
      });
      navigate('/login', {
        replace: true,
        state: { notice: '注册成功，请使用刚刚创建的账号登录' },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '注册失败，请稍后重试'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {errorMessage ? (
        <Alert className="shadow-none" variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <FormField htmlFor={usernameId} label="用户名">
        <Input autoComplete="username" id={usernameId} onChange={(event) => updateField('username', event.target.value)} placeholder="例如 ice" value={formState.username} />
      </FormField>

      <FormField htmlFor={emailId} label="邮箱">
        <Input
          autoComplete="email"
          id={emailId}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder="name@example.com"
          type="email"
          value={formState.email}
        />
      </FormField>

      <FormField htmlFor={passwordId} label="密码">
        <Input autoComplete="new-password" id={passwordId} onChange={(event) => updateField('password', event.target.value)} placeholder="请输入密码" type="password" value={formState.password} />
      </FormField>

      <FormField htmlFor={confirmPasswordId} label="确认密码">
        <Input
          autoComplete="new-password"
          id={confirmPasswordId}
          onChange={(event) => updateField('confirmPassword', event.target.value)}
          placeholder="请再次输入密码"
          type="password"
          value={formState.confirmPassword}
        />
      </FormField>

      <Button isLoading={isSubmitting} type="submit">
        注册
      </Button>

      <p className="text-center text-sm text-[var(--color-text-secondary)]">
        已有账号？
        <Link className="ml-1 font-medium text-[var(--color-text-primary)] underline-offset-4 hover:underline" to="/login">
          去登录
        </Link>
      </p>
    </form>
  );
}
