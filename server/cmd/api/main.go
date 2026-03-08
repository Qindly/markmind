// main.go - MarkMind API 服务入口
package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/Qindly/markmind/internal/config"
	"github.com/Qindly/markmind/internal/handler"
	"github.com/Qindly/markmind/internal/middleware"
	"github.com/Qindly/markmind/internal/repository"
	"github.com/Qindly/markmind/internal/service"
	"github.com/Qindly/markmind/internal/util"
	"github.com/gin-gonic/gin"
)

// main - 初始化依赖并启动 HTTP 服务。
// 同时负责处理优雅退出，确保数据库与 Redis 连接能够正常关闭。
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	pool, err := repository.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("初始化 PostgreSQL 连接失败: %v", err)
	}
	defer pool.Close()

	if err := repository.RunMigrations(ctx, pool, "migrations"); err != nil {
		log.Fatalf("执行数据库迁移失败: %v", err)
	}

	redisClient, err := repository.NewRedisClient(ctx, cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Fatalf("初始化 Redis 连接失败: %v", err)
	}
	defer redisClient.Close()

	jwtManager := util.NewJWTManager(cfg.JWTSecret, cfg.AccessTokenTTL)
	userRepository := repository.NewUserRepository(pool)
	folderRepository := repository.NewFolderRepository(pool)
	documentRepository := repository.NewDocumentRepository(pool)
	sessionRepository := repository.NewSessionRepository(redisClient, cfg.RefreshTokenTTL)
	authService := service.NewAuthService(userRepository, sessionRepository, jwtManager, cfg)
	dashboardService := service.NewDashboardService(folderRepository, documentRepository)
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)
	rateLimitMiddleware := middleware.NewRateLimitMiddleware(redisClient, cfg.AuthRateLimitWindow, cfg.AuthRateLimitMaxRequest)
	authHandler := handler.NewAuthHandler(authService, cfg)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)

	if cfg.GinMode == gin.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	}

	router, err := handler.NewRouter(cfg, authHandler, dashboardHandler, authMiddleware, rateLimitMiddleware)
	if err != nil {
		log.Fatalf("初始化路由失败: %v", err)
	}

	server := &http.Server{
		Addr:              ":" + cfg.ServerPort,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("关闭 HTTP 服务失败: %v", err)
		}
	}()

	log.Printf("MarkMind API 启动成功，监听端口 :%s", cfg.ServerPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("启动 HTTP 服务失败: %v", err)
	}
}
