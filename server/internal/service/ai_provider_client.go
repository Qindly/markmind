// ai_provider_client.go - 封装 OpenAI Compatible Provider 请求与探活结果解析
package service

import (
	"bufio"
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

	"github.com/Qindly/markmind/internal/dto"
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

type aiProviderCompletionResult struct {
	content string
	debug   *dto.AIProviderDebugInfo
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
	Stream      bool            `json:"stream,omitempty"`
}

type aiChatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type aiChatCompletionStreamResponse struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
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
	debug             *dto.AIProviderDebugInfo
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
	result, err := client.requestCompletionDetailed(ctx, credentials, messages, temperature, maxTokens, false)
	if err != nil {
		return "", err
	}

	return result.content, nil
}

// requestCompletionDetailed - 调用 OpenAI Compatible chat completions 接口，并在需要时返回调试信息。
// 参数 includeDebug: 为 true 时返回脱敏后的请求与响应快照，便于设置页探活排查。
func (client *aiProviderClient) requestCompletionDetailed(
	ctx context.Context,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
	maxTokens int,
	includeDebug bool,
) (*aiProviderCompletionResult, error) {
	requestBody, err := json.Marshal(aiChatCompletionRequest{
		Model:       credentials.model,
		Messages:    messages,
		Temperature: temperature,
		MaxTokens:   maxTokens,
	})
	if err != nil {
		return nil, fmt.Errorf("序列化 AI 请求失败: %w", err)
	}

	httpRequest, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		util.BuildAIChatCompletionsURL(credentials.baseURL),
		bytes.NewReader(requestBody),
	)
	if err != nil {
		return nil, fmt.Errorf("创建 AI 请求失败: %w", err)
	}

	httpRequest.Header.Set("Authorization", "Bearer "+credentials.apiKey)
	httpRequest.Header.Set("Content-Type", "application/json")

	debugInfo := buildAIProviderDebugRequest(httpRequest, requestBody, includeDebug)
	httpResponse, err := client.httpClient.Do(httpRequest)
	if err != nil {
		return nil, buildAIProviderNetworkError(err, debugInfo)
	}
	defer httpResponse.Body.Close()

	responseBody, err := io.ReadAll(io.LimitReader(httpResponse.Body, aiResponseBodyLimit))
	if err != nil {
		return nil, fmt.Errorf("读取 AI 响应失败: %w", err)
	}

	fillAIProviderDebugResponse(debugInfo, httpResponse, responseBody)
	if httpResponse.StatusCode < http.StatusOK || httpResponse.StatusCode >= http.StatusMultipleChoices {
		return nil, buildAIProviderHTTPError(httpResponse.StatusCode, responseBody, debugInfo)
	}

	var completionResponse aiChatCompletionResponse
	if err := json.Unmarshal(responseBody, &completionResponse); err != nil {
		return nil, &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindInvalidPayload,
			providerReachable: true,
			modelAvailable:    false,
			message:           "Provider 已响应，但返回格式不兼容 OpenAI Chat Completions",
			debug:             debugInfo,
		}
	}

	if len(completionResponse.Choices) == 0 {
		return nil, &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindInvalidPayload,
			providerReachable: true,
			modelAvailable:    false,
			message:           "Provider 已响应，但返回结果中缺少可用内容",
			debug:             debugInfo,
		}
	}

	content := strings.TrimSpace(completionResponse.Choices[0].Message.Content)
	if content == "" {
		return nil, &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindInvalidPayload,
			providerReachable: true,
			modelAvailable:    false,
			message:           "Provider 已响应，但返回内容为空",
			debug:             debugInfo,
		}
	}

	return &aiProviderCompletionResult{
		content: content,
		debug:   debugInfo,
	}, nil
}

// requestCompletionStream - 调用 OpenAI Compatible chat completions 流式接口并持续返回增量文本。
// 参数 onDelta: 每次收到新的文本增量时触发的回调。
// 返回值：完整拼接后的文本内容，或带有可读原因的错误。
func (client *aiProviderClient) requestCompletionStream(
	ctx context.Context,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
	maxTokens int,
	onDelta func(delta string) error,
) (string, error) {
	requestBody, err := json.Marshal(aiChatCompletionRequest{
		Model:       credentials.model,
		Messages:    messages,
		Temperature: temperature,
		MaxTokens:   maxTokens,
		Stream:      true,
	})
	if err != nil {
		return "", fmt.Errorf("序列化 AI 流式请求失败: %w", err)
	}

	httpRequest, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		util.BuildAIChatCompletionsURL(credentials.baseURL),
		bytes.NewReader(requestBody),
	)
	if err != nil {
		return "", fmt.Errorf("创建 AI 流式请求失败: %w", err)
	}

	httpRequest.Header.Set("Authorization", "Bearer "+credentials.apiKey)
	httpRequest.Header.Set("Content-Type", "application/json")
	httpRequest.Header.Set("Accept", "text/event-stream")

	httpResponse, err := client.httpClient.Do(httpRequest)
	if err != nil {
		return "", buildAIProviderNetworkError(err, nil)
	}
	defer httpResponse.Body.Close()

	if httpResponse.StatusCode < http.StatusOK || httpResponse.StatusCode >= http.StatusMultipleChoices {
		responseBody, readErr := io.ReadAll(io.LimitReader(httpResponse.Body, aiResponseBodyLimit))
		if readErr != nil {
			return "", fmt.Errorf("读取 AI 流式错误响应失败: %w", readErr)
		}

		return "", buildAIProviderHTTPError(httpResponse.StatusCode, responseBody, nil)
	}

	var contentBuilder strings.Builder
	if err := consumeAIProviderStream(httpResponse.Body, func(payload string) error {
		delta, extractErr := extractAIStreamDelta(payload)
		if extractErr != nil {
			return &aiProviderCompletionError{
				kind:              aiProviderCompletionErrorKindInvalidPayload,
				providerReachable: true,
				modelAvailable:    false,
				message:           "Provider 已响应，但流式返回格式不兼容 OpenAI Chat Completions",
			}
		}

		if delta == "" {
			return nil
		}

		contentBuilder.WriteString(delta)
		if onDelta != nil {
			return onDelta(delta)
		}

		return nil
	}); err != nil {
		return "", err
	}

	return contentBuilder.String(), nil
}

func buildAIProviderNetworkError(err error, debugInfo *dto.AIProviderDebugInfo) error {
	message := "无法连接到 Provider，请检查 Base URL、网络或代理设置"

	if errors.Is(err, context.DeadlineExceeded) {
		message = "连接 Provider 超时，请检查网络状况或稍后重试"
	}

	var urlError *url.Error
	if errors.As(err, &urlError) && errors.Is(urlError.Err, context.DeadlineExceeded) {
		message = "连接 Provider 超时，请检查网络状况或稍后重试"
	}

	if debugInfo != nil {
		debugInfo.NetworkError = err.Error()
	}

	return &aiProviderCompletionError{
		kind:              aiProviderCompletionErrorKindRequestFailed,
		providerReachable: false,
		modelAvailable:    false,
		message:           message,
		debug:             debugInfo,
	}
}

func buildAIProviderHTTPError(statusCode int, responseBody []byte, debugInfo *dto.AIProviderDebugInfo) error {
	upstreamMessage := extractAIProviderErrorMessage(responseBody)
	switch {
	case isModelAvailabilityError(statusCode, upstreamMessage):
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但当前模型不可用：%s", upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode == http.StatusUnauthorized:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但 API Key 无效或已失效：%s", upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode == http.StatusForbidden:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但当前凭证没有调用权限：%s", upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode == http.StatusNotFound:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已响应，但 Chat Completions 接口不存在或地址不兼容：%s", upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode == http.StatusTooManyRequests:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但请求被限流：%s", upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode >= http.StatusInternalServerError:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但上游服务暂时不可用：%s", upstreamMessage),
			debug:             debugInfo,
		}
	default:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 请求失败：%s", upstreamMessage),
			debug:             debugInfo,
		}
	}
}

func buildAIProviderDebugRequest(
	httpRequest *http.Request,
	requestBody []byte,
	includeDebug bool,
) *dto.AIProviderDebugInfo {
	if !includeDebug {
		return nil
	}

	return &dto.AIProviderDebugInfo{
		RequestURL:     httpRequest.URL.String(),
		RequestMethod:  httpRequest.Method,
		RequestHeaders: flattenHTTPHeaders(httpRequest.Header, true),
		RequestBody:    formatJSONPayload(requestBody),
	}
}

func fillAIProviderDebugResponse(
	debugInfo *dto.AIProviderDebugInfo,
	httpResponse *http.Response,
	responseBody []byte,
) {
	if debugInfo == nil {
		return
	}

	debugInfo.ResponseStatusCode = httpResponse.StatusCode
	debugInfo.ResponseHeaders = flattenHTTPHeaders(httpResponse.Header, false)
	debugInfo.ResponseBody = formatJSONPayload(responseBody)
}

func flattenHTTPHeaders(headers http.Header, maskAuthorization bool) map[string]string {
	if len(headers) == 0 {
		return nil
	}

	result := make(map[string]string, len(headers))
	for key, values := range headers {
		value := strings.Join(values, ", ")
		if maskAuthorization && strings.EqualFold(key, "Authorization") {
			value = maskAuthorizationHeader(value)
		}

		result[key] = value
	}

	return result
}

func maskAuthorizationHeader(value string) string {
	const bearerPrefix = "Bearer "
	trimmedValue := strings.TrimSpace(value)
	if strings.HasPrefix(trimmedValue, bearerPrefix) {
		return bearerPrefix + util.MaskSecretValue(strings.TrimPrefix(trimmedValue, bearerPrefix))
	}

	return util.MaskSecretValue(trimmedValue)
}

func formatJSONPayload(payload []byte) string {
	trimmedPayload := bytes.TrimSpace(payload)
	if len(trimmedPayload) == 0 {
		return ""
	}

	var formatted bytes.Buffer
	if err := json.Indent(&formatted, trimmedPayload, "", "  "); err == nil {
		return formatted.String()
	}

	return string(trimmedPayload)
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

func consumeAIProviderStream(reader io.Reader, handlePayload func(payload string) error) error {
	streamReader := bufio.NewReader(reader)
	dataLines := make([]string, 0, 4)

	flushEvent := func() error {
		if len(dataLines) == 0 {
			return nil
		}

		payload := strings.Join(dataLines, "\n")
		dataLines = dataLines[:0]
		if payload == "[DONE]" {
			return nil
		}

		return handlePayload(payload)
	}

	for {
		line, err := streamReader.ReadString('\n')
		if err != nil && !errors.Is(err, io.EOF) {
			return fmt.Errorf("读取 AI 流式响应失败: %w", err)
		}

		trimmedLine := strings.TrimRight(line, "\r\n")
		switch {
		case trimmedLine == "":
			if flushErr := flushEvent(); flushErr != nil {
				return flushErr
			}
		case strings.HasPrefix(trimmedLine, "data:"):
			dataLines = append(dataLines, strings.TrimSpace(strings.TrimPrefix(trimmedLine, "data:")))
		}

		if errors.Is(err, io.EOF) {
			break
		}
	}

	if err := flushEvent(); err != nil {
		return err
	}

	return nil
}

func extractAIStreamDelta(payload string) (string, error) {
	trimmedPayload := strings.TrimSpace(payload)
	if trimmedPayload == "" {
		return "", nil
	}

	var completionResponse aiChatCompletionStreamResponse
	if err := json.Unmarshal([]byte(trimmedPayload), &completionResponse); err != nil {
		return "", err
	}

	var deltaBuilder strings.Builder
	for _, choice := range completionResponse.Choices {
		deltaBuilder.WriteString(choice.Delta.Content)
	}

	return deltaBuilder.String(), nil
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
