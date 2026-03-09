// AuthLayout.tsx - 提供登录注册页面共用的布局骨架
import type { PropsWithChildren, ReactNode } from 'react';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { InfoBlock } from '../../../components/ui/InfoBlock';
import { SectionHeader } from '../../../components/ui/SectionHeader';

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
        <Card className="hidden lg:flex lg:flex-col">
          <CardContent className="flex h-full flex-col justify-between p-10 pt-10">
            <InfoBlock
              description="登录后即可进入你的云端知识库。先从鉴权模块开始，把整个工程骨架稳稳搭起来。"
              descriptionClassName="max-w-md text-sm leading-7 text-[var(--color-text-secondary)]"
              eyebrow="MARKMIND"
              title="把知识沉淀成真正可回看的第二大脑。"
              titleAs="h2"
              titleClassName="text-4xl font-semibold leading-tight text-[var(--color-text-primary)]"
            />

            <Card className="rounded-2xl shadow-none">
              <CardContent className="p-5 pt-5">
                <InfoBlock compact description="护眼、克制、层级清晰，这一版视觉更适合 Markdown 与文档类产品长期阅读。" />
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card className="self-center">
          <CardHeader className="p-8 pb-0 sm:p-10 sm:pb-0">
            <SectionHeader className="block" description={description} title={title} titleAs="h1" />
          </CardHeader>
          <CardContent className="p-8 pt-8 sm:p-10 sm:pt-8">
            {children}
            <div className="mt-6 border-t border-[var(--color-border-soft)] pt-6">
              <InfoBlock compact description={footer} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
