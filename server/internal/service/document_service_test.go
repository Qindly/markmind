// document_service_test.go - 测试文档搜索所属目录名称解析规则
package service

import "testing"

func TestResolveSearchResultFolderNameReturnsRootForNilFolder(t *testing.T) {
	folderName := resolveSearchResultFolderName(nil, rootFolderDisplayName, map[int64]string{})
	if folderName != rootFolderDisplayName {
		t.Fatalf("根目录文档应返回根目录标签，实际=%q", folderName)
	}
}

func TestResolveSearchResultFolderNameReturnsCurrentFolderName(t *testing.T) {
	folderID := int64(9)
	folderName := resolveSearchResultFolderName(&folderID, "前端实习", map[int64]string{})
	if folderName != "前端实习" {
		t.Fatalf("当前目录搜索应返回当前目录名称，实际=%q", folderName)
	}
}

func TestResolveSearchResultFolderNameFallsBackToFolderMap(t *testing.T) {
	folderID := int64(12)
	folderName := resolveSearchResultFolderName(&folderID, rootFolderDisplayName, map[int64]string{
		folderID: "React 训练营",
	})
	if folderName != "React 训练营" {
		t.Fatalf("全局搜索应优先返回目录映射名称，实际=%q", folderName)
	}
}
