// settings_dto.go - 定义设置页 AI Provider 配置相关的请求响应结构体
package dto

// AISettingsSummaryResponseData - 返回给前端的 AI Provider 配置摘要。
type AISettingsSummaryResponseData struct {
	BaseURL      string `json:"base_url"`
	Model        string `json:"model"`
	HasAPIKey    bool   `json:"has_api_key"`
	MaskedAPIKey string `json:"masked_api_key"`
}

// GetAISettingsResponse - 获取 AI 设置返回数据。
type GetAISettingsResponse struct {
	Settings AISettingsSummaryResponseData `json:"settings"`
}

// UpdateAISettingsRequest - 更新 AI 设置请求体。
type UpdateAISettingsRequest struct {
	BaseURL string `json:"base_url"`
	APIKey  string `json:"api_key"`
	Model   string `json:"model"`
}

// UpdateAISettingsResponse - 更新 AI 设置返回数据。
type UpdateAISettingsResponse struct {
	Settings AISettingsSummaryResponseData `json:"settings"`
}
