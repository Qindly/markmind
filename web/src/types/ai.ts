// ai.ts - 定义编辑器局部 AI 功能相关的前端类型
export interface MagicEditRequest {
  document_id: number;
  selected_text: string;
  instruction: string;
  context_before: string;
  context_after: string;
}

export interface MagicEditResponseData {
  result: string;
}

export interface TranslateRequest {
  document_id: number;
  selected_text: string;
  source_language: string;
  target_language: string;
  context_before: string;
  context_after: string;
}

export interface TranslateResponseData {
  original_text: string;
  translated_text: string;
  detected_source_language: string;
  target_language: string;
  bilingual_markdown_result: string;
}
