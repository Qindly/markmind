// document.go - 定义 documents 表对应的数据模型
package model

import "time"

// Document - 文档表数据模型
type Document struct {
	ID        int64
	UserID    int64
	FolderID  *int64
	Title     string
	Content   string
	CreatedAt time.Time
	UpdatedAt time.Time
}
