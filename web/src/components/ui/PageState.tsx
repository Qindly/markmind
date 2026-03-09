// PageState.tsx - 提供全屏页面状态占位组件
import { Card, CardContent } from './Card';
import { InfoBlock } from './InfoBlock';

export interface PageStateProps {
  message: string;
}

/**
 * PageState - 全屏页面状态占位组件。
 * 参数 props: 当前页面状态文案。
 * 返回值：居中的状态卡片 JSX 结构。
 */
export function PageState({ message }: PageStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
      <Card className="w-full max-w-md shadow-none">
        <CardContent className="p-6 pt-6 sm:p-8 sm:pt-8">
          <InfoBlock align="center" compact description={message} eyebrow="MARKMIND" />
        </CardContent>
      </Card>
    </main>
  );
}
