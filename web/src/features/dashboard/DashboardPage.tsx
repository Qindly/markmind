// DashboardPage.tsx - 渲染登录后的首页文档列表与目录管理入口
import { DocumentListPanel } from './components/DocumentListPanel';
import { FolderSidebar } from './components/FolderSidebar';
import { useDashboardHome } from './useDashboardHome';

/**
 * DashboardPage - 登录后的真实首页列表页
 * 返回值：首页列表 JSX 结构
 */
export function DashboardPage() {
  const dashboard = useDashboardHome();

  return (
    <main className="min-h-screen px-3 py-4 text-[var(--color-text-primary)] sm:px-4 sm:py-5">
      <div className="flex w-full flex-col gap-4 lg:flex-row">
        <FolderSidebar
          folders={dashboard.folders}
          isCreatingFolder={dashboard.isCreatingFolder}
          isLoggingOut={dashboard.isLoggingOut}
          onCreateFolder={dashboard.handleCreateFolder}
          onLogout={dashboard.handleLogout}
          onSelectFolder={dashboard.handleSelectFolder}
          onSelectRoot={() => dashboard.handleSelectFolder(null)}
          selectedFolderId={dashboard.selectedFolderId}
          user={dashboard.user}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {dashboard.errorMessage ? (
            <div className="rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-page-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
              {dashboard.errorMessage}
            </div>
          ) : null}

          <DocumentListPanel
            currentFolderName={dashboard.selectedFolderName}
            documents={dashboard.visibleDocuments}
            isCreatingDocument={dashboard.isCreatingDocument}
            isLoading={dashboard.isLoading}
            onCreateDocument={dashboard.handleCreateDocument}
            onSelectDocument={dashboard.handleSelectDocument}
            selectedDocumentId={dashboard.selectedDocumentId}
          />
        </div>
      </div>
    </main>
  );
}
