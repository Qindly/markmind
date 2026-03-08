// main.go - MarkMind API ????
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

// main - ???????? HTTP ??
// ???????????????????
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("????????: %v", err)
	}

	pool, err := repository.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("??? PostgreSQL ??: %v", err)
	}
	defer pool.Close()

	if err := repository.RunMigrations(ctx, pool, "migrations"); err != nil {
		log.Fatalf("?????????: %v", err)
	}

	redisClient, err := repository.NewRedisClient(ctx, cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Fatalf("??? Redis ??: %v", err)
	}
	defer redisClient.Close()

	jwtManager := util.NewJWTManager(cfg.JWTSecret, cfg.AccessTokenTTL)
	userRepository := repository.NewUserRepository(pool)
	sessionRepository := repository.NewSessionRepository(redisClient, cfg.RefreshTokenTTL)
	authService := service.NewAuthService(userRepository, sessionRepository, jwtManager, cfg)
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)
	rateLimitMiddleware := middleware.NewRateLimitMiddleware(redisClient, cfg.AuthRateLimitWindow, cfg.AuthRateLimitMaxRequest)
	authHandler := handler.NewAuthHandler(authService, cfg)

	if cfg.GinMode == gin.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	}

	router := handler.NewRouter(cfg, authHandler, authMiddleware, rateLimitMiddleware)
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
			log.Printf("?? HTTP ????: %v", err)
		}
	}()

	log.Printf("MarkMind API ???? :%s", cfg.ServerPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("?? HTTP ????: %v", err)
	}
}
