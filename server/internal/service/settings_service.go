// settings_service.go - 编排用户级 AI 设置读取与更新业务逻辑
package service

import (
	"context"
	"fmt"
	"strings"

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
}

type settingsService struct {
	aiProviderSettingRepository repository.AIProviderSettingRepository
	textEncryptor               *util.TextEncryptor
}

// NewSettingsService - 创建设置页服务实现。
// 参数 aiProviderSettingRepository: AI Provider 配置仓储。
// 参数 textEncryptor: 敏感文本加密器。
// 返回值：设置页服务实例。
func NewSettingsService(
	aiProviderSettingRepository repository.AIProviderSettingRepository,
	textEncryptor *util.TextEncryptor,
) SettingsServicer {
	return &settingsService{
		aiProviderSettingRepository: aiProviderSettingRepository,
		textEncryptor:               textEncryptor,
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
