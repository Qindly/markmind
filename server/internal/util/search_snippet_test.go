// search_snippet_test.go - 测试 Markdown 搜索摘要工具的纯文本提取与片段生成
package util

import (
	"strings"
	"testing"
)

func TestMarkdownToPlainText(t *testing.T) {
	content := "# React Hooks\n学习 [useEffect](https://react.dev)\n\n```ts\nconst count = 1\n```\n> 记得清理副作用"

	plainText := MarkdownToPlainText(content)

	if strings.Contains(plainText, "#") || strings.Contains(plainText, "```") {
		t.Fatalf("纯文本中仍然包含 Markdown 语法，结果=%q", plainText)
	}
	if !strings.Contains(plainText, "React Hooks") || !strings.Contains(plainText, "useEffect") {
		t.Fatalf("纯文本缺少预期内容，结果=%q", plainText)
	}
}

func TestBuildSearchSnippetUsesMatchContext(t *testing.T) {
	content := "这一段是很长的开场白，用来拉开摘要长度，也让命中词尽量落在正文中段位置。为了覆盖真实场景，这里继续补一些关于路由组织、布局拆分和状态同步的背景说明。React Router 的嵌套路由需要和 Outlet 配合使用，才能让页面结构更清晰。后面还有一些关于权限校验、错误边界和回退体验的补充说明。"

	snippet := BuildSearchSnippet(content, "Outlet")

	if !strings.Contains(snippet, "Outlet") {
		t.Fatalf("摘要没有围绕命中词生成，结果=%q", snippet)
	}
	if !strings.HasPrefix(snippet, "...") {
		t.Fatalf("命中位于中间时应补前置省略号，结果=%q", snippet)
	}
}

func TestBuildSearchSnippetFallsBackToLeadingText(t *testing.T) {
	content := "Markdown 正文没有直接命中，但这里有一段开头摘要，应该在只有标题命中时回退展示这一段。"

	snippet := BuildSearchSnippet(content, "Pinia")

	if snippet == "" {
		t.Fatal("正文非空时，回退摘要不应为空")
	}
	if strings.HasPrefix(snippet, "...") {
		t.Fatalf("回退到正文开头时不应出现前置省略号，结果=%q", snippet)
	}
	if !strings.Contains(snippet, "Markdown 正文没有直接命中") {
		t.Fatalf("回退摘要没有使用正文开头，结果=%q", snippet)
	}
}
