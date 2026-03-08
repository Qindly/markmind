// AuthLayout.tsx - 提供登录注册页面共用的布局骨架
import type { PropsWithChildren, ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardSection, CardTitle } from '../../../components/ui/Card';

export interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  footer: ReactNode;
}

/**
 * AuthLayout - 鉴权页面布局组件。
 * 参数 props: 标题、描述、底部文案与正文内容。
 * 返回值：登录注册页面布局 JSX 结构。
 */
export function AuthLayout({ title, description, footer, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <section className="hidden rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-10 shadow-soft lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-3 py-1 text-xs tracking-[0.24em] text-[var(--color-text-secondary)]">
              MARKMIND
            </span>
            <div className="space-y-4">
              <h2 className="text-4xl font-semibold leading-tight text-[var(--color-text-primary)]">
                把知识沉淀成真正可回看的第二大脑。
              </h2>
              <p className="max-w-md text-sm leading-7 text-[var(--color-text-secondary)]">
                登录后即可进入你的云端知识库。先从鉴权模块开始，把整个工程骨架稳稳搭起来。
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-5 py-4 text-sm text-[var(--color-text-secondary)]">
            护眼、克制、层级清晰，这一版视觉更适合 Markdown 与文档类产品长期阅读。
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <CardSection>{children}</CardSection>
            <div className="mt-6 text-sm text-[var(--color-text-secondary)]">{footer}</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}