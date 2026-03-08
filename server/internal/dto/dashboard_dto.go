// dashboard_dto.go - 定义首页列表与创建能力相关的请求响应结构体
package dto

import "time"

// FolderSummaryResponse - 首页文件夹列表项
type FolderSummaryResponse struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DocumentSummaryResponse - 首页文档列表项
type DocumentSummaryResponse struct {
	ID        int64     `json:"id"`
	FolderID  *int64    `json:"folder_id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DashboardResponse - 首页接口返回数据
type DashboardResponse struct {
	Folders   []FolderSummaryResponse   `json:"folders"`
	Documents []DocumentSummaryResponse `json:"documents"`
}

// CreateFolderRequest - 新建文件夹请求体
type CreateFolderRequest struct {
	Name string `json:"name" binding:"required,max=64"`
}

// CreateFolderResponse - 新建文件夹返回数据
type CreateFolderResponse struct {
	Folder FolderSummaryResponse `json:"folder"`
}

// CreateDocumentRequest - 新建文档请求体
type CreateDocumentRequest struct {
	FolderID *int64 `json:"folder_id"`
	Title    string `json:"title" binding:"max=120"`
}

// CreateDocumentResponse - 新建文档返回数据
type CreateDocumentResponse struct {
	Document DocumentSummaryResponse `json:"document"`
}
