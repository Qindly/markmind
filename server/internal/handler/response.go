// response.go - 统一处理 API 成功与失败响应
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

// WriteSuccess - 按统一格式返回成功响应。
// 参数 ctx: Gin 上下文。
// 参数 status: HTTP 状态码。
// 参数 data: 成功响应的数据体。
func WriteSuccess(ctx *gin.Context, status int, data any) {
	ctx.JSON(status, apiResponse{
		Code:    appconst.SuccessCode,
		Message: "success",
		Data:    data,
	})
}

// WriteError - 按统一格式返回失败响应。
// 参数 ctx: Gin 上下文。
// 参数 status: HTTP 状态码。
// 参数 code: 业务错误码。
// 参数 message: 面向客户端的错误消息。
func WriteError(ctx *gin.Context, status int, code int, message string) {
	ctx.JSON(status, apiResponse{
		Code:    code,
		Message: message,
	})
}

// mapBusinessError - 将业务错误映射为 HTTP 状态码与统一响应内容。
// 参数 err: 业务层返回的错误。
// 返回值依次为 HTTP 状态码、业务错误码、错误消息。
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
	case errors.Is(err, appconst.ErrFolderNameRequired):
		return http.StatusBadRequest, appconst.ErrCodeFolderNameRequired, err.Error()
	case errors.Is(err, appconst.ErrFolderNotFound):
		return http.StatusNotFound, appconst.ErrCodeFolderNotFound, err.Error()
	case errors.Is(err, appconst.ErrDocumentTitleRequired):
		return http.StatusBadRequest, appconst.ErrCodeDocumentTitleRequired, err.Error()
	case errors.Is(err, appconst.ErrDocumentNotFound):
		return http.StatusNotFound, appconst.ErrCodeDocumentNotFound, err.Error()
	case errors.Is(err, appconst.ErrFolderNotEmpty):
		return http.StatusBadRequest, appconst.ErrCodeFolderNotEmpty, err.Error()
	case errors.Is(err, appconst.ErrDocumentRevisionNotFound):
		return http.StatusNotFound, appconst.ErrCodeDocumentRevisionNotFound, err.Error()
	case errors.Is(err, appconst.ErrImageRequired):
		return http.StatusBadRequest, appconst.ErrCodeImageRequired, err.Error()
	case errors.Is(err, appconst.ErrImageTooLarge):
		return http.StatusBadRequest, appconst.ErrCodeImageTooLarge, err.Error()
	case errors.Is(err, appconst.ErrUnsupportedImageType):
		return http.StatusBadRequest, appconst.ErrCodeUnsupportedImageType, err.Error()
	case errors.Is(err, appconst.ErrAIProviderBaseURLRequired):
		return http.StatusBadRequest, appconst.ErrCodeAIProviderBaseURLRequired, err.Error()
	case errors.Is(err, appconst.ErrAIProviderAPIKeyRequired):
		return http.StatusBadRequest, appconst.ErrCodeAIProviderAPIKeyRequired, err.Error()
	case errors.Is(err, appconst.ErrAIProviderModelRequired):
		return http.StatusBadRequest, appconst.ErrCodeAIProviderModelRequired, err.Error()
	case errors.Is(err, appconst.ErrAIProviderNotConfigured):
		return http.StatusBadRequest, appconst.ErrCodeAIProviderNotConfigured, err.Error()
	case errors.Is(err, appconst.ErrAIInstructionRequired):
		return http.StatusBadRequest, appconst.ErrCodeAIInstructionRequired, err.Error()
	case errors.Is(err, appconst.ErrInvalidCredentials):
		return http.StatusUnauthorized, appconst.ErrCodeInvalidCredentials, err.Error()
	case errors.Is(err, appconst.ErrUnauthorized):
		return http.StatusUnauthorized, appconst.ErrCodeUnauthorized, err.Error()
	case errors.Is(err, appconst.ErrInvalidRefreshToken):
		return http.StatusUnauthorized, appconst.ErrCodeInvalidRefreshToken, err.Error()
	case errors.Is(err, appconst.ErrRateLimitExceeded):
		return http.StatusTooManyRequests, appconst.ErrCodeTooManyRequests, err.Error()
	case errors.Is(err, appconst.ErrAIRequestFailed):
		return http.StatusBadGateway, appconst.ErrCodeAIRequestFailed, err.Error()
	case errors.Is(err, appconst.ErrAIInvalidResponse):
		return http.StatusBadGateway, appconst.ErrCodeAIInvalidResponse, err.Error()
	default:
		return http.StatusInternalServerError, appconst.ErrCodeInternalServer, "服务器内部错误"
	}
}
