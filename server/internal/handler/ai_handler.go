// ai_handler.go - 处理编辑器局部 AI 能力请求
package handler

import (
	"encoding/json"
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

// MagicEditStream - 处理魔法笔局部改写流式请求。
// 参数 ctx: Gin 请求上下文。
func (handler *AIHandler) MagicEditStream(ctx *gin.Context) {
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

	prepareSSEStream(ctx)
	response, err := handler.aiService.MagicEditStream(ctx.Request.Context(), userID, request, func(delta string) error {
		return writeSSEEvent(ctx, "chunk", dto.AIStreamChunkResponse{Delta: delta})
	})
	if err != nil {
		if ctx.Request.Context().Err() != nil {
			return
		}

		_, _, message := mapBusinessError(err)
		_ = writeSSEEvent(ctx, "error", dto.AIStreamErrorResponse{Message: message})
		return
	}

	_ = writeSSEEvent(ctx, "done", response)
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

// TranslateStream - 处理局部翻译流式请求。
// 参数 ctx: Gin 请求上下文。
func (handler *AIHandler) TranslateStream(ctx *gin.Context) {
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

	prepareSSEStream(ctx)
	response, err := handler.aiService.TranslateStream(ctx.Request.Context(), userID, request, func(delta string) error {
		return writeSSEEvent(ctx, "chunk", dto.AIStreamChunkResponse{Delta: delta})
	})
	if err != nil {
		if ctx.Request.Context().Err() != nil {
			return
		}

		_, _, message := mapBusinessError(err)
		_ = writeSSEEvent(ctx, "error", dto.AIStreamErrorResponse{Message: message})
		return
	}

	_ = writeSSEEvent(ctx, "done", response)
}

func prepareSSEStream(ctx *gin.Context) {
	ctx.Header("Content-Type", "text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")
	ctx.Header("X-Accel-Buffering", "no")
	ctx.Status(http.StatusOK)
	ctx.Writer.Flush()
}

func writeSSEEvent(ctx *gin.Context, eventName string, payload any) error {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	if _, err := ctx.Writer.WriteString("event: " + eventName + "\n"); err != nil {
		return err
	}

	if _, err := ctx.Writer.WriteString("data: " + string(payloadBytes) + "\n\n"); err != nil {
		return err
	}

	ctx.Writer.Flush()
	return nil
}
