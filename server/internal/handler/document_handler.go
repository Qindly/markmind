// document_handler.go - 处理文档详情查询与正文保存请求
package handler

import (
	"net/http"
	"strconv"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/middleware"
	"github.com/Qindly/markmind/internal/service"
	"github.com/gin-gonic/gin"
)

// DocumentHandler - 文档详情与正文编辑请求处理器。
type DocumentHandler struct {
	documentService service.DocumentServicer
}

// NewDocumentHandler - 创建文档详情与正文编辑请求处理器。
// 参数 documentService: 文档服务。
// 返回值：文档请求处理器实例。
func NewDocumentHandler(documentService service.DocumentServicer) *DocumentHandler {
	return &DocumentHandler{documentService: documentService}
}

// GetDocumentDetail - 返回当前用户的文档详情。
// 参数 ctx: Gin 请求上下文。
func (handler *DocumentHandler) GetDocumentDetail(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	documentID, ok := parseDocumentID(ctx)
	if !ok {
		return
	}

	response, err := handler.documentService.GetDocumentDetail(ctx.Request.Context(), userID, documentID)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

// UpdateDocumentContent - 保存当前用户的文档正文内容。
// 参数 ctx: Gin 请求上下文。
func (handler *DocumentHandler) UpdateDocumentContent(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	documentID, ok := parseDocumentID(ctx)
	if !ok {
		return
	}

	var request dto.UpdateDocumentContentRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.documentService.UpdateDocumentContent(ctx.Request.Context(), userID, documentID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

func parseDocumentID(ctx *gin.Context) (int64, bool) {
	documentID, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil || documentID <= 0 {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return 0, false
	}

	return documentID, true
}
