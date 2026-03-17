// text_diff_test.go - 测试文档历史版本 diff 的行级结果与统计信息
package util

import "testing"

func TestBuildTextDiffMarksEqualInsertAndDeleteLines(t *testing.T) {
	diffResult := BuildTextDiff("alpha\nbeta\ngamma", "alpha\nbravo\ngamma\ndelta")

	if len(diffResult.Lines) != 5 {
		t.Fatalf("期望返回 5 行 diff，实际=%d", len(diffResult.Lines))
	}

	if diffResult.Lines[0].Operation != TextDiffOperationEqual || diffResult.Lines[0].Content != "alpha" {
		t.Fatalf("第 1 行应为 alpha 的 equal，实际=%+v", diffResult.Lines[0])
	}

	if diffResult.Lines[1].Operation != TextDiffOperationDelete || diffResult.Lines[1].Content != "beta" {
		t.Fatalf("第 2 行应为 beta 的 delete，实际=%+v", diffResult.Lines[1])
	}

	if diffResult.Lines[2].Operation != TextDiffOperationInsert || diffResult.Lines[2].Content != "bravo" {
		t.Fatalf("第 3 行应为 bravo 的 insert，实际=%+v", diffResult.Lines[2])
	}

	if diffResult.Lines[4].Operation != TextDiffOperationInsert || diffResult.Lines[4].NewLineNumber != 4 {
		t.Fatalf("最后一行应为新增第 4 行，实际=%+v", diffResult.Lines[4])
	}
}

func TestBuildTextDiffBuildsStableStats(t *testing.T) {
	diffResult := BuildTextDiff("one\ntwo", "one\nthree")

	if diffResult.Stats.UnchangedLines != 1 {
		t.Fatalf("未变更行数应为 1，实际=%d", diffResult.Stats.UnchangedLines)
	}

	if diffResult.Stats.DeletedLines != 1 {
		t.Fatalf("删除行数应为 1，实际=%d", diffResult.Stats.DeletedLines)
	}

	if diffResult.Stats.AddedLines != 1 {
		t.Fatalf("新增行数应为 1，实际=%d", diffResult.Stats.AddedLines)
	}
}

func TestBuildTextDiffSupportsLargeFallbackScenario(t *testing.T) {
	leftLines := make([]string, 0, 2100)
	rightLines := make([]string, 0, 2100)

	for lineIndex := 0; lineIndex < 2100; lineIndex++ {
		leftLines = append(leftLines, "same")
		rightLines = append(rightLines, "same")
	}

	leftLines[1050] = "left-only"
	rightLines[1050] = "right-only"

	diffResult := BuildTextDiff(stringsJoinLines(leftLines), stringsJoinLines(rightLines))
	if diffResult.Stats.DeletedLines != 1 || diffResult.Stats.AddedLines != 1 {
		t.Fatalf("大文本 fallback 场景应返回 1 增 1 删，实际=%+v", diffResult.Stats)
	}
}

func stringsJoinLines(lines []string) string {
	result := ""
	for lineIndex, line := range lines {
		if lineIndex > 0 {
			result += "\n"
		}
		result += line
	}

	return result
}
