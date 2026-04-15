// useAIStreamRequest.ts - 通用 AI 流式请求 hook，消除 magicEdit / translate 重复逻辑
import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import type { AIRequestStatus } from '../../types/ai';

type StreamFn<TPayload, TResponse> = (
  payload: TPayload,
  options: { signal?: AbortSignal; onChunk: (delta: string) => void },
) => Promise<TResponse>;

export interface AIStreamRequestState {
  result: string;
  errorMessage: string;
  status: AIRequestStatus;
}

export interface UseAIStreamRequestResult<TPayload, TResponse> extends AIStreamRequestState {
  submit: (payload: TPayload) => Promise<void>;
  abort: () => void;
  reset: () => void;
  applyResponse: (response: TResponse) => void;
}

interface UseAIStreamRequestOptions<TResponse> {
  /** 从最终响应中提取结果文本 */
  extractResult: (response: TResponse) => string;
  /** 请求失败时的默认提示 */
  fallbackErrorMessage: string;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function useAIStreamRequest<TPayload, TResponse>(
  streamFn: StreamFn<TPayload, TResponse>,
  options: UseAIStreamRequestOptions<TResponse>,
): UseAIStreamRequestResult<TPayload, TResponse> {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [result, setResult] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState<AIRequestStatus>('idle');

  // 组件卸载时中断进行中的请求
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setResult('');
    setErrorMessage('');
    setStatus('idle');
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const submit = useCallback(
    async (payload: TPayload) => {
      // 中断前一个请求
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setStatus('streaming');
      setErrorMessage('');
      setResult('');

      try {
        const response = await streamFn(payload, {
          signal: controller.signal,
          onChunk: (delta) => {
            if (abortControllerRef.current !== controller) return;
            setResult((prev) => prev + delta);
          },
        });

        if (abortControllerRef.current !== controller) return;
        setResult(options.extractResult(response));
        setStatus('completed');
      } catch (error) {
        if (abortControllerRef.current !== controller) return;

        if (isAbortError(error)) {
          setStatus('aborted');
          return;
        }

        setStatus('idle');
        setErrorMessage(getErrorMessage(error, options.fallbackErrorMessage));
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [streamFn, options],
  );

  const applyResponse = useCallback(
    (response: TResponse) => {
      setResult(options.extractResult(response));
      setStatus('completed');
    },
    [options],
  );

  return { result, errorMessage, status, submit, abort, reset, applyResponse };
}

/** 复制 AI 结果到剪贴板的通用工具函数 */
export async function copyAIResult(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast({ description: 'AI 结果已复制到剪贴板' });
  } catch {
    toast({ description: '复制结果失败，请手动复制', variant: 'destructive' });
  }
}
