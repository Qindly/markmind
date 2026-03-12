// ai_service.go - 编排编辑器局部 AI 能力与上游 Provider 代理请求
package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/repository"
	"github.com/Qindly/markmind/internal/util"
)

const (
	defaultDetectedLanguage = "自动检测"
)

// AIServicer - 编辑器局部 AI 能力服务接口。
type AIServicer interface {
	MagicEdit(ctx context.Context, userID int64, request dto.MagicEditRequest) (*dto.MagicEditResponse, error)
	Translate(ctx context.Context, userID int64, request dto.TranslateRequest) (*dto.TranslateResponse, error)
}

type aiService struct {
	documentRepository          repository.DocumentRepository
	aiProviderSettingRepository repository.AIProviderSettingRepository
	textEncryptor               *util.TextEncryptor
	httpClient                  *http.Client
}

type aiProviderCredentials struct {
	baseURL string
	apiKey  string
	model   string
}

type aiChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type aiChatCompletionRequest struct {
	Model       string          `json:"model"`
	Messages    []aiChatMessage `json:"messages"`
	Temperature float64         `json:"temperature"`
}

type aiChatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type aiErrorResponse struct {
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

type aiTranslateStructuredResponse struct {
	DetectedSourceLanguage string `json:"detected_source_language"`
	TranslatedText         string `json:"translated_text"`
}

// NewAIService - 创建编辑器局部 AI 服务实现。
// 参数 documentRepository: 文档仓储。
// 参数 aiProviderSettingRepository: AI Provider 配置仓储。
// 参数 textEncryptor: 敏感文本加密器。
// 参数 requestTimeout: 向上游 AI Provider 发起请求的超时时间。
// 返回值：AI 服务实例。
func NewAIService(
	documentRepository repository.DocumentRepository,
	aiProviderSettingRepository repository.AIProviderSettingRepository,
	textEncryptor *util.TextEncryptor,
	requestTimeout time.Duration,
) AIServicer {
	return &aiService{
		documentRepository:          documentRepository,
		aiProviderSettingRepository: aiProviderSettingRepository,
		textEncryptor:               textEncryptor,
		httpClient: &http.Client{
			Timeout: requestTimeout,
		},
	}
}

func (service *aiService) MagicEdit(
	ctx context.Context,
	userID int64,
	request dto.MagicEditRequest,
) (*dto.MagicEditResponse, error) {
	documentTitle, err := service.validateDocumentAndGetTitle(ctx, userID, request.DocumentID)
	if err != nil {
		return nil, err
	}

	selectedText := strings.TrimSpace(request.SelectedText)
	if selectedText == "" {
		return nil, appconst.ErrInvalidParams
	}

	instruction := strings.TrimSpace(request.Instruction)
	if instruction == "" {
		return nil, appconst.ErrAIInstructionRequired
	}

	credentials, err := service.loadAIProviderCredentials(ctx, userID)
	if err != nil {
		return nil, err
	}

	result, err := service.requestAICompletion(
		ctx,
		credentials,
		buildMagicEditMessages(documentTitle, selectedText, instruction, request.ContextBefore, request.ContextAfter),
		0.35,
	)
	if err != nil {
		return nil, err
	}

	trimmedResult := strings.TrimSpace(result)
	if trimmedResult == "" {
		return nil, appconst.ErrAIInvalidResponse
	}

	return &dto.MagicEditResponse{
		Result: trimmedResult,
	}, nil
}

func (service *aiService) Translate(
	ctx context.Context,
	userID int64,
	request dto.TranslateRequest,
) (*dto.TranslateResponse, error) {
	documentTitle, err := service.validateDocumentAndGetTitle(ctx, userID, request.DocumentID)
	if err != nil {
		return nil, err
	}

	selectedText := strings.TrimSpace(request.SelectedText)
	if selectedText == "" {
		return nil, appconst.ErrInvalidParams
	}

	targetLanguage := strings.TrimSpace(request.TargetLanguage)
	if targetLanguage == "" {
		return nil, appconst.ErrInvalidParams
	}

	sourceLanguage := strings.TrimSpace(request.SourceLanguage)
	if sourceLanguage == "" {
		sourceLanguage = "auto"
	}

	credentials, err := service.loadAIProviderCredentials(ctx, userID)
	if err != nil {
		return nil, err
	}

	rawResult, err := service.requestAICompletion(
		ctx,
		credentials,
		buildTranslateMessages(documentTitle, selectedText, sourceLanguage, targetLanguage, request.ContextBefore, request.ContextAfter),
		0.1,
	)
	if err != nil {
		return nil, err
	}

	translateResult, err := decodeTranslateResult(rawResult)
	if err != nil {
		return nil, err
	}

	detectedSourceLanguage := strings.TrimSpace(translateResult.DetectedSourceLanguage)
	if detectedSourceLanguage == "" {
		detectedSourceLanguage = defaultDetectedLanguage
	}

	translatedText := strings.TrimSpace(translateResult.TranslatedText)
	if translatedText == "" {
		return nil, appconst.ErrAIInvalidResponse
	}

	return &dto.TranslateResponse{
		OriginalText:            selectedText,
		TranslatedText:          translatedText,
		DetectedSourceLanguage:  detectedSourceLanguage,
		TargetLanguage:          targetLanguage,
		BilingualMarkdownResult: util.BuildBilingualMarkdownResult(selectedText, translatedText, detectedSourceLanguage, targetLanguage),
	}, nil
}

func (service *aiService) validateDocumentAndGetTitle(ctx context.Context, userID int64, documentID int64) (string, error) {
	if userID <= 0 {
		return "", appconst.ErrUnauthorized
	}

	if documentID <= 0 {
		return "", appconst.ErrInvalidParams
	}

	document, err := service.documentRepository.FindDocumentByIDAndUserID(ctx, documentID, userID)
	if err != nil {
		return "", err
	}

	return document.Title, nil
}

func (service *aiService) loadAIProviderCredentials(ctx context.Context, userID int64) (*aiProviderCredentials, error) {
	setting, err := service.aiProviderSettingRepository.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if setting == nil {
		return nil, appconst.ErrAIProviderNotConfigured
	}

	if strings.TrimSpace(setting.BaseURL) == "" || strings.TrimSpace(setting.Model) == "" || strings.TrimSpace(setting.APIKeyEncrypted) == "" {
		return nil, appconst.ErrAIProviderNotConfigured
	}

	apiKey, err := service.textEncryptor.Decrypt(setting.APIKeyEncrypted)
	if err != nil {
		return nil, fmt.Errorf("解密 AI Provider API Key 失败: %w", err)
	}

	if strings.TrimSpace(apiKey) == "" {
		return nil, appconst.ErrAIProviderNotConfigured
	}

	return &aiProviderCredentials{
		baseURL: setting.BaseURL,
		apiKey:  apiKey,
		model:   setting.Model,
	}, nil
}

func (service *aiService) requestAICompletion(
	ctx context.Context,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
) (string, error) {
	requestBody, err := json.Marshal(aiChatCompletionRequest{
		Model:       credentials.model,
		Messages:    messages,
		Temperature: temperature,
	})
	if err != nil {
		return "", fmt.Errorf("序列化 AI 请求失败: %w", err)
	}

	httpRequest, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		util.BuildAIChatCompletionsURL(credentials.baseURL),
		bytes.NewReader(requestBody),
	)
	if err != nil {
		return "", fmt.Errorf("创建 AI 请求失败: %w", err)
	}

	httpRequest.Header.Set("Authorization", "Bearer "+credentials.apiKey)
	httpRequest.Header.Set("Content-Type", "application/json")

	httpResponse, err := service.httpClient.Do(httpRequest)
	if err != nil {
		return "", fmt.Errorf("%w: %v", appconst.ErrAIRequestFailed, err)
	}
	defer httpResponse.Body.Close()

	responseBody, err := io.ReadAll(io.LimitReader(httpResponse.Body, 2*1024*1024))
	if err != nil {
		return "", fmt.Errorf("读取 AI 响应失败: %w", err)
	}

	if httpResponse.StatusCode < http.StatusOK || httpResponse.StatusCode >= http.StatusMultipleChoices {
		return "", buildAIRequestFailedError(responseBody)
	}

	var completionResponse aiChatCompletionResponse
	if err := json.Unmarshal(responseBody, &completionResponse); err != nil {
		return "", fmt.Errorf("%w: %v", appconst.ErrAIInvalidResponse, err)
	}

	if len(completionResponse.Choices) == 0 {
		return "", appconst.ErrAIInvalidResponse
	}

	content := strings.TrimSpace(completionResponse.Choices[0].Message.Content)
	if content == "" {
		return "", appconst.ErrAIInvalidResponse
	}

	return content, nil
}

func buildAIRequestFailedError(responseBody []byte) error {
	var errorResponse aiErrorResponse
	if err := json.Unmarshal(responseBody, &errorResponse); err == nil {
		if errorResponse.Error != nil && strings.TrimSpace(errorResponse.Error.Message) != "" {
			return fmt.Errorf("%w：%s", appconst.ErrAIRequestFailed, strings.TrimSpace(errorResponse.Error.Message))
		}
	}

	trimmedBody := strings.TrimSpace(string(responseBody))
	if trimmedBody == "" {
		return appconst.ErrAIRequestFailed
	}

	return fmt.Errorf("%w：%s", appconst.ErrAIRequestFailed, trimmedBody)
}

func decodeTranslateResult(rawResult string) (*aiTranslateStructuredResponse, error) {
	normalizedResult := strings.TrimSpace(rawResult)
	normalizedResult = strings.TrimPrefix(normalizedResult, "```json")
	normalizedResult = strings.TrimPrefix(normalizedResult, "```")
	normalizedResult = strings.TrimSuffix(normalizedResult, "```")
	normalizedResult = strings.TrimSpace(normalizedResult)

	var translateResult aiTranslateStructuredResponse
	if err := json.Unmarshal([]byte(normalizedResult), &translateResult); err != nil {
		return nil, fmt.Errorf("%w: %v", appconst.ErrAIInvalidResponse, err)
	}

	return &translateResult, nil
}

func buildMagicEditMessages(
	documentTitle string,
	selectedText string,
	instruction string,
	contextBefore string,
	contextAfter string,
) []aiChatMessage {
	return []aiChatMessage{
		{
			Role: "system",
			Content: strings.TrimSpace(`
你是一个 Markdown 文档局部改写助手。
你只能改写用户选中的文段，不能输出解释、前言、总结或多余标签。
除非用户指令明确要求，否则你必须尽量保留原文中的 Markdown 语义与结构，包括标题、列表、强调、链接、引用、表格和代码块。
输出必须是可以直接写回文档的最终文本。`),
		},
		{
			Role: "user",
			Content: fmt.Sprintf(
				"文档标题：%s\n用户指令：%s\n\n[前文上下文开始]\n%s\n[前文上下文结束]\n\n[选中文段开始]\n%s\n[选中文段结束]\n\n[后文上下文开始]\n%s\n[后文上下文结束]",
				documentTitle,
				instruction,
				contextBefore,
				selectedText,
				contextAfter,
			),
		},
	}
}

func buildTranslateMessages(
	documentTitle string,
	selectedText string,
	sourceLanguage string,
	targetLanguage string,
	contextBefore string,
	contextAfter string,
) []aiChatMessage {
	return []aiChatMessage{
		{
			Role: "system",
			Content: strings.TrimSpace(`
你是一个 Markdown 文档局部翻译助手。
你只翻译用户选中的文段，不能输出解释和额外说明。
你必须尽量保留 Markdown 语义与结构，包括标题、列表、强调、链接、引用、表格和代码块。
请只返回一个 JSON 对象，不要使用 Markdown 代码块。
JSON 格式固定为：
{"detected_source_language":"语言名称","translated_text":"翻译后的文本"}`),
		},
		{
			Role: "user",
			Content: fmt.Sprintf(
				"文档标题：%s\n指定原语言：%s\n目标语言：%s\n\n[前文上下文开始]\n%s\n[前文上下文结束]\n\n[选中文段开始]\n%s\n[选中文段结束]\n\n[后文上下文开始]\n%s\n[后文上下文结束]",
				documentTitle,
				sourceLanguage,
				targetLanguage,
				contextBefore,
				selectedText,
				contextAfter,
			),
		},
	}
}
