// dashboard_handler.go - 处理首页列表与文件夹/文档管理请求
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

// DashboardHandler - 首页业务请求处理器。
type DashboardHandler struct {
	dashboardService service.DashboardServicer
}

// NewDashboardHandler - 创建首页业务处理器。
// 参数 dashboardService: 首页业务服务。
// 返回值：首页业务处理器实例。
func NewDashboardHandler(dashboardService service.DashboardServicer) *DashboardHandler {
	return &DashboardHandler{dashboardService: dashboardService}
}

// GetDashboard - 返回当前用户首页所需的文件夹与文档列表。
// 参数 ctx: Gin 请求上下文。
func (handler *DashboardHandler) GetDashboard(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	response, err := handler.dashboardService.GetDashboard(ctx.Request.Context(), userID)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

// CreateFolder - 创建当前用户的新文件夹。
// 参数 ctx: Gin 请求上下文。
func (handler *DashboardHandler) CreateFolder(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	var request dto.CreateFolderRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.dashboardService.CreateFolder(ctx.Request.Context(), userID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusCreated, response)
}

// UpdateFolder - 修改当前用户的文件夹名称。
// 参数 ctx: Gin 请求上下文。
func (handler *DashboardHandler) UpdateFolder(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	folderID, ok := parseEntityID(ctx)
	if !ok {
		return
	}

	var request dto.UpdateFolderRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.dashboardService.UpdateFolder(ctx.Request.Context(), userID, folderID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

// DeleteFolder - 删除当前用户的文件夹。
// 参数 ctx: Gin 请求上下文。
func (handler *DashboardHandler) DeleteFolder(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	folderID, ok := parseEntityID(ctx)
	if !ok {
		return
	}

	response, err := handler.dashboardService.DeleteFolder(ctx.Request.Context(), userID, folderID)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

// CreateDocument - 在当前目录下创建空文档。
// 参数 ctx: Gin 请求上下文。
func (handler *DashboardHandler) CreateDocument(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	var request dto.CreateDocumentRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.dashboardService.CreateDocument(ctx.Request.Context(), userID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusCreated, response)
}

// UpdateDocument - 修改当前用户的文档标题或归类。
// 参数 ctx: Gin 请求上下文。
func (handler *DashboardHandler) UpdateDocument(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	documentID, ok := parseEntityID(ctx)
	if !ok {
		return
	}

	var request dto.UpdateDocumentRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.dashboardService.UpdateDocument(ctx.Request.Context(), userID, documentID, request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

// DeleteDocument - 删除当前用户的文档。
// 参数 ctx: Gin 请求上下文。
func (handler *DashboardHandler) DeleteDocument(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	documentID, ok := parseEntityID(ctx)
	if !ok {
		return
	}

	response, err := handler.dashboardService.DeleteDocument(ctx.Request.Context(), userID, documentID)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, response)
}

func parseEntityID(ctx *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return 0, false
	}

	return id, true
}
