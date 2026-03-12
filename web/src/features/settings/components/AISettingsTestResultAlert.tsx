// AISettingsTestResultAlert.tsx - 展示设置页 Provider 连通性测试结果
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';
import type { AISettingsTestResult } from '../../../types/settings';

export interface AISettingsTestResultAlertProps {
  testResult: AISettingsTestResult;
}

function resolveAPIStyleLabel(apiStyle?: AISettingsTestResult['api_style']) {
  if (apiStyle === 'responses') {
    return 'Responses';
  }

  if (apiStyle === 'chat_completions') {
    return 'Chat Completions';
  }

  return '';
}

/**
 * AISettingsTestResultAlert - 展示设置页测试连接后的结构化结果。
 * 参数 props: 本次 Provider 探活返回的测试结果。
 * 返回值：测试结果提示框 JSX 结构。
 */
export function AISettingsTestResultAlert({ testResult }: AISettingsTestResultAlertProps) {
  const apiStyleLabel = resolveAPIStyleLabel(testResult.api_style);
  const isSuccess = testResult.provider_reachable && testResult.model_available;

  return (
    <Alert variant={isSuccess ? 'default' : 'destructive'}>
      <AlertTitle>{isSuccess ? '测试通过' : '测试未通过'}</AlertTitle>
      <AlertDescription>
        <span className="block">{testResult.message}</span>
        <span className="mt-1 block">标准地址：{testResult.base_url}</span>
        <span className="mt-1 block">测试模型：{testResult.model}</span>
        {apiStyleLabel ? <span className="mt-1 block">当前协议：{apiStyleLabel}</span> : null}
        {testResult.using_saved_api_key ? <span className="mt-1 block">本次测试沿用了已保存的 API Key。</span> : null}
      </AlertDescription>
    </Alert>
  );
}
