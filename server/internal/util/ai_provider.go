// ai_provider.go - 提供 AI Provider 配置归一化与结果组装相关工具函数
package util

import (
	"fmt"
	"net/url"
	"strings"

	appconst "github.com/Qindly/markmind/internal/const"
)

// NormalizeAIProviderBaseURL - 规范化 OpenAI Compatible Provider Base URL。
// 参数 rawBaseURL: 用户输入的原始 Provider 地址。
// 返回值：补全 /v1 后的标准地址与可能出现的错误。
func NormalizeAIProviderBaseURL(rawBaseURL string) (string, error) {
	trimmedBaseURL := strings.TrimSpace(rawBaseURL)
	if trimmedBaseURL == "" {
		return "", appconst.ErrAIProviderBaseURLRequired
	}

	parsedURL, err := url.Parse(trimmedBaseURL)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		return "", appconst.ErrInvalidParams
	}

	if parsedURL.RawQuery != "" || parsedURL.Fragment != "" {
		return "", appconst.ErrInvalidParams
	}

	normalizedPath := strings.TrimRight(parsedURL.Path, "/")
	if normalizedPath == "" {
		normalizedPath = "/v1"
	} else if !strings.HasSuffix(normalizedPath, "/v1") {
		normalizedPath += "/v1"
	}
	parsedURL.Path = normalizedPath

	return parsedURL.String(), nil
}

// BuildAIChatCompletionsURL - 基于 Provider Base URL 生成 chat completions 接口地址。
// 参数 baseURL: 已规范化的 Provider Base URL。
// 返回值：chat completions 完整地址。
func BuildAIChatCompletionsURL(baseURL string) string {
	return strings.TrimRight(baseURL, "/") + "/chat/completions"
}

// MaskSecretValue - 对敏感字符串做脱敏展示。
// 参数 value: 原始敏感值。
// 返回值：脱敏后的文本。
func MaskSecretValue(value string) string {
	trimmedValue := strings.TrimSpace(value)
	if trimmedValue == "" {
		return ""
	}

	if len(trimmedValue) <= 8 {
		return strings.Repeat("*", len(trimmedValue))
	}

	return trimmedValue[:4] + strings.Repeat("*", len(trimmedValue)-8) + trimmedValue[len(trimmedValue)-4:]
}

// BuildBilingualMarkdownResult - 组装翻译结果对应的双语 Markdown 片段。
// 参数 originalText: 原始选中文段。
// 参数 translatedText: AI 返回的目标语言文本。
// 参数 detectedSourceLanguage: 检测出的原语言名称。
// 参数 targetLanguage: 目标语言名称。
// 返回值：可直接写回文档的双语 Markdown 文本。
func BuildBilingualMarkdownResult(
	originalText string,
	translatedText string,
	detectedSourceLanguage string,
	targetLanguage string,
) string {
	return fmt.Sprintf(
		"### 原文（%s）\n\n%s\n\n### 译文（%s）\n\n%s",
		detectedSourceLanguage,
		strings.TrimSpace(originalText),
		targetLanguage,
		strings.TrimSpace(translatedText),
	)
}
