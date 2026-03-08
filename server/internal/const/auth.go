// auth.go - 定义鉴权模块错误码与业务错误
package appconst

import "errors"

const (
	// SuccessCode - 通用成功业务码
	SuccessCode = 0

	// ErrCodeInvalidParams - 请求参数不合法
	ErrCodeInvalidParams = 40001
	// ErrCodeUsernameExists - 用户名已存在
	ErrCodeUsernameExists = 40002
	// ErrCodeEmailExists - 邮箱已存在
	ErrCodeEmailExists = 40003
	// ErrCodePasswordMismatch - 两次密码输入不一致
	ErrCodePasswordMismatch = 40004

	// ErrCodeUnauthorized - 未登录或访问令牌无效
	ErrCodeUnauthorized = 40101
	// ErrCodeInvalidCredentials - 账号或密码错误
	ErrCodeInvalidCredentials = 40102
	// ErrCodeInvalidRefreshToken - 刷新令牌无效或已过期
	ErrCodeInvalidRefreshToken = 40103

	// ErrCodeInternalServer - 服务内部异常
	ErrCodeInternalServer = 50001
)

var (
	// ErrInvalidParams - 参数校验失败
	ErrInvalidParams = errors.New("请求参数不合法")
	// ErrUsernameExists - 用户名已存在
	ErrUsernameExists = errors.New("用户名已存在")
	// ErrEmailExists - 邮箱已存在
	ErrEmailExists = errors.New("邮箱已存在")
	// ErrPasswordMismatch - 两次密码输入不一致
	ErrPasswordMismatch = errors.New("两次密码输入不一致")
	// ErrInvalidCredentials - 账号或密码错误
	ErrInvalidCredentials = errors.New("账号或密码错误")
	// ErrUnauthorized - 当前请求未通过鉴权
	ErrUnauthorized = errors.New("未登录或登录状态已失效")
	// ErrInvalidRefreshToken - 刷新令牌不可用
	ErrInvalidRefreshToken = errors.New("刷新令牌无效或已过期")
)
