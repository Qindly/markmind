// ai_provider_setting.go - 定义用户级 AI Provider 配置表对应的数据模型
package model

import "time"

// AIProviderSetting - 用户级 AI Provider 配置数据模型
type AIProviderSetting struct {
	UserID          int64
	BaseURL         string
	APIKeyEncrypted string
	Model           string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
