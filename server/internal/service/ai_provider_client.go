// ai_provider_client.go - 封装 OpenAI Compatible Provider 请求与探活结果解析
package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/Qindly/markmind/internal/util"
)

const (
	aiResponseBodyLimit = 2 * 1024 * 1024
	aiProbeMaxTokens    = 8
)

type aiProviderCompletionErrorKind string

const (
	aiProviderCompletionErrorKindRequestFailed  aiProviderCompletionErrorKind = "request_failed"
	aiProviderCompletionErrorKindInvalidPayload aiProviderCompletionErrorKind = "invalid_payload"
)

type aiProviderClient struct {
	httpClient *http.Client
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
	MaxTokens   int             `json:"max_tokens,omitempty"`
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

type aiProviderCompletionError struct {
	kind              aiProviderCompletionErrorKind
	providerReachable bool
	modelAvailable    bool
	message           string
}

func (err *aiProviderCompletionError) Error() string {
	return err.message
}

// newAIProviderClient - 创建 OpenAI Compatible Provider 请求客户端。
// 参数 requestTimeout: 请求上游模型接口的超时时间。
// 返回值：可复用的 Provider 请求客户端。
func newAIProviderClient(requestTimeout time.Duration) *aiProviderClient {
	return &aiProviderClient{
		httpClient: &http.Client{
			Timeout: requestTimeout,
		},
	}
}

// requestCompletion - 调用 OpenAI Compatible chat completions 接口并返回首条文本结果。
// 参数 ctx: 请求上下文。
// 参数 credentials: 已验证完成的 Provider 凭证。
// 参数 messages: 发送给上游模型的消息数组。
// 参数 temperature: 本次请求的采样温度。
// 参数 maxTokens: 本次请求允许的最大输出 token 数，传 0 表示不显式限制。
// 返回值：上游模型返回的首条文本内容，或带有可读原因的错误。
func (client *aiProviderClient) requestCompletion(
	ctx context.Context,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
	maxTokens int,
) (string, error) {
	requestBody, err := json.Marshal(aiChatCompletionRequest{
		Model:       credentials.model,
		Messages:    messages,
		Temperature: temperature,
		MaxTokens:   maxTokens,
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

	httpResponse, err := client.httpClient.Do(httpRequest)
	if err != nil {
		return "", buildAIProviderNetworkError(err)
	}
	defer httpResponse.Body.Close()

	responseBody, err := io.ReadAll(io.LimitReader(httpResponse.Body, aiResponseBodyLimit))
	if err != nil {
		return "", fmt.Errorf("读取 AI 响应失败: %w", err)
	}

	if httpResponse.StatusCode < http.StatusOK || httpResponse.StatusCode >= http.StatusMultipleChoices {
		return "", buildAIProviderHTTPError(httpResponse.StatusCode, responseBody)
	}

	var completionResponse aiChatCompletionResponse
	if err := json.Unmarshal(responseBody, &completionResponse); err != nil {
		return "", &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindInvalidPayload,
			providerReachable: true,
			modelAvailable:    false,
			message:           "Provider 已响应，但返回格式不兼容 OpenAI Chat Completions",
		}
	}

	if len(completionResponse.Choices) == 0 {
		return "", &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindInvalidPayload,
			providerReachable: true,
			modelAvailable:    false,
			message:           "Provider 已响应，但返回结果中缺少可用内容",
		}
	}

	content := strings.TrimSpace(completionResponse.Choices[0].Message.Content)
	if content == "" {
		return "", &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindInvalidPayload,
			providerReachable: true,
			modelAvailable:    false,
			message:           "Provider 已响应，但返回内容为空",
		}
	}

	return content, nil
}

func buildAIProviderNetworkError(err error) error {
	message := "无法连接到 Provider，请检查 Base URL、网络或代理设置"

	if errors.Is(err, context.DeadlineExceeded) {
		message = "连接 Provider 超时，请检查网络状况或稍后重试"
	}

	var urlError *url.Error
	if errors.As(err, &urlError) && errors.Is(urlError.Err, context.DeadlineExceeded) {
		message = "连接 Provider 超时，请检查网络状况或稍后重试"
	}

	return &aiProviderCompletionError{
		kind:              aiProviderCompletionErrorKindRequestFailed,
		providerReachable: false,
		modelAvailable:    false,
		message:           message,
	}
}

func buildAIProviderHTTPError(statusCode int, responseBody []byte) error {
	upstreamMessage := extractAIProviderErrorMessage(responseBody)
	switch {
	case isModelAvailabilityError(statusCode, upstreamMessage):
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但当前模型不可用：%s", upstreamMessage),
		}
	case statusCode == http.StatusUnauthorized:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但 API Key 无效或已失效：%s", upstreamMessage),
		}
	case statusCode == http.StatusForbidden:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但当前凭证没有调用权限：%s", upstreamMessage),
		}
	case statusCode == http.StatusNotFound:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已响应，但 Chat Completions 接口不存在或地址不兼容：%s", upstreamMessage),
		}
	case statusCode == http.StatusTooManyRequests:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但请求被限流：%s", upstreamMessage),
		}
	case statusCode >= http.StatusInternalServerError:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但上游服务暂时不可用：%s", upstreamMessage),
		}
	default:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 测试失败：%s", upstreamMessage),
		}
	}
}

func extractAIProviderErrorMessage(responseBody []byte) string {
	var errorResponse aiErrorResponse
	if err := json.Unmarshal(responseBody, &errorResponse); err == nil {
		if errorResponse.Error != nil && strings.TrimSpace(errorResponse.Error.Message) != "" {
			return strings.TrimSpace(errorResponse.Error.Message)
		}
	}

	trimmedBody := strings.TrimSpace(string(responseBody))
	if trimmedBody != "" {
		return trimmedBody
	}

	return "未返回详细错误信息"
}

func isModelAvailabilityError(statusCode int, message string) bool {
	lowerMessage := strings.ToLower(strings.TrimSpace(message))
	if lowerMessage == "" {
		return false
	}

	containsModelKeyword := strings.Contains(lowerMessage, "model") || strings.Contains(message, "模型")
	if !containsModelKeyword {
		return false
	}

	keywords := []string{
		"not found",
		"does not exist",
		"doesn't exist",
		"unknown",
		"unavailable",
		"not available",
		"invalid",
		"access",
		"permission",
		"unsupported",
		"not supported",
		"不存在",
		"不可用",
		"无权",
		"权限",
		"不支持",
		"未开通",
	}
	for _, keyword := range keywords {
		if strings.Contains(lowerMessage, keyword) || strings.Contains(message, keyword) {
			return true
		}
	}

	return statusCode == http.StatusBadRequest || statusCode == http.StatusForbidden
}
