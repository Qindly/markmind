// settings_service.go - 编排用户级 AI 设置读取与更新业务逻辑
package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/model"
	"github.com/Qindly/markmind/internal/repository"
	"github.com/Qindly/markmind/internal/util"
)

// SettingsServicer - 设置页服务接口。
type SettingsServicer interface {
	GetAISettings(ctx context.Context, userID int64) (*dto.GetAISettingsResponse, error)
	UpdateAISettings(ctx context.Context, userID int64, request dto.UpdateAISettingsRequest) (*dto.UpdateAISettingsResponse, error)
	TestAISettings(ctx context.Context, userID int64, request dto.TestAISettingsRequest) (*dto.TestAISettingsResponse, error)
}

type settingsService struct {
	aiProviderSettingRepository repository.AIProviderSettingRepository
	textEncryptor               *util.TextEncryptor
	aiProviderClient            *aiProviderClient
	aiProviderDebug             bool
}

// NewSettingsService - 创建设置页服务实现。
// 参数 aiProviderSettingRepository: AI Provider 配置仓储。
// 参数 textEncryptor: 敏感文本加密器。
// 参数 requestTimeout: 向上游 Provider 发起探活请求的超时时间。
// 参数 aiProviderDebug: 是否为设置页探活返回调试快照。
// 返回值：设置页服务实例。
func NewSettingsService(
	aiProviderSettingRepository repository.AIProviderSettingRepository,
	textEncryptor *util.TextEncryptor,
	requestTimeout time.Duration,
	aiProviderDebug bool,
) SettingsServicer {
	return &settingsService{
		aiProviderSettingRepository: aiProviderSettingRepository,
		textEncryptor:               textEncryptor,
		aiProviderClient:            newAIProviderClient(requestTimeout),
		aiProviderDebug:             aiProviderDebug,
	}
}

func (service *settingsService) GetAISettings(ctx context.Context, userID int64) (*dto.GetAISettingsResponse, error) {
	if userID <= 0 {
		return nil, appconst.ErrUnauthorized
	}

	setting, err := service.aiProviderSettingRepository.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if setting == nil {
		return &dto.GetAISettingsResponse{
			Settings: dto.AISettingsSummaryResponseData{},
		}, nil
	}

	apiKey, err := service.textEncryptor.Decrypt(setting.APIKeyEncrypted)
	if err != nil {
		return nil, fmt.Errorf("解密 AI Provider API Key 失败: %w", err)
	}

	return &dto.GetAISettingsResponse{
		Settings: dto.AISettingsSummaryResponseData{
			BaseURL:      setting.BaseURL,
			Model:        setting.Model,
			HasAPIKey:    strings.TrimSpace(apiKey) != "",
			MaskedAPIKey: util.MaskSecretValue(apiKey),
		},
	}, nil
}

func (service *settingsService) UpdateAISettings(
	ctx context.Context,
	userID int64,
	request dto.UpdateAISettingsRequest,
) (*dto.UpdateAISettingsResponse, error) {
	if userID <= 0 {
		return nil, appconst.ErrUnauthorized
	}

	normalizedBaseURL, err := util.NormalizeAIProviderBaseURL(request.BaseURL)
	if err != nil {
		return nil, err
	}

	modelName := strings.TrimSpace(request.Model)
	if modelName == "" {
		return nil, appconst.ErrAIProviderModelRequired
	}

	existingSetting, err := service.aiProviderSettingRepository.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	apiKey := strings.TrimSpace(request.APIKey)
	apiKeyEncrypted := ""
	switch {
	case apiKey != "":
		apiKeyEncrypted, err = service.textEncryptor.Encrypt(apiKey)
		if err != nil {
			return nil, fmt.Errorf("加密 AI Provider API Key 失败: %w", err)
		}
	case existingSetting != nil && strings.TrimSpace(existingSetting.APIKeyEncrypted) != "":
		apiKeyEncrypted = existingSetting.APIKeyEncrypted
	default:
		return nil, appconst.ErrAIProviderAPIKeyRequired
	}

	savedSetting, err := service.aiProviderSettingRepository.Upsert(ctx, model.AIProviderSetting{
		UserID:          userID,
		BaseURL:         normalizedBaseURL,
		APIKeyEncrypted: apiKeyEncrypted,
		Model:           modelName,
	})
	if err != nil {
		return nil, err
	}

	if apiKey == "" {
		apiKey, err = service.textEncryptor.Decrypt(savedSetting.APIKeyEncrypted)
		if err != nil {
			return nil, fmt.Errorf("解密已保存的 AI Provider API Key 失败: %w", err)
		}
	}

	return &dto.UpdateAISettingsResponse{
		Settings: dto.AISettingsSummaryResponseData{
			BaseURL:      savedSetting.BaseURL,
			Model:        savedSetting.Model,
			HasAPIKey:    true,
			MaskedAPIKey: util.MaskSecretValue(apiKey),
		},
	}, nil
}

func (service *settingsService) TestAISettings(
	ctx context.Context,
	userID int64,
	request dto.TestAISettingsRequest,
) (*dto.TestAISettingsResponse, error) {
	if userID <= 0 {
		return nil, appconst.ErrUnauthorized
	}

	normalizedBaseURL, err := util.NormalizeAIProviderBaseURL(request.BaseURL)
	if err != nil {
		return nil, err
	}

	modelName := strings.TrimSpace(request.Model)
	if modelName == "" {
		return nil, appconst.ErrAIProviderModelRequired
	}

	apiKey, usingSavedAPIKey, err := service.resolveAISettingsTestAPIKey(ctx, userID, request.APIKey)
	if err != nil {
		return nil, err
	}

	testResult := dto.AISettingsTestResult{
		BaseURL:           normalizedBaseURL,
		Model:             modelName,
		ProviderReachable: true,
		ModelAvailable:    true,
		UsingSavedAPIKey:  usingSavedAPIKey,
		Message:           "Provider 已连通，当前模型可用",
	}

	completionResult, err := service.aiProviderClient.requestCompletionDetailed(
		ctx,
		&aiProviderCredentials{
			baseURL: normalizedBaseURL,
			apiKey:  apiKey,
			model:   modelName,
		},
		buildAISettingsTestMessages(),
		0,
		aiProbeMaxTokens,
		service.aiProviderDebug,
	)
	if err != nil {
		var completionErr *aiProviderCompletionError
		if errors.As(err, &completionErr) {
			testResult.ProviderReachable = completionErr.providerReachable
			testResult.ModelAvailable = completionErr.modelAvailable
			testResult.Message = completionErr.message
			testResult.Debug = completionErr.debug

			return &dto.TestAISettingsResponse{
				Result: testResult,
			}, nil
		}

		return nil, err
	}

	return &dto.TestAISettingsResponse{
		Result: dto.AISettingsTestResult{
			BaseURL:           testResult.BaseURL,
			Model:             testResult.Model,
			ProviderReachable: testResult.ProviderReachable,
			ModelAvailable:    testResult.ModelAvailable,
			UsingSavedAPIKey:  testResult.UsingSavedAPIKey,
			Message:           testResult.Message,
			Debug:             completionResult.debug,
		},
	}, nil
}

func (service *settingsService) resolveAISettingsTestAPIKey(
	ctx context.Context,
	userID int64,
	rawAPIKey string,
) (string, bool, error) {
	apiKey := strings.TrimSpace(rawAPIKey)
	if apiKey != "" {
		return apiKey, false, nil
	}

	existingSetting, err := service.aiProviderSettingRepository.FindByUserID(ctx, userID)
	if err != nil {
		return "", false, err
	}

	if existingSetting == nil || strings.TrimSpace(existingSetting.APIKeyEncrypted) == "" {
		return "", false, appconst.ErrAIProviderAPIKeyRequired
	}

	apiKey, err = service.textEncryptor.Decrypt(existingSetting.APIKeyEncrypted)
	if err != nil {
		return "", false, fmt.Errorf("解密 AI Provider API Key 失败: %w", err)
	}

	if strings.TrimSpace(apiKey) == "" {
		return "", false, appconst.ErrAIProviderAPIKeyRequired
	}

	return apiKey, true, nil
}

func buildAISettingsTestMessages() []aiChatMessage {
	return []aiChatMessage{
		{
			Role: "system",
			Content: strings.TrimSpace(`
你是一个 OpenAI Compatible Provider 连通性测试助手。
你只能返回大写字符串 OK，不要输出解释、标点或其它内容。`),
		},
		{
			Role:    "user",
			Content: "Return OK only.",
		},
	}
}
