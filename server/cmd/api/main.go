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

// main - 初始化依赖并启动 HTTP 服务
// 返回值：无，服务异常退出时直接终止进程
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg := config.Load()

	pool, err := repository.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("初始化 PostgreSQL 失败: %v", err)
	}
	defer pool.Close()

	if err := repository.RunMigrations(ctx, pool, "migrations"); err != nil {
		log.Fatalf("执行数据库迁移失败: %v", err)
	}

	redisClient, err := repository.NewRedisClient(ctx, cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Fatalf("初始化 Redis 失败: %v", err)
	}
	defer redisClient.Close()

	jwtManager := util.NewJWTManager(cfg.JWTSecret, cfg.AccessTokenTTL)
	userRepository := repository.NewUserRepository(pool)
	sessionRepository := repository.NewSessionRepository(redisClient, cfg.RefreshTokenTTL)
	authService := service.NewAuthService(userRepository, sessionRepository, jwtManager, cfg)
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)
	authHandler := handler.NewAuthHandler(authService, cfg)

	if cfg.GinMode == gin.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	}

	router := handler.NewRouter(cfg, authHandler, authMiddleware)
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

	log.Printf("MarkMind API 正在监听 :%s", cfg.ServerPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("启动 HTTP 服务失败: %v", err)
	}
}
