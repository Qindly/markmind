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

// SearchDocumentsRequest - 按关键字搜索当前目录文档的请求参数。
type SearchDocumentsRequest struct {
	Keyword  string
	FolderID *int64
}

// SearchDocumentsResponse - 文档搜索返回数据。
type SearchDocumentsResponse struct {
	Documents []DocumentSummaryResponse `json:"documents"`
}
