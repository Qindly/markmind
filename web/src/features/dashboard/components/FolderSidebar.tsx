// FolderSidebar.tsx - 渲染首页左侧目录栏与文件夹创建入口
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { AuthUser } from '../../../types/auth';
import type { FolderItem } from '../../../types/dashboard';
import { FolderCreateForm } from './FolderCreateForm';
import { FolderSidebarHeader } from './FolderSidebarHeader';
import { FolderRootItem } from './FolderRootItem';
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
  onCloseFolderMenu: (folderId?: number) => void;
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

  async function handleCreateFolder() {
    try {
      await onCreateFolder(folderName);
      setFolderName('');
      setIsCreateMode(false);
    } catch {
      return;
    }
  }

  function handleCancelCreate() {
    setFolderName('');
    setIsCreateMode(false);
  }

  return (
    <Card className="w-full max-w-xs lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <CardContent className="flex h-full flex-col p-6 pt-6">
        <FolderSidebarHeader isCreatingFolder={isCreatingFolder} onStartCreate={() => setIsCreateMode(true)} user={user} />

        {isCreateMode ? (
          <FolderCreateForm
            isSubmitting={isCreatingFolder}
            onCancel={handleCancelCreate}
            onChange={setFolderName}
            onSubmit={handleCreateFolder}
            value={folderName}
          />
        ) : null}

        <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
          <FolderRootItem isSelected={selectedFolderId === null} onSelect={onSelectRoot} />

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
              onDelete={() => onRequestDeleteFolder(folder)}
              onEditValueChange={onChangeEditingValue}
              onMenuOpenChange={(open) => {
                if (open) {
                  onOpenFolderMenu(folder.id);
                  return;
                }

                onCloseFolderMenu(folder.id);
              }}
              onSelect={() => onSelectFolder(folder.id)}
              onStartEdit={() => onStartFolderEditing(folder)}
              onSubmitEdit={onSubmitEditing}
            />
          ))}

          {folders.length === 0 ? (
            <EmptyState description="还没有文件夹，先新建一个吧。" title="目录还是空的" />
          ) : null}
        </nav>

        <Button className="mt-5 h-10 w-full" isLoading={isLoggingOut} onClick={onLogout} type="button" variant="secondary">
          退出登录
        </Button>
      </CardContent>
    </Card>
  );
}
