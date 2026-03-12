// ai_provider_client.go - 封装 OpenAI Compatible Provider 请求、协议探测与模型列表拉取
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
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/util"
)

const (
	aiResponseBodyLimit          = 2 * 1024 * 1024
	aiProbeMaxTokens             = 8
	aiProviderCapabilityCacheTTL = 10 * time.Minute
)

type aiProviderAPIStyle string

const (
	aiProviderAPIStyleChatCompletions aiProviderAPIStyle = "chat_completions"
	aiProviderAPIStyleResponses       aiProviderAPIStyle = "responses"
)

type aiProviderCompletionErrorKind string

const (
	aiProviderCompletionErrorKindRequestFailed  aiProviderCompletionErrorKind = "request_failed"
	aiProviderCompletionErrorKindInvalidPayload aiProviderCompletionErrorKind = "invalid_payload"
)

type aiProviderClient struct {
	httpClient      *http.Client
	capabilityCache *aiProviderCapabilityCache
}

type aiProviderCompletionResult struct {
	content  string
	debug    *dto.AIProviderDebugInfo
	apiStyle aiProviderAPIStyle
}

type aiProviderModelListResult struct {
	models   []string
	apiStyle aiProviderAPIStyle
}

type aiProviderCredentials struct {
	baseURL string
	apiKey  string
	model   string
}

type aiProviderCapability struct {
	apiStyle       aiProviderAPIStyle
	supportsStream bool
}

type aiProviderCapabilityCacheItem struct {
	capability aiProviderCapability
	expireAt   time.Time
}

type aiProviderCapabilityCache struct {
	mutex sync.Mutex
	items map[string]aiProviderCapabilityCacheItem
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

type aiResponsesRequest struct {
	Model           string                    `json:"model"`
	Input           []aiResponsesInputMessage `json:"input,omitempty"`
	Instructions    string                    `json:"instructions,omitempty"`
	Temperature     float64                   `json:"temperature"`
	MaxOutputTokens int                       `json:"max_output_tokens,omitempty"`
	Stream          bool                      `json:"stream,omitempty"`
}

type aiResponsesInputMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type aiResponsesResponse struct {
	OutputText string `json:"output_text"`
	Output     []struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
	} `json:"output"`
}

type aiResponsesStreamEvent struct {
	Type  string `json:"type"`
	Delta string `json:"delta"`
	Text  string `json:"text"`
}

type aiModelsResponse struct {
	Data []struct {
		ID string `json:"id"`
	} `json:"data"`
}

type aiErrorResponse struct {
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

type aiProviderCompletionError struct {
	kind              aiProviderCompletionErrorKind
	apiStyle          aiProviderAPIStyle
	statusCode        int
	providerReachable bool
	modelAvailable    bool
	message           string
	debug             *dto.AIProviderDebugInfo
}

type aiProviderSSEEvent struct {
	event string
	data  string
}

var sharedAIProviderCapabilityCache = &aiProviderCapabilityCache{
	items: make(map[string]aiProviderCapabilityCacheItem),
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
		capabilityCache: sharedAIProviderCapabilityCache,
	}
}

// requestCompletion - 调用 OpenAI Compatible 文本生成接口并返回首条文本结果。
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

// requestCompletionDetailed - 调用 OpenAI Compatible 文本生成接口，并在需要时返回调试信息。
// 参数 includeDebug: 为 true 时返回脱敏后的请求与响应快照，便于设置页探活排查。
func (client *aiProviderClient) requestCompletionDetailed(
	ctx context.Context,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
	maxTokens int,
	includeDebug bool,
) (*aiProviderCompletionResult, error) {
	return client.requestCompletionWithAutoDetect(
		ctx,
		credentials,
		messages,
		temperature,
		maxTokens,
		false,
		nil,
		includeDebug,
	)
}

// requestCompletionStream - 调用 OpenAI Compatible 流式文本生成接口并持续返回增量文本。
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
	result, err := client.requestCompletionWithAutoDetect(
		ctx,
		credentials,
		messages,
		temperature,
		maxTokens,
		true,
		onDelta,
		false,
	)
	if err != nil {
		return "", err
	}

	return result.content, nil
}

// listModels - 调用 OpenAI Compatible models 接口拉取当前 Provider 的模型列表。
// 参数 modelName: 当前表单中的模型名，用于复用能力缓存中的协议类型。
func (client *aiProviderClient) listModels(
	ctx context.Context,
	baseURL string,
	apiKey string,
	modelName string,
) (*aiProviderModelListResult, error) {
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodGet, util.BuildAIModelsURL(baseURL), nil)
	if err != nil {
		return nil, fmt.Errorf("创建模型列表请求失败: %w", err)
	}

	httpRequest.Header.Set("Authorization", "Bearer "+apiKey)
	httpRequest.Header.Set("Accept", "application/json")

	httpResponse, err := client.httpClient.Do(httpRequest)
	if err != nil {
		return nil, buildAIProviderNetworkError(err, nil)
	}
	defer httpResponse.Body.Close()

	responseBody, err := io.ReadAll(io.LimitReader(httpResponse.Body, aiResponseBodyLimit))
	if err != nil {
		return nil, fmt.Errorf("读取模型列表响应失败: %w", err)
	}

	if httpResponse.StatusCode < http.StatusOK || httpResponse.StatusCode >= http.StatusMultipleChoices {
		return nil, buildAIProviderModelsHTTPError(httpResponse.StatusCode, responseBody)
	}

	var modelsResponse aiModelsResponse
	if err := json.Unmarshal(responseBody, &modelsResponse); err != nil {
		return nil, &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindInvalidPayload,
			providerReachable: true,
			modelAvailable:    false,
			message:           "Provider 已响应，但 Models 接口返回格式不兼容 OpenAI Compatible",
		}
	}

	deduplicatedModels := make(map[string]struct{}, len(modelsResponse.Data))
	models := make([]string, 0, len(modelsResponse.Data))
	for _, model := range modelsResponse.Data {
		modelID := strings.TrimSpace(model.ID)
		if modelID == "" {
			continue
		}

		if _, exists := deduplicatedModels[modelID]; exists {
			continue
		}

		deduplicatedModels[modelID] = struct{}{}
		models = append(models, modelID)
	}

	sort.Strings(models)

	var apiStyle aiProviderAPIStyle
	if capability, exists := client.capabilityCache.get(baseURL, modelName); exists {
		apiStyle = capability.apiStyle
	}

	return &aiProviderModelListResult{
		models:   models,
		apiStyle: apiStyle,
	}, nil
}

func (client *aiProviderClient) requestCompletionWithAutoDetect(
	ctx context.Context,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
	maxTokens int,
	stream bool,
	onDelta func(delta string) error,
	includeDebug bool,
) (*aiProviderCompletionResult, error) {
	orderedStyles := client.resolveAPIStyles(credentials.baseURL, credentials.model)
	var lastErr error

	for _, apiStyle := range orderedStyles {
		emittedDelta := false
		wrappedOnDelta := onDelta
		if stream && onDelta != nil {
			wrappedOnDelta = func(delta string) error {
				if strings.TrimSpace(delta) != "" {
					emittedDelta = true
				}

				return onDelta(delta)
			}
		}

		result, err := client.requestCompletionByStyle(
			ctx,
			apiStyle,
			credentials,
			messages,
			temperature,
			maxTokens,
			stream,
			wrappedOnDelta,
			includeDebug,
		)
		if err == nil {
			client.capabilityCache.set(credentials.baseURL, credentials.model, aiProviderCapability{
				apiStyle:       apiStyle,
				supportsStream: stream,
			})
			return result, nil
		}

		lastErr = err
		if emittedDelta || !canFallbackToAlternativeAPIStyle(err) {
			return nil, err
		}
	}

	return nil, lastErr
}

func (client *aiProviderClient) requestCompletionByStyle(
	ctx context.Context,
	apiStyle aiProviderAPIStyle,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
	maxTokens int,
	stream bool,
	onDelta func(delta string) error,
	includeDebug bool,
) (*aiProviderCompletionResult, error) {
	switch apiStyle {
	case aiProviderAPIStyleChatCompletions:
		if stream {
			content, err := client.requestChatCompletionStream(ctx, credentials, messages, temperature, maxTokens, onDelta)
			if err != nil {
				return nil, err
			}

			return &aiProviderCompletionResult{
				content:  content,
				apiStyle: aiProviderAPIStyleChatCompletions,
			}, nil
		}

		return client.requestChatCompletionDetailed(ctx, credentials, messages, temperature, maxTokens, includeDebug)
	case aiProviderAPIStyleResponses:
		if stream {
			content, err := client.requestResponsesStream(ctx, credentials, messages, temperature, maxTokens, onDelta)
			if err != nil {
				return nil, err
			}

			return &aiProviderCompletionResult{
				content:  content,
				apiStyle: aiProviderAPIStyleResponses,
			}, nil
		}

		return client.requestResponsesDetailed(ctx, credentials, messages, temperature, maxTokens, includeDebug)
	default:
		return nil, fmt.Errorf("未知的 AI Provider 协议类型: %s", apiStyle)
	}
}

func (client *aiProviderClient) requestChatCompletionDetailed(
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
		return nil, buildAIProviderHTTPError(aiProviderAPIStyleChatCompletions, httpResponse.StatusCode, responseBody, debugInfo)
	}

	var completionResponse aiChatCompletionResponse
	if err := json.Unmarshal(responseBody, &completionResponse); err != nil {
		return nil, buildAIProviderInvalidPayloadError(
			aiProviderAPIStyleChatCompletions,
			"Provider 已响应，但返回格式不兼容 OpenAI Chat Completions",
			debugInfo,
		)
	}

	if len(completionResponse.Choices) == 0 {
		return nil, buildAIProviderInvalidPayloadError(
			aiProviderAPIStyleChatCompletions,
			"Provider 已响应，但返回结果中缺少可用内容",
			debugInfo,
		)
	}

	content := strings.TrimSpace(completionResponse.Choices[0].Message.Content)
	if content == "" {
		return nil, buildAIProviderInvalidPayloadError(
			aiProviderAPIStyleChatCompletions,
			"Provider 已响应，但返回内容为空",
			debugInfo,
		)
	}

	return &aiProviderCompletionResult{
		content:  content,
		debug:    debugInfo,
		apiStyle: aiProviderAPIStyleChatCompletions,
	}, nil
}

func (client *aiProviderClient) requestResponsesDetailed(
	ctx context.Context,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
	maxTokens int,
	includeDebug bool,
) (*aiProviderCompletionResult, error) {
	requestBody, err := json.Marshal(buildAIResponsesRequest(credentials.model, messages, temperature, maxTokens, false))
	if err != nil {
		return nil, fmt.Errorf("序列化 AI 请求失败: %w", err)
	}

	httpRequest, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		util.BuildAIResponsesURL(credentials.baseURL),
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
		return nil, buildAIProviderHTTPError(aiProviderAPIStyleResponses, httpResponse.StatusCode, responseBody, debugInfo)
	}

	content, err := extractAIResponsesText(responseBody)
	if err != nil {
		return nil, buildAIProviderInvalidPayloadError(
			aiProviderAPIStyleResponses,
			"Provider 已响应，但返回格式不兼容 OpenAI Responses",
			debugInfo,
		)
	}

	return &aiProviderCompletionResult{
		content:  content,
		debug:    debugInfo,
		apiStyle: aiProviderAPIStyleResponses,
	}, nil
}

func (client *aiProviderClient) requestChatCompletionStream(
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

		return "", buildAIProviderHTTPError(aiProviderAPIStyleChatCompletions, httpResponse.StatusCode, responseBody, nil)
	}

	var contentBuilder strings.Builder
	if err := consumeAIProviderStream(httpResponse.Body, func(event aiProviderSSEEvent) error {
		delta, extractErr := extractAIChatCompletionStreamDelta(event.data)
		if extractErr != nil {
			return buildAIProviderInvalidPayloadError(
				aiProviderAPIStyleChatCompletions,
				"Provider 已响应，但流式返回格式不兼容 OpenAI Chat Completions",
				nil,
			)
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

func (client *aiProviderClient) requestResponsesStream(
	ctx context.Context,
	credentials *aiProviderCredentials,
	messages []aiChatMessage,
	temperature float64,
	maxTokens int,
	onDelta func(delta string) error,
) (string, error) {
	requestBody, err := json.Marshal(buildAIResponsesRequest(credentials.model, messages, temperature, maxTokens, true))
	if err != nil {
		return "", fmt.Errorf("序列化 AI 流式请求失败: %w", err)
	}

	httpRequest, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		util.BuildAIResponsesURL(credentials.baseURL),
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

		return "", buildAIProviderHTTPError(aiProviderAPIStyleResponses, httpResponse.StatusCode, responseBody, nil)
	}

	var contentBuilder strings.Builder
	if err := consumeAIProviderStream(httpResponse.Body, func(event aiProviderSSEEvent) error {
		delta, fallbackText, extractErr := extractAIResponsesStreamText(event)
		if extractErr != nil {
			return buildAIProviderInvalidPayloadError(
				aiProviderAPIStyleResponses,
				"Provider 已响应，但流式返回格式不兼容 OpenAI Responses",
				nil,
			)
		}

		if delta != "" {
			contentBuilder.WriteString(delta)
			if onDelta != nil {
				return onDelta(delta)
			}
			return nil
		}

		// 某些 Provider 只在完成事件里附带最终文本，此时补发一次整段文本，避免流式结果为空。
		if fallbackText != "" && contentBuilder.Len() == 0 {
			contentBuilder.WriteString(fallbackText)
			if onDelta != nil {
				return onDelta(fallbackText)
			}
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

func buildAIProviderHTTPError(
	apiStyle aiProviderAPIStyle,
	statusCode int,
	responseBody []byte,
	debugInfo *dto.AIProviderDebugInfo,
) error {
	upstreamMessage := extractAIProviderErrorMessage(responseBody)
	switch {
	case isModelAvailabilityError(statusCode, upstreamMessage):
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			apiStyle:          apiStyle,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但当前模型不可用：%s", upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode == http.StatusUnauthorized:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			apiStyle:          apiStyle,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但 API Key 无效或已失效：%s", upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode == http.StatusForbidden:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			apiStyle:          apiStyle,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但当前凭证没有调用权限：%s", upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode == http.StatusNotFound:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			apiStyle:          apiStyle,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已响应，但 %s 接口不存在或地址不兼容：%s", resolveAIProviderAPIStyleDisplayName(apiStyle), upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode == http.StatusTooManyRequests:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			apiStyle:          apiStyle,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但请求被限流：%s", upstreamMessage),
			debug:             debugInfo,
		}
	case statusCode >= http.StatusInternalServerError:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			apiStyle:          apiStyle,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但上游服务暂时不可用：%s", upstreamMessage),
			debug:             debugInfo,
		}
	default:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			apiStyle:          apiStyle,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 请求失败：%s", upstreamMessage),
			debug:             debugInfo,
		}
	}
}

func buildAIProviderModelsHTTPError(statusCode int, responseBody []byte) error {
	upstreamMessage := extractAIProviderErrorMessage(responseBody)
	switch statusCode {
	case http.StatusUnauthorized:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但 API Key 无效或已失效：%s", upstreamMessage),
		}
	case http.StatusForbidden:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已连通，但当前凭证没有拉取模型列表的权限：%s", upstreamMessage),
		}
	case http.StatusNotFound:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			statusCode:        statusCode,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 已响应，但 Models 接口不存在或地址不兼容：%s", upstreamMessage),
		}
	default:
		return &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			statusCode:        statusCode,
			providerReachable: statusCode < http.StatusInternalServerError,
			modelAvailable:    false,
			message:           fmt.Sprintf("模型列表拉取失败：%s", upstreamMessage),
		}
	}
}

func buildAIProviderInvalidPayloadError(
	apiStyle aiProviderAPIStyle,
	message string,
	debugInfo *dto.AIProviderDebugInfo,
) error {
	return &aiProviderCompletionError{
		kind:              aiProviderCompletionErrorKindInvalidPayload,
		apiStyle:          apiStyle,
		providerReachable: true,
		modelAvailable:    false,
		message:           message,
		debug:             debugInfo,
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

func consumeAIProviderStream(reader io.Reader, handleEvent func(event aiProviderSSEEvent) error) error {
	streamReader := bufio.NewReader(reader)
	dataLines := make([]string, 0, 4)
	eventName := ""

	flushEvent := func() error {
		if len(dataLines) == 0 && eventName == "" {
			return nil
		}

		payload := strings.Join(dataLines, "\n")
		currentEventName := eventName
		dataLines = dataLines[:0]
		eventName = ""
		if payload == "[DONE]" {
			return nil
		}

		return handleEvent(aiProviderSSEEvent{
			event: currentEventName,
			data:  payload,
		})
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
		case strings.HasPrefix(trimmedLine, "event:"):
			eventName = strings.TrimSpace(strings.TrimPrefix(trimmedLine, "event:"))
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

func extractAIChatCompletionStreamDelta(payload string) (string, error) {
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

func extractAIResponsesText(payload []byte) (string, error) {
	var response aiResponsesResponse
	if err := json.Unmarshal(payload, &response); err != nil {
		return "", err
	}

	if strings.TrimSpace(response.OutputText) != "" {
		return strings.TrimSpace(response.OutputText), nil
	}

	var contentBuilder strings.Builder
	for _, output := range response.Output {
		for _, content := range output.Content {
			if strings.TrimSpace(content.Text) == "" {
				continue
			}

			if content.Type != "" && content.Type != "output_text" && content.Type != "text" {
				continue
			}

			contentBuilder.WriteString(content.Text)
		}
	}

	trimmedContent := strings.TrimSpace(contentBuilder.String())
	if trimmedContent == "" {
		return "", errors.New("responses 内容为空")
	}

	return trimmedContent, nil
}

func extractAIResponsesStreamText(event aiProviderSSEEvent) (string, string, error) {
	trimmedPayload := strings.TrimSpace(event.data)
	if trimmedPayload == "" {
		return "", "", nil
	}

	eventName := strings.TrimSpace(event.event)
	if eventName == "" {
		var streamEvent aiResponsesStreamEvent
		if err := json.Unmarshal([]byte(trimmedPayload), &streamEvent); err == nil {
			eventName = strings.TrimSpace(streamEvent.Type)
			if eventName == "response.output_text.delta" {
				return streamEvent.Delta, "", nil
			}
			if eventName == "response.output_text.done" {
				return "", streamEvent.Text, nil
			}
		}
	}

	switch eventName {
	case "", "response.created", "response.in_progress", "response.output_item.added", "response.content_part.added", "response.content_part.done":
		return "", "", nil
	case "error":
		return "", "", &aiProviderCompletionError{
			kind:              aiProviderCompletionErrorKindRequestFailed,
			apiStyle:          aiProviderAPIStyleResponses,
			providerReachable: true,
			modelAvailable:    false,
			message:           fmt.Sprintf("Provider 请求失败：%s", extractAIProviderErrorMessage([]byte(trimmedPayload))),
		}
	case "response.output_text.delta":
		var streamEvent aiResponsesStreamEvent
		if err := json.Unmarshal([]byte(trimmedPayload), &streamEvent); err != nil {
			return "", "", err
		}
		return streamEvent.Delta, "", nil
	case "response.output_text.done":
		var streamEvent aiResponsesStreamEvent
		if err := json.Unmarshal([]byte(trimmedPayload), &streamEvent); err != nil {
			return "", "", err
		}
		return "", streamEvent.Text, nil
	case "response.completed":
		content, err := extractAIResponsesText([]byte(trimmedPayload))
		if err != nil {
			return "", "", err
		}
		return "", content, nil
	default:
		return "", "", nil
	}
}

func buildAIResponsesRequest(
	model string,
	messages []aiChatMessage,
	temperature float64,
	maxTokens int,
	stream bool,
) aiResponsesRequest {
	request := aiResponsesRequest{
		Model:           model,
		Temperature:     temperature,
		MaxOutputTokens: maxTokens,
		Stream:          stream,
	}

	inputMessages := make([]aiResponsesInputMessage, 0, len(messages))
	for _, message := range messages {
		if strings.TrimSpace(message.Content) == "" {
			continue
		}

		if message.Role == "system" && strings.TrimSpace(request.Instructions) == "" {
			request.Instructions = message.Content
			continue
		}

		inputMessages = append(inputMessages, aiResponsesInputMessage{
			Role:    message.Role,
			Content: message.Content,
		})
	}
	request.Input = inputMessages

	return request
}

func canFallbackToAlternativeAPIStyle(err error) bool {
	var completionErr *aiProviderCompletionError
	if !errors.As(err, &completionErr) {
		return false
	}

	if completionErr.kind == aiProviderCompletionErrorKindInvalidPayload {
		return true
	}

	return isAPIStyleCompatibilityError(completionErr.statusCode, completionErr.message)
}

func isAPIStyleCompatibilityError(statusCode int, message string) bool {
	if statusCode == http.StatusNotFound || statusCode == http.StatusMethodNotAllowed || statusCode == http.StatusNotImplemented {
		return true
	}

	if statusCode == 0 {
		return false
	}

	lowerMessage := strings.ToLower(strings.TrimSpace(message))
	if lowerMessage == "" {
		return false
	}

	keywords := []string{
		"endpoint",
		"route",
		"path",
		"not found",
		"not supported",
		"unsupported",
		"unknown url",
		"chat completions",
		"chat/completions",
		"responses",
		"does not exist",
		"不存在",
		"不兼容",
		"不支持",
		"未实现",
		"路径",
		"接口",
	}
	for _, keyword := range keywords {
		if strings.Contains(lowerMessage, keyword) {
			return true
		}
	}

	return false
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

func resolveAIProviderAPIStyleDisplayName(apiStyle aiProviderAPIStyle) string {
	switch apiStyle {
	case aiProviderAPIStyleResponses:
		return "Responses"
	default:
		return "Chat Completions"
	}
}

func (client *aiProviderClient) resolveAPIStyles(baseURL string, model string) []aiProviderAPIStyle {
	if capability, exists := client.capabilityCache.get(baseURL, model); exists {
		if capability.apiStyle == aiProviderAPIStyleResponses {
			return []aiProviderAPIStyle{aiProviderAPIStyleResponses, aiProviderAPIStyleChatCompletions}
		}

		return []aiProviderAPIStyle{aiProviderAPIStyleChatCompletions, aiProviderAPIStyleResponses}
	}

	return []aiProviderAPIStyle{aiProviderAPIStyleChatCompletions, aiProviderAPIStyleResponses}
}

func (cache *aiProviderCapabilityCache) get(baseURL string, model string) (aiProviderCapability, bool) {
	cache.mutex.Lock()
	defer cache.mutex.Unlock()

	cacheKey := buildAIProviderCapabilityCacheKey(baseURL, model)
	cacheItem, exists := cache.items[cacheKey]
	if !exists {
		return aiProviderCapability{}, false
	}

	if time.Now().After(cacheItem.expireAt) {
		delete(cache.items, cacheKey)
		return aiProviderCapability{}, false
	}

	return cacheItem.capability, true
}

func (cache *aiProviderCapabilityCache) set(baseURL string, model string, capability aiProviderCapability) {
	cache.mutex.Lock()
	defer cache.mutex.Unlock()

	cache.items[buildAIProviderCapabilityCacheKey(baseURL, model)] = aiProviderCapabilityCacheItem{
		capability: capability,
		expireAt:   time.Now().Add(aiProviderCapabilityCacheTTL),
	}
}

func buildAIProviderCapabilityCacheKey(baseURL string, model string) string {
	return strings.TrimSpace(baseURL) + "::" + strings.TrimSpace(model)
}
