// rate_limit_middleware.go - 基于 Redis 的登录鉴权限流中间件
package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimitMiddleware - 封装基于 Redis 的固定窗口限流能力。
type RateLimitMiddleware struct {
	redisClient *redis.Client
	window      time.Duration
	maxRequests int
}

// NewRateLimitMiddleware - 创建限流中间件实例。
// 参数 redisClient: Redis 客户端。
// 参数 window: 限流窗口时长。
// 参数 maxRequests: 窗口内允许的最大请求次数。
// 返回值为初始化完成的限流中间件。
func NewRateLimitMiddleware(redisClient *redis.Client, window time.Duration, maxRequests int) *RateLimitMiddleware {
	return &RateLimitMiddleware{
		redisClient: redisClient,
		window:      window,
		maxRequests: maxRequests,
	}
}

// Limit - 返回指定动作的限流中间件。
// 参数 action: 业务动作名称，用于参与 Redis Key 组装。
// 返回值为 Gin 中间件函数。
func (middleware *RateLimitMiddleware) Limit(action string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clientIP := strings.TrimSpace(ctx.ClientIP())
		if clientIP == "" {
			clientIP = "unknown"
		}

		key := fmt.Sprintf("markmind:auth_rate_limit:%s:%s", strings.ToLower(action), clientIP)
		count, err := middleware.redisClient.Incr(ctx.Request.Context(), key).Result()
		if err != nil {
			// Redis 异常时优先保障主流程可用，避免鉴权入口整体不可访问。
			ctx.Next()
			return
		}

		if count == 1 {
			_ = middleware.redisClient.Expire(ctx.Request.Context(), key, middleware.window).Err()
		}

		if count > int64(middleware.maxRequests) {
			ctx.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"code":    appconst.ErrCodeTooManyRequests,
				"message": appconst.ErrRateLimitExceeded.Error(),
			})
			return
		}

		ctx.Next()
	}
}
