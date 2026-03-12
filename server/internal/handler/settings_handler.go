// settings_handler.go - 处理设置页 AI Provider 配置读取与更新请求
package handler

import (
	"net/http"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/middleware"
	"github.com/Qindly/markmind/internal/service"
	"github.com/gin-gonic/gin"
)

// SettingsHandler - 设置页请求处理器。
type SettingsHandler struct {
	settingsService service.SettingsServicer
}

// NewSettingsHandler - 创建设置页请求处理器。
// 参数 settingsService: 设置页服务。
// 返回值：设置页请求处理器实例。
func NewSettingsHandler(settingsService service.SettingsServicer) *SettingsHandler {
	return &SettingsHandler{settingsService: settingsService}
}

// GetAISettings - 返回当前用户的 AI Provider 配置摘要。
// 参数 ctx: Gin 请求上下文。
func (handler *SettingsHandler) GetAISettings(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	response, err := handler.settingsService.GetAISettings(ctx.Request.Context(), userID)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

// UpdateAISettings - 更新当前用户的 AI Provider 配置。
// 参数 ctx: Gin 请求上下文。
func (handler *SettingsHandler) UpdateAISettings(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	var request dto.UpdateAISettingsRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.settingsService.UpdateAISettings(ctx.Request.Context(), userID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

// TestAISettings - 测试当前用户填写的 AI Provider 设置是否可用。
// 参数 ctx: Gin 请求上下文。
func (handler *SettingsHandler) TestAISettings(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	var request dto.TestAISettingsRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.settingsService.TestAISettings(ctx.Request.Context(), userID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

// ListAIModels - 拉取当前用户填写的 AI Provider 模型列表。
// 参数 ctx: Gin 请求上下文。
func (handler *SettingsHandler) ListAIModels(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	var request dto.ListAIModelsRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.settingsService.ListAIModels(ctx.Request.Context(), userID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}
