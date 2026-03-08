// router.go - 负责初始化 API 路由与中间件
package handler

import (
	"fmt"
	"net/http"

	"github.com/Qindly/markmind/internal/config"
	"github.com/Qindly/markmind/internal/middleware"
	"github.com/gin-gonic/gin"
)

// NewRouter - 创建并配置 Gin 路由实例。
// 参数 cfg: 服务端运行配置。
// 参数 authHandler: 鉴权处理器。
// 参数 authMiddleware: 鉴权中间件。
// 参数 rateLimitMiddleware: 限流中间件。
// 返回值为配置完成的 Gin 引擎与可能出现的错误。
func NewRouter(
	cfg config.Config,
	authHandler *AuthHandler,
	authMiddleware *middleware.AuthMiddleware,
	rateLimitMiddleware *middleware.RateLimitMiddleware,
) (*gin.Engine, error) {
	router := gin.New()
	if err := router.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		return nil, fmt.Errorf("配置 Gin 受信任代理失败: %w", err)
	}

	router.Use(gin.Logger(), gin.Recovery(), middleware.CORSMiddleware(cfg))

	router.GET("/healthz", func(ctx *gin.Context) {
		WriteSuccess(ctx, http.StatusOK, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1")
	auth := api.Group("/auth")
	{
		auth.POST("/register", rateLimitMiddleware.Limit("register"), authHandler.Register)
		auth.POST("/login", rateLimitMiddleware.Limit("login"), authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/me", authMiddleware.RequireAuth(), authHandler.Me)
	}

	return router, nil
}
