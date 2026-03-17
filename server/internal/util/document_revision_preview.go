// document_revision_preview.go - 生成历史版本列表需要的纯文本预览
package util

import "unicode/utf8"

const revisionPreviewMaxLength = 96

// BuildDocumentRevisionPreview - 将 Markdown 快照压缩成适合历史版本列表展示的摘要。
// 参数 content: 文档快照原文。
// 返回值：去掉大部分 Markdown 语法后的单行预览文本。
func BuildDocumentRevisionPreview(content string) string {
	plainText := MarkdownToPlainText(content)
	if plainText == "" {
		return "空白文档"
	}

	if utf8.RuneCountInString(plainText) <= revisionPreviewMaxLength {
		return plainText
	}

	runes := []rune(plainText)
	return string(runes[:revisionPreviewMaxLength]) + "..."
}
