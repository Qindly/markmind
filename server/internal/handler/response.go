// response.go - 统一封装 API 成功与失败响应
package handler

import (
	"errors"
	"net/http"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/gin-gonic/gin"
)

type apiResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

// WriteSuccess - 输出统一成功响应
// 参数 ctx: Gin 请求上下文
// 参数 status: HTTP 状态码
// 参数 data: 返回数据体
// 返回值：无
func WriteSuccess(ctx *gin.Context, status int, data any) {
	ctx.JSON(status, apiResponse{
		Code:    appconst.SuccessCode,
		Message: "success",
		Data:    data,
	})
}

// WriteError - 输出统一失败响应
// 参数 ctx: Gin 请求上下文
// 参数 status: HTTP 状态码
// 参数 code: 业务错误码
// 参数 message: 错误文案
// 返回值：无
func WriteError(ctx *gin.Context, status int, code int, message string) {
	ctx.JSON(status, apiResponse{
		Code:    code,
		Message: message,
	})
}

func mapBusinessError(err error) (int, int, string) {
	switch {
	case errors.Is(err, appconst.ErrInvalidParams):
		return http.StatusBadRequest, appconst.ErrCodeInvalidParams, err.Error()
	case errors.Is(err, appconst.ErrUsernameExists):
		return http.StatusBadRequest, appconst.ErrCodeUsernameExists, err.Error()
	case errors.Is(err, appconst.ErrEmailExists):
		return http.StatusBadRequest, appconst.ErrCodeEmailExists, err.Error()
	case errors.Is(err, appconst.ErrPasswordMismatch):
		return http.StatusBadRequest, appconst.ErrCodePasswordMismatch, err.Error()
	case errors.Is(err, appconst.ErrInvalidCredentials):
		return http.StatusUnauthorized, appconst.ErrCodeInvalidCredentials, err.Error()
	case errors.Is(err, appconst.ErrUnauthorized):
		return http.StatusUnauthorized, appconst.ErrCodeUnauthorized, err.Error()
	case errors.Is(err, appconst.ErrInvalidRefreshToken):
		return http.StatusUnauthorized, appconst.ErrCodeInvalidRefreshToken, err.Error()
	default:
		return http.StatusInternalServerError, appconst.ErrCodeInternalServer, "服务器开小差了，请稍后再试"
	}
}
