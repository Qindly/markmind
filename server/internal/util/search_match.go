// search_match.go - 提供 Dashboard 文档搜索命中来源判定工具
package util

import "strings"

// SearchMatchSource - 表示搜索结果中关键字的命中来源。
type SearchMatchSource string

const (
	// SearchMatchSourceTitle - 表示关键字命中了标题。
	SearchMatchSourceTitle SearchMatchSource = "title"
	// SearchMatchSourceContent - 表示关键字命中了正文。
	SearchMatchSourceContent SearchMatchSource = "content"
)

// BuildSearchMatchSources - 根据标题、正文和关键字生成命中来源列表。
// 参数 title: 文档标题。
// 参数 content: 文档正文。
// 参数 keyword: 当前搜索关键字。
// 返回值：按标题优先、正文次之排列的命中来源。
func BuildSearchMatchSources(title string, content string, keyword string) []SearchMatchSource {
	normalizedKeyword := strings.TrimSpace(strings.ToLower(keyword))
	if normalizedKeyword == "" {
		return nil
	}

	matchSources := make([]SearchMatchSource, 0, 2)
	if containsNormalizedKeyword(title, normalizedKeyword) {
		matchSources = append(matchSources, SearchMatchSourceTitle)
	}

	if containsNormalizedKeyword(content, normalizedKeyword) {
		matchSources = append(matchSources, SearchMatchSourceContent)
	}

	return matchSources
}

func containsNormalizedKeyword(text string, normalizedKeyword string) bool {
	return strings.Contains(strings.ToLower(text), normalizedKeyword)
}
