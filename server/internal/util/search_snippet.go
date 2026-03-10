// search_snippet.go - 提供 Markdown 纯文本摘要与搜索片段生成工具
package util

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

const (
	searchSnippetMaxRunes       = 96
	searchSnippetLeadingContext = 24
)

var (
	markdownFencePattern         = regexp.MustCompile("(?m)^[\\t ]*(?:```|~~~)[^\\n]*$")
	markdownHTMLTagPattern       = regexp.MustCompile("(?s)<[^>]+>")
	markdownImagePattern         = regexp.MustCompile(`!\[([^\]]*)\]\([^)]+\)`)
	markdownInlineLinkPattern    = regexp.MustCompile(`\[([^\]]+)\]\([^)]+\)`)
	markdownReferenceLinkPattern = regexp.MustCompile(`\[([^\]]+)\]\[[^\]]*\]`)
	markdownBlockPrefixPattern   = regexp.MustCompile("(?m)^[\\t ]{0,3}(?:#{1,6}\\s+|>+\\s*|[-*+]\\s+|\\d+\\.\\s+)")
)

var markdownCleanupReplacer = strings.NewReplacer(
	"\r\n", "\n",
	"\r", "\n",
	"**", " ",
	"__", " ",
	"~~", " ",
	"`", " ",
	"|", " ",
	"\t", " ",
)

// MarkdownToPlainText - 将 Markdown 原文清洗成适合列表展示的纯文本。
// 参数 content: 文档原始 Markdown 内容。
// 返回值：去掉大部分 Markdown 语法后的纯文本。
func MarkdownToPlainText(content string) string {
	if strings.TrimSpace(content) == "" {
		return ""
	}

	normalizedContent := markdownCleanupReplacer.Replace(content)
	normalizedContent = markdownFencePattern.ReplaceAllString(normalizedContent, " ")
	normalizedContent = markdownImagePattern.ReplaceAllString(normalizedContent, "$1")
	normalizedContent = markdownInlineLinkPattern.ReplaceAllString(normalizedContent, "$1")
	normalizedContent = markdownReferenceLinkPattern.ReplaceAllString(normalizedContent, "$1")
	normalizedContent = markdownHTMLTagPattern.ReplaceAllString(normalizedContent, " ")
	normalizedContent = markdownBlockPrefixPattern.ReplaceAllString(normalizedContent, "")

	return strings.Join(strings.Fields(normalizedContent), " ")
}

// BuildSearchSnippet - 根据搜索关键字生成正文摘要片段。
// 参数 content: 文档 Markdown 正文。
// 参数 keyword: 当前搜索关键字。
// 返回值：围绕命中位置的纯文本摘要；若正文未命中则回退到正文开头摘要。
func BuildSearchSnippet(content string, keyword string) string {
	plainText := MarkdownToPlainText(content)
	if plainText == "" {
		return ""
	}

	normalizedKeyword := strings.TrimSpace(keyword)
	if normalizedKeyword == "" {
		return truncateSearchSnippet(plainText)
	}

	matchIndex := findKeywordRuneIndex(plainText, normalizedKeyword)
	if matchIndex < 0 {
		return truncateSearchSnippet(plainText)
	}

	return excerptSnippetByMatch(plainText, matchIndex, utf8.RuneCountInString(normalizedKeyword))
}

func findKeywordRuneIndex(text string, keyword string) int {
	byteIndex := strings.Index(strings.ToLower(text), strings.ToLower(keyword))
	if byteIndex < 0 {
		return -1
	}

	return utf8.RuneCountInString(text[:byteIndex])
}

func truncateSearchSnippet(text string) string {
	runes := []rune(text)
	if len(runes) <= searchSnippetMaxRunes {
		return text
	}

	return strings.TrimSpace(string(runes[:searchSnippetMaxRunes])) + "..."
}

func excerptSnippetByMatch(text string, matchIndex int, matchLength int) string {
	runes := []rune(text)
	if len(runes) <= searchSnippetMaxRunes {
		return text
	}

	start := maxInt(matchIndex-searchSnippetLeadingContext, 0)
	end := minInt(start+searchSnippetMaxRunes, len(runes))
	matchEnd := minInt(matchIndex+maxInt(matchLength, 1), len(runes))

	if matchEnd > end {
		end = matchEnd
		start = maxInt(end-searchSnippetMaxRunes, 0)
	}

	if end == len(runes) {
		start = maxInt(end-searchSnippetMaxRunes, 0)
	}

	snippet := strings.TrimSpace(string(runes[start:end]))
	if start > 0 {
		snippet = "..." + strings.TrimLeft(snippet, " ")
	}
	if end < len(runes) {
		snippet = strings.TrimRight(snippet, " ") + "..."
	}

	return snippet
}

func maxInt(left int, right int) int {
	if left > right {
		return left
	}

	return right
}

func minInt(left int, right int) int {
	if left < right {
		return left
	}

	return right
}
