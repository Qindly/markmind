// dashboard_dto.go - 定义首页列表与文件夹/文档操作相关的请求响应结构体
package dto

import (
	"bytes"
	"encoding/json"
	"time"
)

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

// NullableFolderIDInput - 表示可区分“不传”和“显式传 null”的 folder_id 输入。
type NullableFolderIDInput struct {
	Set   bool
	Value *int64
}

// UnmarshalJSON - 解析 folder_id，区分字段缺失、显式 null 和具体数值。
// 参数 data: 原始 JSON 片段。
// 返回值：解析错误。
func (input *NullableFolderIDInput) UnmarshalJSON(data []byte) error {
	input.Set = true

	trimmedData := bytes.TrimSpace(data)
	if bytes.Equal(trimmedData, []byte("null")) {
		input.Value = nil
		return nil
	}

	var folderID int64
	if err := json.Unmarshal(trimmedData, &folderID); err != nil {
		return err
	}

	input.Value = &folderID
	return nil
}

// UpdateDocumentRequest - 更新文档标题或归类请求体。
type UpdateDocumentRequest struct {
	Title    *string               `json:"title" binding:"omitempty,max=120"`
	FolderID NullableFolderIDInput `json:"folder_id"`
}

// UpdateDocumentResponse - 更新文档返回数据。
type UpdateDocumentResponse struct {
	Document DocumentSummaryResponse `json:"document"`
}

// DeleteDocumentResponse - 删除文档返回数据。
type DeleteDocumentResponse struct {
	DeletedID int64 `json:"deleted_id"`
}
