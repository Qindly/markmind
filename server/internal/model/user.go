// user.go - 定义 users 表对应的数据模型
package model

import "time"

// User - 用户表数据模型
type User struct {
	ID           int64
	Username     string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
