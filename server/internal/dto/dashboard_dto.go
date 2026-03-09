// dashboard_dto.go - 定义首页列表与文件夹/文档操作相关的请求响应结构体
package dto

import "time"

// FolderSummaryResponse - 首页文件夹列表项。
type FolderSummaryResponse struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DocumentSummaryResponse - 首页文档列表项。
type DocumentSummaryResponse struct {
	ID        int64     `json:"id"`
	FolderID  *int64    `json:"folder_id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DashboardResponse - 首页接口返回数据。
type DashboardResponse struct {
	Folders   []FolderSummaryResponse   `json:"folders"`
	Documents []DocumentSummaryResponse `json:"documents"`
}

// CreateFolderRequest - 新建文件夹请求体。
type CreateFolderRequest struct {
	Name string `json:"name" binding:"required,max=64"`
}

// CreateFolderResponse - 新建文件夹返回数据。
type CreateFolderResponse struct {
	Folder FolderSummaryResponse `json:"folder"`
}

// UpdateFolderRequest - 更新文件夹名称请求体。
type UpdateFolderRequest struct {
	Name string `json:"name" binding:"required,max=64"`
}

// UpdateFolderResponse - 更新文件夹返回数据。
type UpdateFolderResponse struct {
	Folder FolderSummaryResponse `json:"folder"`
}

// DeleteFolderResponse - 删除文件夹返回数据。
type DeleteFolderResponse struct {
	DeletedID int64 `json:"deleted_id"`
}

// CreateDocumentRequest - 新建文档请求体。
type CreateDocumentRequest struct {
	FolderID *int64 `json:"folder_id"`
	Title    string `json:"title" binding:"max=120"`
}

// CreateDocumentResponse - 新建文档返回数据。
type CreateDocumentResponse struct {
	Document DocumentSummaryResponse `json:"document"`
}

// UpdateDocumentRequest - 更新文档标题请求体。
type UpdateDocumentRequest struct {
	Title string `json:"title" binding:"required,max=120"`
}

// UpdateDocumentResponse - 更新文档返回数据。
type UpdateDocumentResponse struct {
	Document DocumentSummaryResponse `json:"document"`
}

// DeleteDocumentResponse - 删除文档返回数据。
type DeleteDocumentResponse struct {
	DeletedID int64 `json:"deleted_id"`
}
