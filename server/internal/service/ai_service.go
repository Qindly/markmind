// ai_service.go - 编排编辑器局部 AI 能力与上游 Provider 代理请求
package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/repository"
	"github.com/Qindly/markmind/internal/util"
)

// AIServicer - 编辑器局部 AI 能力服务接口。
type AIServicer interface {
	MagicEdit(ctx context.Context, userID int64, request dto.MagicEditRequest) (*dto.MagicEditResponse, error)
	Translate(ctx context.Context, userID int64, request dto.TranslateRequest) (*dto.TranslateResponse, error)
	MagicEditStream(
		ctx context.Context,
		userID int64,
		request dto.MagicEditRequest,
		onDelta func(delta string) error,
	) (*dto.MagicEditResponse, error)
	TranslateStream(
		ctx context.Context,
		userID int64,
		request dto.TranslateRequest,
		onDelta func(delta string) error,
	) (*dto.TranslateResponse, error)
}

type aiService struct {
	documentRepository          repository.DocumentRepository
	aiProviderSettingRepository repository.AIProviderSettingRepository
	textEncryptor               *util.TextEncryptor
	aiProviderClient            *aiProviderClient
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
		aiProviderClient:            newAIProviderClient(requestTimeout),
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

	translatedText := strings.TrimSpace(rawResult)
	if translatedText == "" {
		return nil, appconst.ErrAIInvalidResponse
	}

	return &dto.TranslateResponse{
		TranslatedText: translatedText,
		TargetLanguage: targetLanguage,
	}, nil
}

func (service *aiService) MagicEditStream(
	ctx context.Context,
	userID int64,
	request dto.MagicEditRequest,
	onDelta func(delta string) error,
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

	result, err := service.requestAICompletionStream(
		ctx,
		credentials,
		buildMagicEditMessages(documentTitle, selectedText, instruction, request.ContextBefore, request.ContextAfter),
		0.35,
		onDelta,
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

func (service *aiService) TranslateStream(
	ctx context.Context,
	userID int64,
	request dto.TranslateRequest,
	onDelta func(delta string) error,
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

	result, err := service.requestAICompletionStream(
		ctx,
		credentials,
		buildTranslateMessages(documentTitle, selectedText, sourceLanguage, targetLanguage, request.ContextBefore, request.ContextAfter),
		0.1,
		onDelta,
	)
	if err != nil {
		return nil, err
	}

	translatedText := strings.TrimSpace(result)
	if translatedText == "" {
		return nil, appconst.ErrAIInvalidResponse
	}

	return &dto.TranslateResponse{
		TranslatedText: translatedText,
		TargetLanguage: targetLanguage,
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
	content, err := service.aiProviderClient.requestCompletion(ctx, credentials, messages, temperature, 0)
	if err != nil {
		return "", mapAIProviderCompletionError(err)
	}

	return content, nil
}

func (service *aiService) requestAICompletionStream(
	ctx context.Context,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
	onDelta func(delta string) error,
) (string, error) {
	content, err := service.aiProviderClient.requestCompletionStream(ctx, credentials, messages, temperature, 0, onDelta)
	if err != nil {
		return "", mapAIProviderCompletionError(err)
	}

	return content, nil
}

func mapAIProviderCompletionError(err error) error {
	var completionErr *aiProviderCompletionError
	if errors.As(err, &completionErr) {
		if completionErr.kind == aiProviderCompletionErrorKindInvalidPayload {
			return fmt.Errorf("%w：%s", appconst.ErrAIInvalidResponse, completionErr.message)
		}

		return fmt.Errorf("%w：%s", appconst.ErrAIRequestFailed, completionErr.message)
	}

	return err
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
输出必须是可以直接写回文档的最终译文。`),
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
