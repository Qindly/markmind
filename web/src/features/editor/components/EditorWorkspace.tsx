// EditorWorkspace.tsx - 渲染编辑页的编辑器、预览区、左侧概览卡片与固定目录导航
import type { EditorView } from '@codemirror/view';
import { Link } from 'react-router-dom';

import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import type { DocumentDetail, DocumentSavePhase } from '../../../types/document';
import { formatEditorDateTime } from '../formatEditorDateTime';
import type { UseEditorSelectionAIResult } from '../useEditorSelectionAI';
import { useMarkdownPreview } from '../useMarkdownPreview';
import { useEditorToc } from '../useEditorToc';
import { CodeMirrorEditor } from './CodeMirrorEditor';
import { EditorInfoPanel } from './EditorInfoPanel';
import { EditorTocPanel } from './EditorTocPanel';
import { EditorMagicEditDialog } from './EditorMagicEditDialog';
import { EditorSelectionActions } from './EditorSelectionActions';
import { EditorTranslateDialog } from './EditorTranslateDialog';
import { MarkdownPreview } from './MarkdownPreview';
export interface EditorWorkspaceProps {
  document: DocumentDetail;
  content: string;
  errorMessage: string;
  statusMessage: string;
  savePhase: DocumentSavePhase;
  isDirty: boolean;
  isSaving: boolean;
  uploadingImageCount: number;
  onBack: () => void;
  onContentChange: (value: string) => void;
  onImagePaste: (imageFiles: File[], view: EditorView) => Promise<void>;
  onSave: () => Promise<void>;
  selectionAI: UseEditorSelectionAIResult;
}
/** EditorWorkspace - 展示编辑页标题、左侧概览栏、CodeMirror 编辑器与实时预览。 */
export function EditorWorkspace({
  document,
  content,
  errorMessage,
  statusMessage,
  savePhase,
  isDirty,
  isSaving,
  uploadingImageCount,
  onBack,
  onContentChange,
  onImagePaste,
  onSave,
  selectionAI,
}: EditorWorkspaceProps) {
  const markdownPreview = useMarkdownPreview(content);
  const editorToc = useEditorToc({
    html: markdownPreview.html,
    headings: markdownPreview.headings,
    hasContent: markdownPreview.hasContent,
  });
  const isUploadingImages = uploadingImageCount > 0;
  return (
    <main className="min-h-screen px-3 py-4 text-[var(--color-text-primary)] sm:px-4 sm:py-5">
      <div className="hidden xl:block">
        <div className="fixed left-4 top-4 z-20 flex h-[calc(100vh-2rem)] w-[280px] flex-col gap-4">
          <EditorInfoPanel className="shrink-0" document={document} savePhase={savePhase} statusMessage={statusMessage} />
          <EditorTocPanel
            activeHeadingId={editorToc.activeHeadingId}
            className="min-h-0 flex-1"
            expandedState={editorToc.expandedState}
            onSelect={editorToc.handleSelectHeading}
            onToggle={editorToc.handleToggleHeading}
            scrollAreaClassName="min-h-0 flex-1 overflow-y-auto"
            tocTree={editorToc.tocTree}
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 xl:pl-[calc(280px+1.75rem)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[var(--color-border-soft)] p-6 pb-5">
            <SectionHeader
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Button className="w-auto" onClick={onBack} size="sm" type="button" variant="secondary">
                    返回首页
                  </Button>
                  <Button asChild className="w-auto" size="sm" type="button" variant="secondary">
                    <Link to={`/settings?from=editor&document_id=${document.id}`}>AI 设置</Link>
                  </Button>
                  <Button
                    className="w-auto"
                    disabled={!isDirty}
                    isLoading={isSaving}
                    onClick={() => void onSave()}
                    size="sm"
                    type="button"
                  >
                    保存内容
                  </Button>
                </div>
              }
              description={`文档 #${document.id} · 最近更新于 ${formatEditorDateTime(document.updated_at)}`}
              eyebrow="Editor"
              title={document.title}
            />
          </CardHeader>
          <CardContent className="space-y-5 p-6 pt-6">
            {errorMessage ? (
              <Alert className="shadow-none" variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-4 xl:hidden">
              <EditorInfoPanel document={document} savePhase={savePhase} statusMessage={statusMessage} />
              <EditorTocPanel
                activeHeadingId={editorToc.activeHeadingId}
                expandedState={editorToc.expandedState}
                onSelect={editorToc.handleSelectHeading}
                onToggle={editorToc.handleToggleHeading}
                tocTree={editorToc.tocTree}
              />
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <section className="space-y-4 rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-5">
                <div className="space-y-1.5">
                  <h2 className="text-sm font-medium text-[var(--color-text-primary)]">Markdown 编辑</h2>
                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    使用 CodeMirror 进行正文编辑，支持常见 Markdown / GFM 语法输入与截图粘贴上传。
                  </p>
                  {isUploadingImages ? (
                    <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
                      正在上传 {uploadingImageCount} 张图片，完成后会自动插入到当前粘贴位置。
                    </p>
                  ) : null}
                </div>
                <CodeMirrorEditor
                  onChange={onContentChange}
                  onEditorReady={selectionAI.handleEditorReady}
                  onImagePaste={onImagePaste}
                  onSelectionChange={selectionAI.handleSelectionChange}
                  placeholder="请输入 Markdown 内容..."
                  value={content}
                />
              </section>

              <section className="space-y-4 rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-5">
                <div className="space-y-1">
                  <h2 className="text-sm font-medium text-[var(--color-text-primary)]">实时预览</h2>
                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    基于 unified 管线按需生成标题、列表、公式、安全 HTML，并延迟加载 Mermaid、ECharts 与上传后的图片内容。
                  </p>
                </div>
                <MarkdownPreview
                  errorMessage={markdownPreview.errorMessage}
                  hasContent={editorToc.hasPreviewContent}
                  html={editorToc.previewHtml}
                  isRendering={markdownPreview.isRendering}
                  previewContainerRef={editorToc.previewContainerRef}
                />
              </section>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectionAI.selectionActionState ? (
        <EditorSelectionActions
          left={selectionAI.selectionActionState.left}
          onOpenMagicEdit={() => void selectionAI.handleOpenMagicEdit()}
          onOpenTranslate={() => void selectionAI.handleOpenTranslate()}
          top={selectionAI.selectionActionState.top}
        />
      ) : null}

      <EditorMagicEditDialog
        errorMessage={selectionAI.magicErrorMessage}
        instruction={selectionAI.magicInstruction}
        isSubmitting={selectionAI.isSubmittingMagicEdit}
        onApplyInsert={selectionAI.handleApplyMagicEditInsert}
        onApplyReplace={selectionAI.handleApplyMagicEditReplace}
        onCopy={selectionAI.handleCopyMagicEditResult}
        onInstructionChange={selectionAI.handleMagicInstructionChange}
        onOpenChange={selectionAI.handleMagicEditDialogOpenChange}
        onSubmit={selectionAI.handleSubmitMagicEdit}
        open={selectionAI.isMagicEditDialogOpen}
        result={selectionAI.magicResult}
        selectedText={selectionAI.selectedText}
      />

      <EditorTranslateDialog
        errorMessage={selectionAI.translateErrorMessage}
        isSubmitting={selectionAI.isSubmittingTranslate}
        onApplyInsert={selectionAI.handleApplyTranslateInsert}
        onApplyReplace={selectionAI.handleApplyTranslateReplace}
        onChangeSourceLanguage={selectionAI.handleTranslateSourceLanguageChange}
        onChangeTargetLanguage={selectionAI.handleTranslateTargetLanguageChange}
        onCopy={selectionAI.handleCopyTranslateResult}
        onOpenChange={selectionAI.handleTranslateDialogOpenChange}
        onSubmit={selectionAI.handleSubmitTranslate}
        open={selectionAI.isTranslateDialogOpen}
        result={selectionAI.translateResult}
        selectedText={selectionAI.selectedText}
        sourceLanguage={selectionAI.translateSourceLanguage}
        targetLanguage={selectionAI.translateTargetLanguage}
      />
    </main>
  );
}
