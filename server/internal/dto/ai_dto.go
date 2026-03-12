// ai_dto.go - 定义编辑器局部 AI 能力相关的请求响应结构体
package dto

// MagicEditRequest - 魔法笔局部改写请求体。
type MagicEditRequest struct {
	DocumentID    int64  `json:"document_id" binding:"required"`
	SelectedText  string `json:"selected_text" binding:"required"`
	Instruction   string `json:"instruction"`
	ContextBefore string `json:"context_before"`
	ContextAfter  string `json:"context_after"`
}

// MagicEditResponse - 魔法笔局部改写返回数据。
type MagicEditResponse struct {
	Result string `json:"result"`
}

// TranslateRequest - 局部翻译请求体。
type TranslateRequest struct {
	DocumentID     int64  `json:"document_id" binding:"required"`
	SelectedText   string `json:"selected_text" binding:"required"`
	SourceLanguage string `json:"source_language"`
	TargetLanguage string `json:"target_language"`
	ContextBefore  string `json:"context_before"`
	ContextAfter   string `json:"context_after"`
}

// TranslateResponse - 局部翻译返回数据。
type TranslateResponse struct {
	OriginalText            string `json:"original_text"`
	TranslatedText          string `json:"translated_text"`
	DetectedSourceLanguage  string `json:"detected_source_language"`
	TargetLanguage          string `json:"target_language"`
	BilingualMarkdownResult string `json:"bilingual_markdown_result"`
}
