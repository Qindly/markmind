package util

import "testing"

func TestNormalizeAIProviderBaseURLAppendsV1(t *testing.T) {
	normalizedBaseURL, err := NormalizeAIProviderBaseURL("https://example.com/openai")
	if err != nil {
		t.Fatalf("归一化 Base URL 失败: %v", err)
	}

	if normalizedBaseURL != "https://example.com/openai/v1" {
		t.Fatalf("Base URL 归一化结果不正确: %s", normalizedBaseURL)
	}
}

func TestNormalizeAIProviderBaseURLKeepsV1(t *testing.T) {
	normalizedBaseURL, err := NormalizeAIProviderBaseURL("https://example.com/v1/")
	if err != nil {
		t.Fatalf("归一化 Base URL 失败: %v", err)
	}

	if normalizedBaseURL != "https://example.com/v1" {
		t.Fatalf("Base URL 归一化结果不正确: %s", normalizedBaseURL)
	}
}

func TestBuildAIChatCompletionsURL(t *testing.T) {
	result := BuildAIChatCompletionsURL("https://example.com/v1/")
	expected := "https://example.com/v1/chat/completions"

	if result != expected {
		t.Fatalf("Chat Completions 地址拼接结果不正确: %s", result)
	}
}

func TestBuildAIResponsesURL(t *testing.T) {
	result := BuildAIResponsesURL("https://example.com/v1/")
	expected := "https://example.com/v1/responses"

	if result != expected {
		t.Fatalf("Responses 地址拼接结果不正确: %s", result)
	}
}

func TestBuildAIModelsURL(t *testing.T) {
	result := BuildAIModelsURL("https://example.com/v1/")
	expected := "https://example.com/v1/models"

	if result != expected {
		t.Fatalf("Models 地址拼接结果不正确: %s", result)
	}
}

func TestMaskSecretValue(t *testing.T) {
	result := MaskSecretValue("sk-test-secret-value")
	expected := "sk-t************alue"

	if result != expected {
		t.Fatalf("脱敏结果不正确: %s", result)
	}
}
