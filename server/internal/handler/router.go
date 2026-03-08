// router.go - 注册 API 路由与通用中间件
package handler

import (
	"net/http"

	"github.com/Qindly/markmind/internal/config"
	"github.com/Qindly/markmind/internal/middleware"
	"github.com/gin-gonic/gin"
)

// NewRouter - 构建 Gin 路由树
// 参数 cfg: 应用配置
// 参数 authHandler: 鉴权处理器
// 参数 authMiddleware: 鉴权中间件
// 返回值：配置完成的 Gin 引擎
func NewRouter(cfg config.Config, authHandler *AuthHandler, authMiddleware *middleware.AuthMiddleware) *gin.Engine {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), middleware.CORSMiddleware(cfg))

	router.GET("/healthz", func(ctx *gin.Context) {
		WriteSuccess(ctx, http.StatusOK, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1")
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/me", authMiddleware.RequireAuth(), authHandler.Me)
	}

	return router
}
