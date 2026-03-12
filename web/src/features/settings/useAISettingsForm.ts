// useAISettingsForm.ts - 管理设置页 AI Provider 配置的加载、编辑与保存状态
import { useEffect, useState } from 'react';

import { fetchAISettings, updateAISettings } from '../../api/settings';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';

interface AISettingsFormState {
  baseURL: string;
  model: string;
  apiKey: string;
}

export interface UseAISettingsFormResult {
  form: AISettingsFormState;
  hasAPIKey: boolean;
  maskedAPIKey: string;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string;
  handleChangeBaseURL: (value: string) => void;
  handleChangeModel: (value: string) => void;
  handleChangeAPIKey: (value: string) => void;
  handleSave: () => Promise<void>;
}

/**
 * useAISettingsForm - 管理设置页 AI Provider 配置的加载、编辑与保存状态。
 * 返回值：设置页渲染与提交流程所需的状态和回调。
 */
export function useAISettingsForm(): UseAISettingsFormResult {
  const [form, setForm] = useState<AISettingsFormState>({
    baseURL: '',
    model: '',
    apiKey: '',
  });
  const [hasAPIKey, setHasAPIKey] = useState(false);
  const [maskedAPIKey, setMaskedAPIKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAISettings() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetchAISettings();
        if (cancelled) {
          return;
        }

        setForm({
          baseURL: response.settings.base_url,
          model: response.settings.model,
          apiKey: '',
        });
        setHasAPIKey(response.settings.has_api_key);
        setMaskedAPIKey(response.settings.masked_api_key);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error, '加载 AI 设置失败，请稍后重试'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAISettings();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage('');

    try {
      const response = await updateAISettings({
        base_url: form.baseURL,
        api_key: form.apiKey,
        model: form.model,
      });

      setForm({
        baseURL: response.settings.base_url,
        model: response.settings.model,
        apiKey: '',
      });
      setHasAPIKey(response.settings.has_api_key);
      setMaskedAPIKey(response.settings.masked_api_key);
      toast({ description: 'AI 设置已保存' });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '保存 AI 设置失败，请稍后重试'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleChangeBaseURL(value: string) {
    setForm((currentForm) => ({ ...currentForm, baseURL: value }));
  }

  function handleChangeModel(value: string) {
    setForm((currentForm) => ({ ...currentForm, model: value }));
  }

  function handleChangeAPIKey(value: string) {
    setForm((currentForm) => ({ ...currentForm, apiKey: value }));
  }

  return {
    form,
    hasAPIKey,
    maskedAPIKey,
    isLoading,
    isSaving,
    errorMessage,
    handleChangeBaseURL,
    handleChangeModel,
    handleChangeAPIKey,
    handleSave,
  };
}
