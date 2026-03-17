// text_diff.go - 提供基于行的纯文本 diff 计算能力
package util

import "strings"

const largeTextDiffMatrixThreshold = 4_000_000

// TextDiffOperation - 单行 diff 结果的变更类型。
type TextDiffOperation string

const (
	TextDiffOperationEqual  TextDiffOperation = "equal"
	TextDiffOperationInsert TextDiffOperation = "insert"
	TextDiffOperationDelete TextDiffOperation = "delete"
)

// TextDiffLine - 行级 diff 的单条记录。
type TextDiffLine struct {
	Operation     TextDiffOperation
	Content       string
	OldLineNumber int
	NewLineNumber int
}

// TextDiffStats - 行级 diff 的统计结果。
type TextDiffStats struct {
	AddedLines     int
	DeletedLines   int
	UnchangedLines int
}

// TextDiffResult - 文本 diff 的完整结果。
type TextDiffResult struct {
	Lines []TextDiffLine
	Stats TextDiffStats
}

// BuildTextDiff - 计算两个文本快照之间的行级 diff。
// 参数 fromText: 旧版本文本。
// 参数 toText: 新版本文本。
// 返回值：按顺序排列的 diff 行与统计信息。
func BuildTextDiff(fromText string, toText string) TextDiffResult {
	oldLines := splitDiffLines(fromText)
	newLines := splitDiffLines(toText)

	var operations []TextDiffLine
	if len(oldLines)*len(newLines) > largeTextDiffMatrixThreshold {
		operations = buildFallbackTextDiff(oldLines, newLines)
	} else {
		operations = buildLCSBasedTextDiff(oldLines, newLines)
	}

	return TextDiffResult{
		Lines: operations,
		Stats: buildTextDiffStats(operations),
	}
}

func splitDiffLines(content string) []string {
	if content == "" {
		return nil
	}

	normalizedContent := strings.ReplaceAll(content, "\r\n", "\n")
	return strings.Split(normalizedContent, "\n")
}

func buildFallbackTextDiff(oldLines []string, newLines []string) []TextDiffLine {
	prefixLength := 0
	for prefixLength < len(oldLines) && prefixLength < len(newLines) && oldLines[prefixLength] == newLines[prefixLength] {
		prefixLength++
	}

	oldSuffixIndex := len(oldLines) - 1
	newSuffixIndex := len(newLines) - 1
	for oldSuffixIndex >= prefixLength && newSuffixIndex >= prefixLength && oldLines[oldSuffixIndex] == newLines[newSuffixIndex] {
		oldSuffixIndex--
		newSuffixIndex--
	}

	operations := make([]TextDiffLine, 0, len(oldLines)+len(newLines))
	oldLineNumber := 1
	newLineNumber := 1

	appendEqualRange := func(lines []string, start int, end int) {
		for lineIndex := start; lineIndex < end; lineIndex++ {
			operations = append(operations, TextDiffLine{
				Operation:     TextDiffOperationEqual,
				Content:       lines[lineIndex],
				OldLineNumber: oldLineNumber,
				NewLineNumber: newLineNumber,
			})
			oldLineNumber++
			newLineNumber++
		}
	}

	appendEqualRange(oldLines, 0, prefixLength)

	for lineIndex := prefixLength; lineIndex <= oldSuffixIndex; lineIndex++ {
		operations = append(operations, TextDiffLine{
			Operation:     TextDiffOperationDelete,
			Content:       oldLines[lineIndex],
			OldLineNumber: oldLineNumber,
		})
		oldLineNumber++
	}

	for lineIndex := prefixLength; lineIndex <= newSuffixIndex; lineIndex++ {
		operations = append(operations, TextDiffLine{
			Operation:     TextDiffOperationInsert,
			Content:       newLines[lineIndex],
			NewLineNumber: newLineNumber,
		})
		newLineNumber++
	}

	if oldSuffixIndex+1 < len(oldLines) {
		appendEqualRange(oldLines, oldSuffixIndex+1, len(oldLines))
	}

	return operations
}

func buildLCSBasedTextDiff(oldLines []string, newLines []string) []TextDiffLine {
	oldLineCount := len(oldLines)
	newLineCount := len(newLines)
	lcsMatrix := make([][]int, oldLineCount+1)
	for oldIndex := range lcsMatrix {
		lcsMatrix[oldIndex] = make([]int, newLineCount+1)
	}

	for oldIndex := oldLineCount - 1; oldIndex >= 0; oldIndex-- {
		for newIndex := newLineCount - 1; newIndex >= 0; newIndex-- {
			if oldLines[oldIndex] == newLines[newIndex] {
				lcsMatrix[oldIndex][newIndex] = lcsMatrix[oldIndex+1][newIndex+1] + 1
				continue
			}

			if lcsMatrix[oldIndex+1][newIndex] >= lcsMatrix[oldIndex][newIndex+1] {
				lcsMatrix[oldIndex][newIndex] = lcsMatrix[oldIndex+1][newIndex]
			} else {
				lcsMatrix[oldIndex][newIndex] = lcsMatrix[oldIndex][newIndex+1]
			}
		}
	}

	operations := make([]TextDiffLine, 0, oldLineCount+newLineCount)
	oldIndex := 0
	newIndex := 0
	oldLineNumber := 1
	newLineNumber := 1

	for oldIndex < oldLineCount && newIndex < newLineCount {
		if oldLines[oldIndex] == newLines[newIndex] {
			operations = append(operations, TextDiffLine{
				Operation:     TextDiffOperationEqual,
				Content:       oldLines[oldIndex],
				OldLineNumber: oldLineNumber,
				NewLineNumber: newLineNumber,
			})
			oldIndex++
			newIndex++
			oldLineNumber++
			newLineNumber++
			continue
		}

		if lcsMatrix[oldIndex+1][newIndex] >= lcsMatrix[oldIndex][newIndex+1] {
			operations = append(operations, TextDiffLine{
				Operation:     TextDiffOperationDelete,
				Content:       oldLines[oldIndex],
				OldLineNumber: oldLineNumber,
			})
			oldIndex++
			oldLineNumber++
			continue
		}

		operations = append(operations, TextDiffLine{
			Operation:     TextDiffOperationInsert,
			Content:       newLines[newIndex],
			NewLineNumber: newLineNumber,
		})
		newIndex++
		newLineNumber++
	}

	for oldIndex < oldLineCount {
		operations = append(operations, TextDiffLine{
			Operation:     TextDiffOperationDelete,
			Content:       oldLines[oldIndex],
			OldLineNumber: oldLineNumber,
		})
		oldIndex++
		oldLineNumber++
	}

	for newIndex < newLineCount {
		operations = append(operations, TextDiffLine{
			Operation:     TextDiffOperationInsert,
			Content:       newLines[newIndex],
			NewLineNumber: newLineNumber,
		})
		newIndex++
		newLineNumber++
	}

	return operations
}

func buildTextDiffStats(lines []TextDiffLine) TextDiffStats {
	stats := TextDiffStats{}

	for _, line := range lines {
		switch line.Operation {
		case TextDiffOperationInsert:
			stats.AddedLines++
		case TextDiffOperationDelete:
			stats.DeletedLines++
		default:
			stats.UnchangedLines++
		}
	}

	return stats
}
