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

func TestBuildBilingualMarkdownResult(t *testing.T) {
	result := BuildBilingualMarkdownResult("Hello", "你好", "English", "中文")
	expected := "### 原文（English）\n\nHello\n\n### 译文（中文）\n\n你好"

	if result != expected {
		t.Fatalf("双语 Markdown 结果不正确: %s", result)
	}
}
