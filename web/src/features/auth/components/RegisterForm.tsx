// RegisterForm.tsx - 处理注册表单的交互与提交
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { registerUser } from '../../../api/auth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { getErrorMessage } from '../../../lib/getErrorMessage';

interface RegisterFormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * RegisterForm - 注册表单组件
 * 返回值：注册表单 JSX 结构
 */
export function RegisterForm() {
  const navigate = useNavigate();
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

    if (formState.password.length < 8) {
      setErrorMessage('密码长度至少为 8 位');
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
      {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">{errorMessage}</div> : null}

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>用户名</span>
        <Input placeholder="例如 ice" value={formState.username} onChange={(event) => updateField('username', event.target.value)} />
      </label>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>邮箱</span>
        <Input placeholder="name@example.com" type="email" value={formState.email} onChange={(event) => updateField('email', event.target.value)} />
      </label>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>密码</span>
        <Input type="password" value={formState.password} onChange={(event) => updateField('password', event.target.value)} />
      </label>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>确认密码</span>
        <Input type="password" value={formState.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} />
      </label>

      <Button isLoading={isSubmitting} type="submit">
        注册
      </Button>

      <p className="text-center text-sm text-slate-500">
        已有账号？
        <Link className="ml-1 font-medium text-slate-950 underline-offset-4 hover:underline" to="/login">
          去登录
        </Link>
      </p>
    </form>
  );
}
