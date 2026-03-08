// auth_dto.go - 定义鉴权相关请求与响应结构体
package dto

import "time"

// RegisterRequest - 用户注册请求体
type RegisterRequest struct {
	Username        string `json:"username" binding:"required,min=3,max=32"`
	Email           string `json:"email" binding:"required,email,max=128"`
	Password        string `json:"password" binding:"required,min=8,max=72"`
	ConfirmPassword string `json:"confirm_password" binding:"required,min=8,max=72"`
}

// LoginRequest - 用户登录请求体
type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required,min=3,max=128"`
	Password   string `json:"password" binding:"required,min=8,max=72"`
}

// UserProfileResponse - 当前登录用户信息
type UserProfileResponse struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// RegisterResponse - 注册成功后的返回数据
type RegisterResponse struct {
	User UserProfileResponse `json:"user"`
}

// AuthSessionResponse - 登录与刷新成功后的返回数据
type AuthSessionResponse struct {
	AccessToken string              `json:"access_token"`
	User        UserProfileResponse `json:"user"`
}

// AuthSession - 业务层内部使用的会话结果
type AuthSession struct {
	AccessToken  string
	RefreshToken string
	User         UserProfileResponse
}
