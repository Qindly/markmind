// auth_handler.go - 处理注册登录刷新登出与当前用户查询请求
package handler

import (
	"net/http"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/config"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/middleware"
	"github.com/Qindly/markmind/internal/service"
	"github.com/Qindly/markmind/internal/util"
	"github.com/gin-gonic/gin"
)

// AuthHandler - 鉴权请求处理器
type AuthHandler struct {
	authService service.AuthServicer
	config      config.Config
}

// NewAuthHandler - 创建鉴权处理器
// 参数 authService: 鉴权服务
// 参数 cfg: 应用配置
// 返回值：鉴权处理器实例
func NewAuthHandler(authService service.AuthServicer, cfg config.Config) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		config:      cfg,
	}
}

// Register - 处理用户注册请求
// 参数 ctx: Gin 请求上下文
// 返回值：无
func (handler *AuthHandler) Register(ctx *gin.Context) {
	var request dto.RegisterRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	response, err := handler.authService.Register(ctx.Request.Context(), request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusCreated, response)
}

// Login - 处理用户登录请求
// 参数 ctx: Gin 请求上下文
// 返回值：无
func (handler *AuthHandler) Login(ctx *gin.Context) {
	var request dto.LoginRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		WriteError(ctx, http.StatusBadRequest, appconst.ErrCodeInvalidParams, appconst.ErrInvalidParams.Error())
		return
	}

	session, err := handler.authService.Login(ctx.Request.Context(), request)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	util.SetRefreshTokenCookie(ctx, handler.config, session.RefreshToken)
	WriteSuccess(ctx, http.StatusOK, dto.AuthSessionResponse{
		AccessToken: session.AccessToken,
		User:        session.User,
	})
}

// Refresh - 处理 Access Token 刷新请求
// 参数 ctx: Gin 请求上下文
// 返回值：无
func (handler *AuthHandler) Refresh(ctx *gin.Context) {
	refreshToken, err := ctx.Cookie(handler.config.RefreshCookieName)
	if err != nil {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeInvalidRefreshToken, appconst.ErrInvalidRefreshToken.Error())
		return
	}

	session, err := handler.authService.RefreshSession(ctx.Request.Context(), refreshToken)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	util.SetRefreshTokenCookie(ctx, handler.config, session.RefreshToken)
	WriteSuccess(ctx, http.StatusOK, dto.AuthSessionResponse{
		AccessToken: session.AccessToken,
		User:        session.User,
	})
}

// Logout - 处理用户登出请求
// 参数 ctx: Gin 请求上下文
// 返回值：无
func (handler *AuthHandler) Logout(ctx *gin.Context) {
	refreshToken, _ := ctx.Cookie(handler.config.RefreshCookieName)
	if err := handler.authService.Logout(ctx.Request.Context(), refreshToken); err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	util.ClearRefreshTokenCookie(ctx, handler.config)
	WriteSuccess(ctx, http.StatusOK, gin.H{"logged_out": true})
}

// Me - 返回当前登录用户信息
// 参数 ctx: Gin 请求上下文
// 返回值：无
func (handler *AuthHandler) Me(ctx *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(ctx)
	if !exists {
		WriteError(ctx, http.StatusUnauthorized, appconst.ErrCodeUnauthorized, appconst.ErrUnauthorized.Error())
		return
	}

	user, err := handler.authService.GetCurrentUser(ctx.Request.Context(), userID)
	if err != nil {
		status, code, message := mapBusinessError(err)
		WriteError(ctx, status, code, message)
		return
	}

	WriteSuccess(ctx, http.StatusOK, gin.H{"user": user})
}
