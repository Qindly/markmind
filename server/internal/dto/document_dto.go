// document_dto.go - 定义文档详情与正文保存相关的请求响应结构体
package dto

import "time"

// DocumentDetailResponseData - 文档详情数据。
type DocumentDetailResponseData struct {
	ID        int64     `json:"id"`
	FolderID  *int64    `json:"folder_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// GetDocumentDetailResponse - 获取文档详情返回数据。
type GetDocumentDetailResponse struct {
	Document DocumentDetailResponseData `json:"document"`
}

// UpdateDocumentContentRequest - 更新文档正文请求体。
type UpdateDocumentContentRequest struct {
	Content string `json:"content"`
}

// UpdateDocumentContentResponse - 更新文档正文返回数据。
type UpdateDocumentContentResponse struct {
	Document DocumentDetailResponseData `json:"document"`
}

// SearchDocumentsRequest - 按关键字搜索文档的请求参数。
type SearchDocumentsRequest struct {
	Keyword  string
	FolderID *int64
	Scope    DocumentSearchScope
}

// DocumentSearchScope - 表示文档搜索的范围。
type DocumentSearchScope string

const (
	// DocumentSearchScopeCurrentFolder - 表示只搜索当前目录。
	DocumentSearchScopeCurrentFolder DocumentSearchScope = "current_folder"
	// DocumentSearchScopeGlobal - 表示搜索当前用户的全部文档。
	DocumentSearchScopeGlobal DocumentSearchScope = "global"
)

// DocumentSearchMatchSource - 文档搜索结果命中来源类型。
type DocumentSearchMatchSource string

const (
	// DocumentSearchMatchSourceTitle - 表示关键字命中了文档标题。
	DocumentSearchMatchSourceTitle DocumentSearchMatchSource = "title"
	// DocumentSearchMatchSourceContent - 表示关键字命中了文档正文。
	DocumentSearchMatchSourceContent DocumentSearchMatchSource = "content"
)

// DocumentSearchSummaryResponse - 文档搜索结果列表项。
type DocumentSearchSummaryResponse struct {
	ID           int64                       `json:"id"`
	FolderID     *int64                      `json:"folder_id"`
	FolderName   string                      `json:"folder_name"`
	Title        string                      `json:"title"`
	Snippet      string                      `json:"snippet"`
	MatchSources []DocumentSearchMatchSource `json:"match_sources"`
	CreatedAt    time.Time                   `json:"created_at"`
	UpdatedAt    time.Time                   `json:"updated_at"`
}

// SearchDocumentsResponse - 文档搜索返回数据。
type SearchDocumentsResponse struct {
	Documents []DocumentSearchSummaryResponse `json:"documents"`
}
