// settings.ts - 定义设置页 AI Provider 配置相关的前端类型
export interface AISettingsSummary {
  base_url: string;
  model: string;
  has_api_key: boolean;
  masked_api_key: string;
}

export interface GetAISettingsResponseData {
  settings: AISettingsSummary;
}

export interface UpdateAISettingsRequest {
  base_url: string;
  api_key: string;
  model: string;
}

export interface UpdateAISettingsResponseData {
  settings: AISettingsSummary;
}
