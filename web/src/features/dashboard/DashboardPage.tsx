// DashboardPage.tsx - 渲染登录后的首页文档列表与目录管理入口
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { DashboardDeleteDialog } from './components/DashboardDeleteDialog';
import { DocumentListPanel } from './components/DocumentListPanel';
import { FolderSidebar } from './components/FolderSidebar';
import { useDashboardHome } from './useDashboardHome';

/**
 * DashboardPage - 登录后的真实首页列表页。
 * 返回值：首页列表 JSX 结构。
 */
export function DashboardPage() {
  const dashboard = useDashboardHome();
  const isDeletingCurrentTarget =
    dashboard.deleteTarget?.type === 'folder' ? dashboard.isDeletingFolder : dashboard.isDeletingDocument;

  return (
    <>
      <main className="min-h-screen px-3 py-4 text-[var(--color-text-primary)] sm:px-4 sm:py-5">
        <div className="flex w-full flex-col gap-4 lg:flex-row">
          <FolderSidebar
            editingFolderId={dashboard.editingFolderId}
            editingValue={dashboard.editingValue}
            folderMenuId={dashboard.folderMenuId}
            folders={dashboard.folders}
            isCreatingFolder={dashboard.isCreatingFolder}
            isLoggingOut={dashboard.isLoggingOut}
            isUpdatingFolder={dashboard.isUpdatingFolder}
            onCancelEditing={dashboard.handleCancelEditing}
            onChangeEditingValue={dashboard.handleChangeEditingValue}
            onCloseFolderMenu={dashboard.handleCloseFolderMenu}
            onCreateFolder={dashboard.handleCreateFolder}
            onLogout={dashboard.handleLogout}
            onOpenFolderMenu={dashboard.handleOpenFolderMenu}
            onRequestDeleteFolder={dashboard.handleRequestDeleteFolder}
            onSelectFolder={dashboard.handleSelectFolder}
            onSelectRoot={() => dashboard.handleSelectFolder(null)}
            onStartFolderEditing={dashboard.handleStartFolderEditing}
            onSubmitEditing={dashboard.handleSubmitEditing}
            selectedFolderId={dashboard.selectedFolderId}
            user={dashboard.user}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {dashboard.errorMessage ? (
              <Alert className="shadow-none" variant="destructive">
                <AlertDescription>{dashboard.errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <DocumentListPanel
              currentFolderName={dashboard.selectedFolderName}
              documentMenuId={dashboard.documentMenuId}
              documents={dashboard.visibleDocuments}
              editingDocumentId={dashboard.editingDocumentId}
              editingValue={dashboard.editingValue}
              isCreatingDocument={dashboard.isCreatingDocument}
              isLoading={dashboard.isLoading}
              isUpdatingDocument={dashboard.isUpdatingDocument}
              onCancelEditing={dashboard.handleCancelEditing}
              onChangeEditingValue={dashboard.handleChangeEditingValue}
              onCloseDocumentMenu={dashboard.handleCloseDocumentMenu}
              onCreateDocument={dashboard.handleCreateDocument}
              onOpenDocumentMenu={dashboard.handleOpenDocumentMenu}
              onRequestDeleteDocument={dashboard.handleRequestDeleteDocument}
              onSelectDocument={dashboard.handleSelectDocument}
              onStartDocumentEditing={dashboard.handleStartDocumentEditing}
              onSubmitEditing={dashboard.handleSubmitEditing}
              selectedDocumentId={dashboard.selectedDocumentId}
            />
          </div>
        </div>
      </main>

      <DashboardDeleteDialog
        isSubmitting={Boolean(isDeletingCurrentTarget)}
        onCancel={dashboard.handleCancelDelete}
        onConfirm={dashboard.handleConfirmDelete}
        target={dashboard.deleteTarget}
      />
    </>
  );
}
