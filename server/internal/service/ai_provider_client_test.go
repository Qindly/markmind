// ai_provider_client_test.go - 验证 Provider 自动探测、流式解析与模型列表拉取
package service

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"slices"
	"testing"
	"time"

	"github.com/Qindly/markmind/internal/util"
)

func TestAIProviderClientRequestCompletionSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/v1/chat/completions" {
			t.Fatalf("请求路径不正确: %s", request.URL.Path)
		}

		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"choices":[{"message":{"content":"OK"}}]}`))
	}))
	defer server.Close()

	baseURL := normalizeTestAIProviderBaseURL(t, server.URL)
	client := newAIProviderClient(time.Second)
	content, err := client.requestCompletion(context.Background(), newTestAIProviderCredentials(baseURL), buildAISettingsTestMessages(), 0, aiProbeMaxTokens)
	if err != nil {
		t.Fatalf("探活请求应成功，实际报错: %v", err)
	}

	if content != "OK" {
		t.Fatalf("探活返回内容不正确: %s", content)
	}
}

func TestAIProviderClientRequestCompletionDetailedReturnsDebugInfo(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"choices":[{"message":{"content":"OK"}}]}`))
	}))
	defer server.Close()

	baseURL := normalizeTestAIProviderBaseURL(t, server.URL)
	client := newAIProviderClient(time.Second)
	result, err := client.requestCompletionDetailed(
		context.Background(),
		&aiProviderCredentials{
			baseURL: baseURL,
			apiKey:  "sk-debug-test-key",
			model:   "gpt-4.1-mini",
		},
		buildAISettingsTestMessages(),
		0,
		aiProbeMaxTokens,
		true,
	)
	if err != nil {
		t.Fatalf("调试探活请求应成功，实际报错: %v", err)
	}

	if result.apiStyle != aiProviderAPIStyleChatCompletions {
		t.Fatalf("协议类型不正确: %s", result.apiStyle)
	}

	if result.debug == nil {
		t.Fatal("启用调试模式时应返回调试信息")
	}

	if result.debug.RequestURL != baseURL+"/chat/completions" {
		t.Fatalf("调试返回的请求地址不正确: %s", result.debug.RequestURL)
	}

	if result.debug.RequestHeaders["Authorization"] == "Bearer sk-debug-test-key" {
		t.Fatal("调试信息中的 Authorization 不应回传明文 API Key")
	}
}

func TestAIProviderClientRequestCompletionFallsBackToResponses(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case "/v1/chat/completions":
			writer.WriteHeader(http.StatusNotFound)
			_, _ = writer.Write([]byte(`{"error":{"message":"chat/completions not found"}}`))
		case "/v1/responses":
			writer.Header().Set("Content-Type", "application/json")
			_, _ = writer.Write([]byte(`{"output_text":"OK"}`))
		default:
			t.Fatalf("收到未预期的请求路径: %s", request.URL.Path)
		}
	}))
	defer server.Close()

	baseURL := normalizeTestAIProviderBaseURL(t, server.URL)
	client := newAIProviderClient(time.Second)
	result, err := client.requestCompletionDetailed(
		context.Background(),
		newTestAIProviderCredentials(baseURL),
		buildAISettingsTestMessages(),
		0,
		aiProbeMaxTokens,
		true,
	)
	if err != nil {
		t.Fatalf("回退到 Responses 后应成功，实际报错: %v", err)
	}

	if result.content != "OK" {
		t.Fatalf("回退后的返回内容不正确: %s", result.content)
	}

	if result.apiStyle != aiProviderAPIStyleResponses {
		t.Fatalf("回退后的协议类型不正确: %s", result.apiStyle)
	}

	if result.debug == nil || result.debug.RequestURL != baseURL+"/responses" {
		t.Fatalf("回退后应返回 Responses 的调试地址，实际为: %+v", result.debug)
	}
}

func TestAIProviderClientCachesDetectedAPIStyle(t *testing.T) {
	chatRequests := 0
	responsesRequests := 0
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case "/v1/chat/completions":
			chatRequests++
			writer.WriteHeader(http.StatusNotFound)
			_, _ = writer.Write([]byte(`{"error":{"message":"chat/completions not found"}}`))
		case "/v1/responses":
			responsesRequests++
			writer.Header().Set("Content-Type", "application/json")
			_, _ = writer.Write([]byte(`{"output_text":"OK"}`))
		default:
			t.Fatalf("收到未预期的请求路径: %s", request.URL.Path)
		}
	}))
	defer server.Close()

	baseURL := normalizeTestAIProviderBaseURL(t, server.URL)
	client := newAIProviderClient(time.Second)

	for index := 0; index < 2; index++ {
		_, err := client.requestCompletion(context.Background(), newTestAIProviderCredentials(baseURL), buildAISettingsTestMessages(), 0, aiProbeMaxTokens)
		if err != nil {
			t.Fatalf("第 %d 次请求应成功，实际报错: %v", index+1, err)
		}
	}

	if chatRequests != 1 {
		t.Fatalf("缓存命中后不应重复探测 Chat Completions，实际请求次数: %d", chatRequests)
	}

	if responsesRequests != 2 {
		t.Fatalf("Responses 请求次数不正确: %d", responsesRequests)
	}
}

func TestAIProviderClientRequestCompletionClassifiesModelUnavailable(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusBadRequest)
		_, _ = writer.Write([]byte(`{"error":{"message":"The model \"gpt-4.1-mini\" does not exist"}}`))
	}))
	defer server.Close()

	baseURL := normalizeTestAIProviderBaseURL(t, server.URL)
	client := newAIProviderClient(time.Second)
	_, err := client.requestCompletion(context.Background(), newTestAIProviderCredentials(baseURL), buildAISettingsTestMessages(), 0, aiProbeMaxTokens)
	if err == nil {
		t.Fatal("模型不可用时应返回错误")
	}

	var completionErr *aiProviderCompletionError
	if !errors.As(err, &completionErr) {
		t.Fatalf("应返回 aiProviderCompletionError，实际为: %T", err)
	}

	if !completionErr.providerReachable {
		t.Fatal("模型不可用时 Provider 应视为可达")
	}

	if completionErr.modelAvailable {
		t.Fatal("模型不可用时 modelAvailable 应为 false")
	}
}

func TestAIProviderClientRequestCompletionStreamFallsBackToResponses(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case "/v1/chat/completions":
			writer.WriteHeader(http.StatusNotFound)
			_, _ = writer.Write([]byte(`{"error":{"message":"chat/completions not found"}}`))
		case "/v1/responses":
			writer.Header().Set("Content-Type", "text/event-stream")
			_, _ = writer.Write([]byte("event: response.output_text.delta\n"))
			_, _ = writer.Write([]byte("data: {\"delta\":\"你\"}\n\n"))
			_, _ = writer.Write([]byte("event: response.output_text.delta\n"))
			_, _ = writer.Write([]byte("data: {\"delta\":\"好\"}\n\n"))
			_, _ = writer.Write([]byte("event: response.completed\n"))
			_, _ = writer.Write([]byte("data: {\"output\":[{\"content\":[{\"type\":\"output_text\",\"text\":\"你好\"}]}]}\n\n"))
		default:
			t.Fatalf("收到未预期的请求路径: %s", request.URL.Path)
		}
	}))
	defer server.Close()

	baseURL := normalizeTestAIProviderBaseURL(t, server.URL)
	client := newAIProviderClient(time.Second)
	deltas := make([]string, 0, 2)
	content, err := client.requestCompletionStream(
		context.Background(),
		newTestAIProviderCredentials(baseURL),
		buildAISettingsTestMessages(),
		0,
		aiProbeMaxTokens,
		func(delta string) error {
			deltas = append(deltas, delta)
			return nil
		},
	)
	if err != nil {
		t.Fatalf("回退到 Responses 的流式请求应成功，实际报错: %v", err)
	}

	if content != "你好" {
		t.Fatalf("Responses 流式拼接结果不正确: %s", content)
	}

	if !slices.Equal(deltas, []string{"你", "好"}) {
		t.Fatalf("Responses 流式增量结果不正确: %#v", deltas)
	}
}

func TestAIProviderClientListModelsReturnsSortedResult(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case "/v1/responses":
			writer.Header().Set("Content-Type", "application/json")
			_, _ = writer.Write([]byte(`{"output_text":"OK"}`))
		case "/v1/models":
			writer.Header().Set("Content-Type", "application/json")
			_, _ = writer.Write([]byte(`{"data":[{"id":"gpt-4.1-mini"},{"id":"gpt-4.1"},{"id":"gpt-4.1-mini"}]}`))
		default:
			writer.WriteHeader(http.StatusNotFound)
			_, _ = writer.Write([]byte(`{"error":{"message":"not found"}}`))
		}
	}))
	defer server.Close()

	baseURL := normalizeTestAIProviderBaseURL(t, server.URL)
	client := newAIProviderClient(time.Second)

	// 先通过一次探活把协议能力写入缓存，验证模型列表返回会带上缓存中的协议类型。
	_, err := client.requestCompletion(context.Background(), newTestAIProviderCredentials(baseURL), buildAISettingsTestMessages(), 0, aiProbeMaxTokens)
	if err != nil {
		t.Fatalf("预热协议缓存失败: %v", err)
	}

	result, err := client.listModels(context.Background(), baseURL, "sk-test", "gpt-4.1-mini")
	if err != nil {
		t.Fatalf("模型列表拉取应成功，实际报错: %v", err)
	}

	if !slices.Equal(result.models, []string{"gpt-4.1", "gpt-4.1-mini"}) {
		t.Fatalf("模型列表排序或去重结果不正确: %#v", result.models)
	}

	if result.apiStyle != aiProviderAPIStyleResponses {
		t.Fatalf("模型列表结果应带上缓存中的协议类型，实际为: %s", result.apiStyle)
	}
}

func normalizeTestAIProviderBaseURL(t *testing.T, rawBaseURL string) string {
	t.Helper()

	baseURL, err := util.NormalizeAIProviderBaseURL(rawBaseURL)
	if err != nil {
		t.Fatalf("归一化测试服务地址失败: %v", err)
	}

	return baseURL
}

func newTestAIProviderCredentials(baseURL string) *aiProviderCredentials {
	return &aiProviderCredentials{
		baseURL: baseURL,
		apiKey:  "sk-test",
		model:   "gpt-4.1-mini",
	}
}
