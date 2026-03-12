// ai_handler.go - 处理编辑器局部 AI 能力请求
package handler

import (
	"net/http"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/middleware"
	"github.com/Qindly/markmind/internal/service"
	"github.com/gin-gonic/gin"
)

// AIHandler - 编辑器局部 AI 能力请求处理器。
type AIHandler struct {
	aiService service.AIServicer
}

// NewAIHandler - 创建编辑器局部 AI 能力请求处理器。
// 参数 aiService: AI 服务。
// 返回值：AI 请求处理器实例。
func NewAIHandler(aiService service.AIServicer) *AIHandler {
	return &AIHandler{aiService: aiService}
}

// MagicEdit - 处理魔法笔局部改写请求。
// 参数 ctx: Gin 请求上下文。
func (handler *AIHandler) MagicEdit(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	var request dto.MagicEditRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.aiService.MagicEdit(ctx.Request.Context(), userID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

// Translate - 处理局部翻译请求。
// 参数 ctx: Gin 请求上下文。
func (handler *AIHandler) Translate(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	var request dto.TranslateRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.aiService.Translate(ctx.Request.Context(), userID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}
