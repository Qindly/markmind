// response.go - ???? API ???????
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

// WriteSuccess - ????????
// ?? ctx: Gin ?????
// ?? status: HTTP ???
// ?? data: ?????
// ?????
func WriteSuccess(ctx *gin.Context, status int, data any) {
	ctx.JSON(status, apiResponse{
		Code:    appconst.SuccessCode,
		Message: "success",
		Data:    data,
	})
}

// WriteError - ????????
// ?? ctx: Gin ?????
// ?? status: HTTP ???
// ?? code: ?????
// ?? message: ????
// ?????
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
	case errors.Is(err, appconst.ErrRateLimitExceeded):
		return http.StatusTooManyRequests, appconst.ErrCodeTooManyRequests, err.Error()
	default:
		return http.StatusInternalServerError, appconst.ErrCodeInternalServer, "?????????????"
	}
}
