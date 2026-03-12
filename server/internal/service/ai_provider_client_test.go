// ai_provider_client_test.go - 验证 Provider 探活请求的错误分类与成功解析
package service

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Qindly/markmind/internal/util"
)

func TestAIProviderClientRequestCompletionSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"choices":[{"message":{"content":"OK"}}]}`))
	}))
	defer server.Close()

	baseURL, err := util.NormalizeAIProviderBaseURL(server.URL)
	if err != nil {
		t.Fatalf("归一化测试服务地址失败: %v", err)
	}

	client := newAIProviderClient(time.Second)
	content, err := client.requestCompletion(
		context.Background(),
		&aiProviderCredentials{
			baseURL: baseURL,
			apiKey:  "sk-test",
			model:   "gpt-4.1-mini",
		},
		buildAISettingsTestMessages(),
		0,
		aiProbeMaxTokens,
	)
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

	baseURL, err := util.NormalizeAIProviderBaseURL(server.URL)
	if err != nil {
		t.Fatalf("归一化测试服务地址失败: %v", err)
	}

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

	if result.debug == nil {
		t.Fatal("启用调试模式时应返回调试信息")
	}

	if result.debug.RequestURL != baseURL+"/chat/completions" {
		t.Fatalf("调试返回的请求地址不正确: %s", result.debug.RequestURL)
	}

	if result.debug.RequestHeaders["Authorization"] == "Bearer sk-debug-test-key" {
		t.Fatal("调试信息中的 Authorization 不应回传明文 API Key")
	}

	if result.debug.ResponseStatusCode != http.StatusOK {
		t.Fatalf("调试返回的状态码不正确: %d", result.debug.ResponseStatusCode)
	}
}

func TestAIProviderClientRequestCompletionClassifiesModelUnavailable(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusBadRequest)
		_, _ = writer.Write([]byte(`{"error":{"message":"The model \\"gpt-4.1-mini\\" does not exist"}}`))
	}))
	defer server.Close()

	baseURL, err := util.NormalizeAIProviderBaseURL(server.URL)
	if err != nil {
		t.Fatalf("归一化测试服务地址失败: %v", err)
	}

	client := newAIProviderClient(time.Second)
	_, err = client.requestCompletion(
		context.Background(),
		&aiProviderCredentials{
			baseURL: baseURL,
			apiKey:  "sk-test",
			model:   "gpt-4.1-mini",
		},
		buildAISettingsTestMessages(),
		0,
		aiProbeMaxTokens,
	)
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

func TestAIProviderClientRequestCompletionClassifiesTimeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		time.Sleep(80 * time.Millisecond)
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"choices":[{"message":{"content":"OK"}}]}`))
	}))
	defer server.Close()

	baseURL, err := util.NormalizeAIProviderBaseURL(server.URL)
	if err != nil {
		t.Fatalf("归一化测试服务地址失败: %v", err)
	}

	client := newAIProviderClient(10 * time.Millisecond)
	_, err = client.requestCompletion(
		context.Background(),
		&aiProviderCredentials{
			baseURL: baseURL,
			apiKey:  "sk-test",
			model:   "gpt-4.1-mini",
		},
		buildAISettingsTestMessages(),
		0,
		aiProbeMaxTokens,
	)
	if err == nil {
		t.Fatal("请求超时时应返回错误")
	}

	var completionErr *aiProviderCompletionError
	if !errors.As(err, &completionErr) {
		t.Fatalf("应返回 aiProviderCompletionError，实际为: %T", err)
	}

	if completionErr.providerReachable {
		t.Fatal("超时时 Provider 不应视为可达")
	}
}
