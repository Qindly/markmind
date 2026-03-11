// search_match_test.go - 测试文档搜索命中来源判定工具
package util

import "testing"

func TestBuildSearchMatchSourcesReturnsTitleAndContentInStableOrder(t *testing.T) {
	matchSources := BuildSearchMatchSources("React Hooks", "这里整理了 React Hooks 的基本规则。", "react")

	if len(matchSources) != 2 {
		t.Fatalf("期望返回 2 个命中来源，实际=%d", len(matchSources))
	}

	if matchSources[0] != SearchMatchSourceTitle {
		t.Fatalf("第一个命中来源应为标题，实际=%q", matchSources[0])
	}

	if matchSources[1] != SearchMatchSourceContent {
		t.Fatalf("第二个命中来源应为正文，实际=%q", matchSources[1])
	}
}

func TestBuildSearchMatchSourcesSupportsTitleOnly(t *testing.T) {
	matchSources := BuildSearchMatchSources("Pinia 状态管理", "这里没有其它命中。", "pinia")

	if len(matchSources) != 1 {
		t.Fatalf("期望返回 1 个命中来源，实际=%d", len(matchSources))
	}

	if matchSources[0] != SearchMatchSourceTitle {
		t.Fatalf("标题命中时应只返回 title，实际=%q", matchSources[0])
	}
}

func TestBuildSearchMatchSourcesSupportsContentOnly(t *testing.T) {
	matchSources := BuildSearchMatchSources("组合式 API", "正文里提到了 Vue Router。", "router")

	if len(matchSources) != 1 {
		t.Fatalf("期望返回 1 个命中来源，实际=%d", len(matchSources))
	}

	if matchSources[0] != SearchMatchSourceContent {
		t.Fatalf("正文命中时应只返回 content，实际=%q", matchSources[0])
	}
}
