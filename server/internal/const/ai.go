// ai.go - 定义 AI 设置与代理能力相关的业务错误码和错误变量
package appconst

import "errors"

const (
	// ErrCodeAIProviderBaseURLRequired - AI Provider Base URL 为空。
	ErrCodeAIProviderBaseURLRequired = 40013
	// ErrCodeAIProviderAPIKeyRequired - AI Provider API Key 为空。
	ErrCodeAIProviderAPIKeyRequired = 40014
	// ErrCodeAIProviderModelRequired - AI Provider 模型名为空。
	ErrCodeAIProviderModelRequired = 40015
	// ErrCodeAIProviderNotConfigured - 当前用户尚未完成 AI 配置。
	ErrCodeAIProviderNotConfigured = 40016
	// ErrCodeAIInstructionRequired - 魔法笔指令为空。
	ErrCodeAIInstructionRequired = 40017

	// ErrCodeAIRequestFailed - 上游 AI 服务调用失败。
	ErrCodeAIRequestFailed = 50002
	// ErrCodeAIInvalidResponse - 上游 AI 返回格式无法解析。
	ErrCodeAIInvalidResponse = 50003
)

var (
	// ErrAIProviderBaseURLRequired - AI Provider Base URL 不能为空。
	ErrAIProviderBaseURLRequired = errors.New("AI Provider Base URL 不能为空")
	// ErrAIProviderAPIKeyRequired - AI Provider API Key 不能为空。
	ErrAIProviderAPIKeyRequired = errors.New("AI Provider API Key 不能为空")
	// ErrAIProviderModelRequired - AI Provider 模型名不能为空。
	ErrAIProviderModelRequired = errors.New("AI 模型名称不能为空")
	// ErrAIProviderNotConfigured - 用户尚未完成 AI 配置。
	ErrAIProviderNotConfigured = errors.New("请先在设置页完成 AI Provider 配置")
	// ErrAIInstructionRequired - 魔法笔指令不能为空。
	ErrAIInstructionRequired = errors.New("请输入魔法笔指令")
	// ErrAIRequestFailed - 上游 AI 服务请求失败。
	ErrAIRequestFailed = errors.New("AI 服务调用失败，请稍后重试")
	// ErrAIInvalidResponse - 上游 AI 返回格式不符合预期。
	ErrAIInvalidResponse = errors.New("AI 返回结果无法解析，请稍后重试")
)
