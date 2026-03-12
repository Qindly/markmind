// SettingsPage.tsx - 渲染用户设置页并承载 AI Provider 配置表单
import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { PageState } from '../../components/ui/PageState';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { AISettingsCard } from './components/AISettingsCard';
import { useAISettingsForm } from './useAISettingsForm';

interface SettingsBackTarget {
  to: string;
  label: string;
}

function resolveBackTarget(searchParams: URLSearchParams): SettingsBackTarget {
  const from = searchParams.get('from');
  const documentID = Number(searchParams.get('document_id'));

  if (from === 'editor' && Number.isInteger(documentID) && documentID > 0) {
    return {
      to: `/documents/${documentID}/edit`,
      label: '返回文档',
    };
  }

  return {
    to: '/',
    label: '返回首页',
  };
}

/**
 * SettingsPage - 设置页入口组件。
 * 返回值：设置页布局与 AI Provider 配置表单 JSX 结构。
 */
export function SettingsPage() {
  const [searchParams] = useSearchParams();
  const backTarget = resolveBackTarget(searchParams);
  const settingsForm = useAISettingsForm();

  if (settingsForm.isLoading) {
    return <PageState message="正在加载设置页..." />;
  }

  return (
    <main className="min-h-screen px-3 py-4 text-[var(--color-text-primary)] sm:px-4 sm:py-5">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <SectionHeader
          action={
            <Button asChild className="w-auto" size="sm" type="button" variant="secondary">
              <Link to={backTarget.to}>{backTarget.label}</Link>
            </Button>
          }
          description="在这里统一维护编辑器局部 AI 能力所需的 Provider 信息。"
          eyebrow="Settings"
          title="AI 设置"
        />

        <AISettingsCard
          apiKey={settingsForm.form.apiKey}
          baseURL={settingsForm.form.baseURL}
          errorMessage={settingsForm.errorMessage}
          hasAPIKey={settingsForm.hasAPIKey}
          isFetchingModels={settingsForm.isFetchingModels}
          isSaving={settingsForm.isSaving}
          isTesting={settingsForm.isTesting}
          maskedAPIKey={settingsForm.maskedAPIKey}
          model={settingsForm.form.model}
          modelListResult={settingsForm.modelListResult}
          onChangeAPIKey={settingsForm.handleChangeAPIKey}
          onChangeBaseURL={settingsForm.handleChangeBaseURL}
          onChangeModel={settingsForm.handleChangeModel}
          onFetchModels={settingsForm.handleFetchModels}
          onSave={settingsForm.handleSave}
          onSelectModel={settingsForm.handleSelectModel}
          onTestConnection={settingsForm.handleTestConnection}
          testResult={settingsForm.testResult}
        />
      </div>
    </main>
  );
}
