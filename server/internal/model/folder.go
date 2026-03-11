// folder.go - 定义 folders 表对应的数据模型
package model

import "time"

// Folder - 文件夹表数据模型
type Folder struct {
	ID        int64
	UserID    int64
	Name      string
	CreatedAt time.Time
	UpdatedAt time.Time
}
