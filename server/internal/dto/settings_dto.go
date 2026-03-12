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

// TestAISettingsRequest - 测试设置页 AI Provider 连通性与模型可用性的请求体。
type TestAISettingsRequest struct {
	BaseURL string `json:"base_url"`
	APIKey  string `json:"api_key"`
	Model   string `json:"model"`
}

// ListAIModelsRequest - 拉取设置页 AI Provider 模型列表的请求体。
type ListAIModelsRequest struct {
	BaseURL string `json:"base_url"`
	APIKey  string `json:"api_key"`
	Model   string `json:"model"`
}

// AISettingsTestResult - 设置页 AI Provider 测试结果。
type AISettingsTestResult struct {
	BaseURL           string               `json:"base_url"`
	Model             string               `json:"model"`
	ProviderReachable bool                 `json:"provider_reachable"`
	ModelAvailable    bool                 `json:"model_available"`
	UsingSavedAPIKey  bool                 `json:"using_saved_api_key"`
	APIStyle          string               `json:"api_style,omitempty"`
	Message           string               `json:"message"`
	Debug             *AIProviderDebugInfo `json:"debug,omitempty"`
}

// TestAISettingsResponse - 测试 AI 设置返回数据。
type TestAISettingsResponse struct {
	Result AISettingsTestResult `json:"result"`
}

// AISettingsModelListResult - 设置页模型列表拉取结果。
type AISettingsModelListResult struct {
	BaseURL           string   `json:"base_url"`
	ProviderReachable bool     `json:"provider_reachable"`
	UsingSavedAPIKey  bool     `json:"using_saved_api_key"`
	APIStyle          string   `json:"api_style,omitempty"`
	Models            []string `json:"models"`
	Message           string   `json:"message"`
}

// ListAIModelsResponse - 拉取 AI 模型列表返回数据。
type ListAIModelsResponse struct {
	Result AISettingsModelListResult `json:"result"`
}

// AIProviderDebugInfo - 返回给前端的 Provider 调试信息。
type AIProviderDebugInfo struct {
	RequestURL         string            `json:"request_url"`
	RequestMethod      string            `json:"request_method"`
	RequestHeaders     map[string]string `json:"request_headers"`
	RequestBody        string            `json:"request_body"`
	ResponseStatusCode int               `json:"response_status_code,omitempty"`
	ResponseHeaders    map[string]string `json:"response_headers,omitempty"`
	ResponseBody       string            `json:"response_body,omitempty"`
	NetworkError       string            `json:"network_error,omitempty"`
}
