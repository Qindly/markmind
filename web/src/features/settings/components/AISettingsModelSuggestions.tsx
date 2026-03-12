// AISettingsModelSuggestions.tsx - 展示设置页模型列表拉取结果与模型候选
import type { AISettingsModelListResult } from '../../../types/settings';

export interface AISettingsModelSuggestionsProps {
  currentModel: string;
  result: AISettingsModelListResult | null;
  onSelectModel: (value: string) => void;
}

function resolveAPIStyleLabel(apiStyle?: AISettingsModelListResult['api_style']) {
  if (apiStyle === 'responses') {
    return 'Responses';
  }

  if (apiStyle === 'chat_completions') {
    return 'Chat Completions';
  }

  return '';
}

/**
 * AISettingsModelSuggestions - 展示模型列表拉取结果和可点击的模型候选项。
 * 参数 props: 当前模型、模型拉取结果与模型选择回调。
 * 返回值：模型候选面板 JSX 结构。
 */
export function AISettingsModelSuggestions({ currentModel, result, onSelectModel }: AISettingsModelSuggestionsProps) {
  if (!result) {
    return null;
  }

  const apiStyleLabel = resolveAPIStyleLabel(result.api_style);

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-4 py-3">
      <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
        <p className="text-[var(--color-text-primary)]">{result.message}</p>
        <p>标准地址：{result.base_url}</p>
        {apiStyleLabel ? <p>当前协议缓存：{apiStyleLabel}</p> : null}
        {result.using_saved_api_key ? <p>本次拉取沿用了已保存的 API Key。</p> : null}
      </div>

      {result.models.length > 0 ? (
        <div className="max-h-48 overflow-y-auto rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] p-2">
          <div className="flex flex-wrap gap-2">
            {result.models.map((modelName) => {
              const isSelected = modelName === currentModel;

              return (
                <button
                  className={
                    isSelected
                      ? 'rounded-full border border-[#353534] bg-[#353534] px-3 py-1.5 text-xs text-white transition'
                      : 'rounded-full border border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition hover:bg-[#E8E6DC]'
                  }
                  key={modelName}
                  onClick={() => onSelectModel(modelName)}
                  type="button"
                >
                  {modelName}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
