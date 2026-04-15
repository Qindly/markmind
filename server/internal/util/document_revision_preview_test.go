// document_revision_preview_test.go - 测试历史版本预览摘要生成
package util

import "testing"

func TestBuildDocumentRevisionPreviewReturnsFallbackForBlankContent(t *testing.T) {
	preview := BuildDocumentRevisionPreview("   \n\n")
	if preview != "空白文档" {
		t.Fatalf("空白文档应返回占位文案，实际=%q", preview)
	}
}

func TestBuildDocumentRevisionPreviewStripsMostMarkdownSyntax(t *testing.T) {
	preview := BuildDocumentRevisionPreview("# 标题\n\n- 第一条\n- 第二条")
	if preview == "" || preview == "# 标题 - 第一条 - 第二条" {
		t.Fatalf("预览应去掉大部分 Markdown 语法，实际=%q", preview)
	}
}
