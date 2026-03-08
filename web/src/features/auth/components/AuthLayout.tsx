// AuthLayout.tsx - 提供登录注册页共用的布局骨架
import type { PropsWithChildren, ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardSection, CardTitle } from '../../../components/ui/Card';

export interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  footer: ReactNode;
}

/**
 * AuthLayout - 鉴权页面布局组件
 * 参数 props: 标题、描述、底部文案与正文内容
 * 返回值：登录注册页布局 JSX 结构
 */
export function AuthLayout({ title, description, footer, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-3xl border border-slate-200 bg-slate-950 p-10 text-white shadow-soft lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-white/20 px-3 py-1 text-xs tracking-[0.24em] text-slate-300">
              MARKMIND
            </span>
            <div className="space-y-4">
              <h2 className="text-4xl font-semibold leading-tight">把知识沉淀成真正可回看的第二大脑。</h2>
              <p className="max-w-md text-sm leading-7 text-slate-300">
                登录后即可进入你的云端知识库。先从鉴权模块开始，把整个工程骨架稳稳搭起来。
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-400">黑白极简、结构清晰、方便后续手写重构，这就是 MarkMind 的第一步。</p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <CardSection>{children}</CardSection>
            <div className="mt-6 text-sm text-slate-500">{footer}</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
