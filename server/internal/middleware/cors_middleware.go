// cors_middleware.go - 配置前后端分离场景下的跨域响应头
package middleware

import (
	"net/http"

	"github.com/Qindly/markmind/internal/config"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware - 返回 Gin 跨域中间件
// 参数 cfg: 应用配置
// 返回值：Gin 中间件函数
func CORSMiddleware(cfg config.Config) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.Header("Access-Control-Allow-Origin", cfg.FrontendOrigin)
		ctx.Header("Vary", "Origin")
		ctx.Header("Access-Control-Allow-Credentials", "true")
		ctx.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		ctx.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

		if ctx.Request.Method == http.MethodOptions {
			ctx.AbortWithStatus(http.StatusNoContent)
			return
		}

		ctx.Next()
	}
}
