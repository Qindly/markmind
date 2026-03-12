// useAISettingsForm.ts - 管理设置页 AI Provider 配置的加载、编辑与保存状态
import { useEffect, useState } from 'react';

import { fetchAIModels, fetchAISettings, testAISettings, updateAISettings } from '../../api/settings';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import type { AISettingsModelListResult, AISettingsTestResult } from '../../types/settings';

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
  isTesting: boolean;
  isFetchingModels: boolean;
  errorMessage: string;
  testResult: AISettingsTestResult | null;
  modelListResult: AISettingsModelListResult | null;
  handleChangeBaseURL: (value: string) => void;
  handleChangeModel: (value: string) => void;
  handleChangeAPIKey: (value: string) => void;
  handleSave: () => Promise<void>;
  handleTestConnection: () => Promise<void>;
  handleFetchModels: () => Promise<void>;
  handleSelectModel: (value: string) => void;
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
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [testResult, setTestResult] = useState<AISettingsTestResult | null>(null);
  const [modelListResult, setModelListResult] = useState<AISettingsModelListResult | null>(null);

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

  async function handleTestConnection() {
    setIsTesting(true);
    setErrorMessage('');

    try {
      const response = await testAISettings({
        base_url: form.baseURL,
        api_key: form.apiKey,
        model: form.model,
      });

      setTestResult(response.result);

      if (response.result.provider_reachable && response.result.model_available) {
        toast({ description: 'Provider 连通性测试通过' });
      }
    } catch (error) {
      setTestResult(null);
      setErrorMessage(getErrorMessage(error, '测试连接失败，请稍后重试'));
    } finally {
      setIsTesting(false);
    }
  }

  async function handleFetchModels() {
    setIsFetchingModels(true);
    setErrorMessage('');

    try {
      const response = await fetchAIModels({
        base_url: form.baseURL,
        api_key: form.apiKey,
        model: form.model,
      });

      setModelListResult(response.result);

      if (response.result.models.length > 0) {
        toast({ description: `已拉取 ${response.result.models.length} 个模型候选` });
      }
    } catch (error) {
      setModelListResult(null);
      setErrorMessage(getErrorMessage(error, '拉取模型列表失败，请稍后重试'));
    } finally {
      setIsFetchingModels(false);
    }
  }

  function handleChangeBaseURL(value: string) {
    setTestResult(null);
    setModelListResult(null);
    setForm((currentForm) => ({ ...currentForm, baseURL: value }));
  }

  function handleChangeModel(value: string) {
    setTestResult(null);
    setForm((currentForm) => ({ ...currentForm, model: value }));
  }

  function handleChangeAPIKey(value: string) {
    setTestResult(null);
    setModelListResult(null);
    setForm((currentForm) => ({ ...currentForm, apiKey: value }));
  }

  function handleSelectModel(value: string) {
    setTestResult(null);
    setForm((currentForm) => ({ ...currentForm, model: value }));
  }

  return {
    form,
    hasAPIKey,
    maskedAPIKey,
    isLoading,
    isSaving,
    isTesting,
    isFetchingModels,
    errorMessage,
    testResult,
    modelListResult,
    handleChangeBaseURL,
    handleChangeModel,
    handleChangeAPIKey,
    handleSave,
    handleTestConnection,
    handleFetchModels,
    handleSelectModel,
  };
}
