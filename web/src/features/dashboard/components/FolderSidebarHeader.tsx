// FolderSidebarHeader.tsx - 渲染目录栏顶部的用户摘要与区块标题
import { Button } from '../../../components/ui/Button';
import { InfoBlock } from '../../../components/ui/InfoBlock';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import type { AuthUser } from '../../../types/auth';

export interface FolderSidebarHeaderProps {
  user: AuthUser | null;
  isCreatingFolder: boolean;
  onStartCreate: () => void;
}

/**
 * FolderSidebarHeader - 目录栏顶部的用户信息与目录说明区。
 * 参数 props: 当前用户、新建状态与创建回调。
 * 返回值：目录栏头部 JSX 结构。
 */
export function FolderSidebarHeader({ user, isCreatingFolder, onStartCreate }: FolderSidebarHeaderProps) {
  return (
    <>
      <div className="border-b border-[var(--color-border-soft)] pb-5">
        <InfoBlock compact description={user?.email ?? '暂无邮箱信息'} title={user?.username ?? '未登录用户'} />
      </div>

      <div className="mt-5">
        <SectionHeader
          action={
            <Button className="h-10 w-auto px-3 text-xs" disabled={isCreatingFolder} onClick={onStartCreate} type="button">
              新建文件夹
            </Button>
          }
          description="先从根目录和单层文件夹开始。"
          descriptionClassName="text-xs leading-5 text-[var(--color-text-secondary)]"
          title="目录"
          titleAs="p"
          titleClassName="text-sm font-medium tracking-normal text-[var(--color-text-primary)]"
        />
      </div>
    </>
  );
}
