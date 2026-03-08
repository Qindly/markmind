// FolderSidebar.tsx - 渲染首页左侧目录栏与文件夹创建入口
import { useState, type FormEvent } from 'react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../lib/cn';
import type { AuthUser } from '../../../types/auth';
import type { FolderItem } from '../../../types/dashboard';
import { FolderSidebarItem } from './FolderSidebarItem';

export interface FolderSidebarProps {
  user: AuthUser | null;
  folders: FolderItem[];
  selectedFolderId: number | null;
  folderMenuId: number | null;
  editingFolderId: number | null;
  editingValue: string;
  isCreatingFolder: boolean;
  isLoggingOut: boolean;
  isUpdatingFolder: boolean;
  onSelectRoot: () => void;
  onSelectFolder: (folderId: number) => void;
  onCreateFolder: (name: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onOpenFolderMenu: (folderId: number) => void;
  onCloseFolderMenu: () => void;
  onStartFolderEditing: (folder: FolderItem) => void;
  onRequestDeleteFolder: (folder: FolderItem) => void;
  onChangeEditingValue: (value: string) => void;
  onSubmitEditing: () => Promise<void>;
  onCancelEditing: () => void;
}

/**
 * FolderSidebar - 首页左侧目录栏组件。
 * 参数 props: 当前用户、文件夹列表与相关交互回调。
 * 返回值：左侧目录栏 JSX 结构。
 */
export function FolderSidebar({
  user,
  folders,
  selectedFolderId,
  folderMenuId,
  editingFolderId,
  editingValue,
  isCreatingFolder,
  isLoggingOut,
  isUpdatingFolder,
  onSelectRoot,
  onSelectFolder,
  onCreateFolder,
  onLogout,
  onOpenFolderMenu,
  onCloseFolderMenu,
  onStartFolderEditing,
  onRequestDeleteFolder,
  onChangeEditingValue,
  onSubmitEditing,
  onCancelEditing,
}: FolderSidebarProps) {
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [folderName, setFolderName] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onCreateFolder(folderName);
      setFolderName('');
      setIsCreateMode(false);
    } catch {
      return;
    }
  }

  function handleCancel() {
    setFolderName('');
    setIsCreateMode(false);
  }

  return (
    <aside className="flex w-full max-w-xs flex-col rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-6 shadow-soft lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <div className="space-y-1 border-b border-[var(--color-border-soft)] pb-5">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{user?.username ?? '未登录用户'}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{user?.email ?? '暂无邮箱信息'}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">目录</p>
          <p className="text-xs text-[var(--color-text-secondary)]">先从根目录和单层文件夹开始。</p>
        </div>
        <Button className="h-10 w-auto px-3 text-xs" disabled={isCreatingFolder} onClick={() => setIsCreateMode(true)} type="button">
          新建文件夹
        </Button>
      </div>

      {isCreateMode ? (
        <form className="mt-4 space-y-3 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-4" onSubmit={handleSubmit}>
          <Input
            autoFocus
            maxLength={64}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="请输入文件夹名称"
            value={folderName}
          />
          <div className="flex gap-3">
            <Button className="h-10 w-auto px-4" isLoading={isCreatingFolder} type="submit">
              确认创建
            </Button>
            <Button className="h-10 w-auto px-4" onClick={handleCancel} type="button" variant="danger">
              取消
            </Button>
          </div>
        </form>
      ) : null}

      <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
        <button
          className={cn(
            'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition',
            selectedFolderId === null
              ? 'border-[var(--color-option-selected)] bg-[var(--color-option-selected)] text-[var(--color-option-selected-text)]'
              : 'border-[var(--color-border-soft)] bg-[var(--color-page-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-button-light-hover)]',
          )}
          onClick={onSelectRoot}
          type="button"
        >
          <span className="font-medium">根目录</span>
          <span className={cn('text-xs', selectedFolderId === null ? 'text-[var(--color-option-selected-muted)]' : 'text-[var(--color-text-muted)]')}>ROOT</span>
        </button>

        {folders.map((folder) => (
          <FolderSidebarItem
            editingValue={editingValue}
            folder={folder}
            isEditing={editingFolderId === folder.id}
            isMenuOpen={folderMenuId === folder.id}
            isSaving={isUpdatingFolder && editingFolderId === folder.id}
            isSelected={selectedFolderId === folder.id}
            key={folder.id}
            onCancelEdit={onCancelEditing}
            onCloseMenu={onCloseFolderMenu}
            onDelete={() => onRequestDeleteFolder(folder)}
            onEditValueChange={onChangeEditingValue}
            onSelect={() => onSelectFolder(folder.id)}
            onStartEdit={() => onStartFolderEditing(folder)}
            onSubmitEdit={onSubmitEditing}
            onToggleMenu={() => onOpenFolderMenu(folder.id)}
          />
        ))}

        {folders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-5 text-sm text-[var(--color-text-secondary)]">
            还没有文件夹，先新建一个吧。
          </div>
        ) : null}
      </nav>

      <Button className="mt-5 h-10 w-full" isLoading={isLoggingOut} onClick={onLogout} type="button" variant="secondary">
        退出登录
      </Button>
    </aside>
  );
}