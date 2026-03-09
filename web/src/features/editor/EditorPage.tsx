// EditorPage.tsx - 承接文档详情加载、错误态与编辑工作区渲染
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { InfoBlock } from '../../components/ui/InfoBlock';
import { PageState } from '../../components/ui/PageState';
import { EditorWorkspace } from './components/EditorWorkspace';
import { useDocumentEditor } from './useDocumentEditor';

/**
 * EditorPage - 文档编辑页入口组件。
 * 返回值：编辑页加载态、错误态或编辑工作区 JSX 结构。
 */
export function EditorPage() {
  const editor = useDocumentEditor();

  if (editor.isLoading) {
    return <PageState message="正在加载文档内容..." />;
  }

  if (!editor.document) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <Card className="w-full max-w-xl shadow-none">
          <CardContent className="space-y-5 p-6 pt-6 sm:p-8 sm:pt-8">
            <InfoBlock
              compact
              description={editor.errorMessage || '当前文档暂时无法打开，请返回首页后再试一次。'}
              eyebrow="Editor"
              title="文档暂时无法打开"
              titleAs="h1"
            />
            <div className="flex flex-wrap gap-2">
              <Button className="w-auto" onClick={editor.handleBack} type="button" variant="secondary">
                返回首页
              </Button>
              <Button className="w-auto" onClick={editor.reloadDocument} type="button">
                重新加载
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <EditorWorkspace
      content={editor.content}
      document={editor.document}
      errorMessage={editor.errorMessage}
      isDirty={editor.isDirty}
      isSaving={editor.isSaving}
      onBack={editor.handleBack}
      onContentChange={editor.handleContentChange}
      onSave={editor.handleSave}
      savePhase={editor.savePhase}
      statusMessage={editor.statusMessage}
    />
  );
}
