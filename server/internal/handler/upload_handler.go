// upload_handler.go - 处理编辑器图片上传请求
package handler

import (
	"errors"
	"net/http"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/middleware"
	"github.com/Qindly/markmind/internal/service"
	"github.com/gin-gonic/gin"
)

const maxMultipartUploadSize = appconst.MaxImageUploadSize + 2*1024*1024

// UploadHandler - 图片上传请求处理器。
type UploadHandler struct {
	uploadService service.UploadServicer
}

// NewUploadHandler - 创建图片上传请求处理器。
// 参数 uploadService: 图片上传服务。
// 返回值：图片上传处理器实例。
func NewUploadHandler(uploadService service.UploadServicer) *UploadHandler {
	return &UploadHandler{uploadService: uploadService}
}

// UploadImage - 上传编辑器中粘贴的图片文件。
// 参数 ctx: Gin 请求上下文。
func (handler *UploadHandler) UploadImage(ctx *gin.Context) {
	_, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	ctx.Request.Body = http.MaxBytesReader(ctx.Writer, ctx.Request.Body, maxMultipartUploadSize)
	fileHeader, err := ctx.FormFile("image")
	if err != nil {
		var maxBytesError *http.MaxBytesError
		if errors.As(err, &maxBytesError) {
			status, code, message := mapBusinessError(appconst.ErrImageTooLarge)
			WriteError(ctx, status, code, message)
			return
		}

		status, code, message := mapBusinessError(appconst.ErrImageRequired)
		WriteError(ctx, status, code, message)
		return
	}

	response, err := handler.uploadService.UploadImage(ctx.Request.Context(), fileHeader)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusCreated, response)
}
