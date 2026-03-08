// router.go - ?? API ????????
package handler

import (
	"net/http"

	"github.com/Qindly/markmind/internal/config"
	"github.com/Qindly/markmind/internal/middleware"
	"github.com/gin-gonic/gin"
)

// NewRouter - ?? Gin ???
// ?? cfg: ????
// ?? authHandler: ?????
// ?? authMiddleware: ?????
// ?? rateLimitMiddleware: ???????
// ????????? Gin ??
func NewRouter(
	cfg config.Config,
	authHandler *AuthHandler,
	authMiddleware *middleware.AuthMiddleware,
	rateLimitMiddleware *middleware.RateLimitMiddleware,
) *gin.Engine {
	router := gin.New()
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

	return router
}
