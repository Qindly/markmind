// auth_middleware.go - 校验 Access Token 并向上下文注入用户信息
package middleware

import (
	"strings"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/util"
	"github.com/gin-gonic/gin"
)

const currentUserIDKey = "current_user_id"

// AuthMiddleware - 鉴权中间件结构体
type AuthMiddleware struct {
	jwtManager *util.JWTManager
}

// NewAuthMiddleware - 创建鉴权中间件
// 参数 jwtManager: JWT 管理器
// 返回值：鉴权中间件实例
func NewAuthMiddleware(jwtManager *util.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{jwtManager: jwtManager}
}

// RequireAuth - 校验 Bearer Token 并写入当前用户 ID
// 返回值：Gin 中间件函数
func (middleware *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authorizationHeader := strings.TrimSpace(ctx.GetHeader("Authorization"))
		parts := strings.SplitN(authorizationHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			ctx.AbortWithStatusJSON(401, gin.H{
				"code":    appconst.ErrCodeUnauthorized,
				"message": appconst.ErrUnauthorized.Error(),
			})
			return
		}

		token := strings.TrimSpace(parts[1])
		claims, err := middleware.jwtManager.ParseAccessToken(token)
		if err != nil {
			ctx.AbortWithStatusJSON(401, gin.H{
				"code":    appconst.ErrCodeUnauthorized,
				"message": appconst.ErrUnauthorized.Error(),
			})
			return
		}

		ctx.Set(currentUserIDKey, claims.UserID)
		ctx.Next()
	}
}

// GetCurrentUserID - 从上下文读取当前用户 ID
// 参数 ctx: Gin 请求上下文
// 返回值：用户 ID 与是否存在
func GetCurrentUserID(ctx *gin.Context) (int64, bool) {
	value, exists := ctx.Get(currentUserIDKey)
	if !exists {
		return 0, false
	}

	userID, ok := value.(int64)
	return userID, ok
}
