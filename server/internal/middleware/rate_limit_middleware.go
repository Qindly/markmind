// rate_limit_middleware.go - ????????? Redis ????
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

// RateLimitMiddleware - ?? Redis ????????
type RateLimitMiddleware struct {
	redisClient *redis.Client
	window      time.Duration
	maxRequests int
}

// NewRateLimitMiddleware - ?????????
// ?? redisClient: Redis ???
// ?? window: ??????
// ?? maxRequests: ????????????
// ???????????
func NewRateLimitMiddleware(redisClient *redis.Client, window time.Duration, maxRequests int) *RateLimitMiddleware {
	return &RateLimitMiddleware{
		redisClient: redisClient,
		window:      window,
		maxRequests: maxRequests,
	}
}

// Limit - ????????????
// ?? action: ????????
// ????Gin ?????
func (middleware *RateLimitMiddleware) Limit(action string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		clientIP := strings.TrimSpace(ctx.ClientIP())
		if clientIP == "" {
			clientIP = "unknown"
		}

		key := fmt.Sprintf("markmind:auth_rate_limit:%s:%s", strings.ToLower(action), clientIP)
		count, err := middleware.redisClient.Incr(ctx.Request.Context(), key).Result()
		if err != nil {
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
