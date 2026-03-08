// auth.go - 鉴权模块的业务错误码与错误定义
package appconst

import "errors"

const (
	// SuccessCode - 成功响应的业务状态码。
	SuccessCode = 0

	// ErrCodeInvalidParams - 请求参数无效。
	ErrCodeInvalidParams = 40001
	// ErrCodeUsernameExists - 用户名已存在。
	ErrCodeUsernameExists = 40002
	// ErrCodeEmailExists - 邮箱已存在。
	ErrCodeEmailExists = 40003
	// ErrCodePasswordMismatch - 两次输入的密码不一致。
	ErrCodePasswordMismatch = 40004

	// ErrCodeUnauthorized - 未登录或身份无效。
	ErrCodeUnauthorized = 40101
	// ErrCodeInvalidCredentials - 账号或密码错误。
	ErrCodeInvalidCredentials = 40102
	// ErrCodeInvalidRefreshToken - 刷新令牌无效或已过期。
	ErrCodeInvalidRefreshToken = 40103
	// ErrCodeTooManyRequests - 请求过于频繁。
	ErrCodeTooManyRequests = 42901

	// ErrCodeInternalServer - 服务器内部错误。
	ErrCodeInternalServer = 50001
)

var (
	// ErrInvalidParams - 请求参数不合法。
	ErrInvalidParams = errors.New("无效的请求参数")
	// ErrUsernameExists - 用户名已存在。
	ErrUsernameExists = errors.New("用户名已存在")
	// ErrEmailExists - 邮箱已存在。
	ErrEmailExists = errors.New("邮箱已存在")
	// ErrPasswordMismatch - 两次输入的密码不一致。
	ErrPasswordMismatch = errors.New("两次输入的密码不一致")
	// ErrInvalidCredentials - 登录凭证无效。
	ErrInvalidCredentials = errors.New("账号或密码错误")
	// ErrUnauthorized - 当前请求未通过身份校验。
	ErrUnauthorized = errors.New("未授权或身份无效")
	// ErrInvalidRefreshToken - 刷新令牌不可用。
	ErrInvalidRefreshToken = errors.New("无效的刷新令牌")
	// ErrRateLimitExceeded - 超出限流阈值。
	ErrRateLimitExceeded = errors.New("请求过于频繁")
)
