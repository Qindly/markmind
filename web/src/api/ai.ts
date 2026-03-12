// ai.ts - 封装编辑器局部 AI 功能接口请求
import { apiClient, fetchWithAuth } from './client';

import type { ApiErrorResponse, ApiResponse } from '../types/api';
import type {
  AIStreamChunkData,
  AIStreamErrorData,
  MagicEditRequest,
  MagicEditResponseData,
  TranslateRequest,
  TranslateResponseData,
} from '../types/ai';

// requestMagicEdit - 请求魔法笔局部改写结果。
// 参数 payload: 当前选区与自定义指令。
// 返回值：AI 生成的局部改写结果。
export async function requestMagicEdit(payload: MagicEditRequest): Promise<MagicEditResponseData> {
  const { data } = await apiClient.post<ApiResponse<MagicEditResponseData>>('/ai/magic-edit', payload);
  return data.data;
}

// requestTranslation - 请求当前选区的翻译结果。
// 参数 payload: 当前选区、源语言与目标语言。
// 返回值：AI 生成的翻译结果。
export async function requestTranslation(payload: TranslateRequest): Promise<TranslateResponseData> {
  const { data } = await apiClient.post<ApiResponse<TranslateResponseData>>('/ai/translate', payload);
  return data.data;
}

interface AIStreamRequestOptions {
  signal?: AbortSignal;
  onChunk: (delta: string) => void;
}

interface AIStreamEventPayload {
  event: string;
  data: string;
}

async function parseAPIError(response: Response): Promise<Error> {
  try {
    const errorResponse = (await response.json()) as ApiErrorResponse;
    return new Error(errorResponse.message || '请求失败，请稍后再试');
  } catch {
    return new Error(`请求失败（HTTP ${response.status}）`);
  }
}

function parseSSEEventPayload(rawEvent: string): AIStreamEventPayload | null {
  const normalizedEvent = rawEvent.replace(/\r/g, '').trim();
  if (normalizedEvent === '') {
    return null;
  }

  let eventName = 'message';
  const dataLines: string[] = [];

  normalizedEvent.split('\n').forEach((line) => {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
      return;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  });

  return {
    event: eventName,
    data: dataLines.join('\n'),
  };
}

async function consumeAIStream<TDone>(
  response: Response,
  options: AIStreamRequestOptions,
): Promise<TDone> {
  if (!response.body) {
    throw new Error('当前浏览器不支持 AI 流式返回');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let donePayload: TDone | null = null;

  async function handleEvent(rawEvent: string) {
    const eventPayload = parseSSEEventPayload(rawEvent);
    if (!eventPayload) {
      return;
    }

    if (eventPayload.event === 'chunk') {
      const chunkData = JSON.parse(eventPayload.data) as AIStreamChunkData;
      if (chunkData.delta) {
        options.onChunk(chunkData.delta);
      }
      return;
    }

    if (eventPayload.event === 'error') {
      const errorData = JSON.parse(eventPayload.data) as AIStreamErrorData;
      throw new Error(errorData.message || 'AI 处理失败，请稍后重试');
    }

    if (eventPayload.event === 'done') {
      donePayload = JSON.parse(eventPayload.data) as TDone;
    }
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done }).replace(/\r\n/g, '\n');

    let eventBoundaryIndex = buffer.indexOf('\n\n');
    while (eventBoundaryIndex > -1) {
      const rawEvent = buffer.slice(0, eventBoundaryIndex);
      buffer = buffer.slice(eventBoundaryIndex + 2);
      await handleEvent(rawEvent);
      eventBoundaryIndex = buffer.indexOf('\n\n');
    }

    if (done) {
      break;
    }
  }

  if (buffer.trim() !== '') {
    await handleEvent(buffer);
  }

  if (donePayload === null) {
    throw new Error('AI 流式响应不完整，请稍后重试');
  }

  return donePayload;
}

async function requestAIStream<TDone>(
  path: string,
  payload: MagicEditRequest | TranslateRequest,
  options: AIStreamRequestOptions,
): Promise<TDone> {
  const response = await fetchWithAuth(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!response.ok) {
    throw await parseAPIError(response);
  }

  return consumeAIStream<TDone>(response, options);
}

// streamMagicEdit - 以流式方式请求魔法笔局部改写结果。
// 参数 payload: 当前选区与自定义指令。
// 参数 options: 中断信号与增量结果回调。
// 返回值：魔法笔最终完整结果。
export async function streamMagicEdit(
  payload: MagicEditRequest,
  options: AIStreamRequestOptions,
): Promise<MagicEditResponseData> {
  return requestAIStream<MagicEditResponseData>('/ai/magic-edit/stream', payload, options);
}

// streamTranslation - 以流式方式请求当前选区的翻译结果。
// 参数 payload: 当前选区、源语言与目标语言。
// 参数 options: 中断信号与增量结果回调。
// 返回值：翻译最终完整结果。
export async function streamTranslation(
  payload: TranslateRequest,
  options: AIStreamRequestOptions,
): Promise<TranslateResponseData> {
  return requestAIStream<TranslateResponseData>('/ai/translate/stream', payload, options);
}
