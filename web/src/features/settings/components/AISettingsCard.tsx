// AISettingsCard.tsx - 渲染设置页中的 AI Provider 配置表单卡片
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { SectionHeader } from '../../../components/ui/SectionHeader';

export interface AISettingsCardProps {
  baseURL: string;
  model: string;
  apiKey: string;
  hasAPIKey: boolean;
  maskedAPIKey: string;
  errorMessage: string;
  isSaving: boolean;
  onChangeBaseURL: (value: string) => void;
  onChangeModel: (value: string) => void;
  onChangeAPIKey: (value: string) => void;
  onSave: () => Promise<void>;
}

/**
 * AISettingsCard - 展示设置页中的 AI Provider 配置表单。
 * 参数 props: 配置值、保存状态与字段交互回调。
 * 返回值：AI 设置卡片 JSX 结构。
 */
export function AISettingsCard({
  baseURL,
  model,
  apiKey,
  hasAPIKey,
  maskedAPIKey,
  errorMessage,
  isSaving,
  onChangeBaseURL,
  onChangeModel,
  onChangeAPIKey,
  onSave,
}: AISettingsCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="border-b border-[var(--color-border-soft)] p-6 pb-5">
        <SectionHeader
          description="仅支持 OpenAI Compatible Provider。Base URL 不需要手动补 /v1，保存时会自动补全。"
          eyebrow="AI"
          title="Provider 设置"
          titleAs="h2"
        />
      </CardHeader>
      <CardContent className="space-y-5 p-6 pt-6">
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <FormField htmlFor="ai-base-url" label="Base URL" message="请填写 Provider 的兼容接口根地址，例如 https://api.openai.com。">
          <Input
            autoComplete="off"
            id="ai-base-url"
            onChange={(event) => onChangeBaseURL(event.target.value)}
            placeholder="https://api.openai.com"
            spellCheck={false}
            value={baseURL}
          />
        </FormField>

        <FormField htmlFor="ai-model" label="Model" message="建议填写可直接用于 Chat Completions 的模型名。">
          <Input
            autoComplete="off"
            id="ai-model"
            onChange={(event) => onChangeModel(event.target.value)}
            placeholder="gpt-4.1-mini"
            spellCheck={false}
            value={model}
          />
        </FormField>

        <FormField
          htmlFor="ai-api-key"
          label="API Key"
          message={hasAPIKey ? `当前已配置：${maskedAPIKey || '已保存'}。留空表示继续沿用现有 API Key。` : '首次保存时必须填写 API Key。'}
        >
          <Input
            autoComplete="off"
            id="ai-api-key"
            onChange={(event) => onChangeAPIKey(event.target.value)}
            placeholder={hasAPIKey ? '如需更换，请输入新的 API Key' : 'sk-...'}
            spellCheck={false}
            type="password"
            value={apiKey}
          />
        </FormField>

        <div className="flex justify-end">
          <Button className="w-auto" isLoading={isSaving} onClick={() => void onSave()} type="button">
            保存 AI 设置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
