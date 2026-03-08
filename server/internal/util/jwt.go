// jwt.go - 封装 Access Token 的生成与解析逻辑
package util

import (
	"time"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/golang-jwt/jwt/v5"
)

// AccessTokenClaims - Access Token 的业务声明体
type AccessTokenClaims struct {
	UserID int64 `json:"user_id"`
	jwt.RegisteredClaims
}

// JWTManager - 管理 Access Token 的签发与校验
type JWTManager struct {
	secretKey []byte
	ttl       time.Duration
}

// NewJWTManager - 创建 JWT 管理器
// 参数 secret: JWT 签名密钥
// 参数 ttl: Access Token 有效期
// 返回值：JWT 管理器实例
func NewJWTManager(secret string, ttl time.Duration) *JWTManager {
	return &JWTManager{
		secretKey: []byte(secret),
		ttl:       ttl,
	}
}

// GenerateAccessToken - 为指定用户生成 Access Token
// 参数 userID: 用户主键 ID
// 返回值：JWT 字符串与可能的错误
func (manager *JWTManager) GenerateAccessToken(userID int64) (string, error) {
	now := time.Now()
	claims := AccessTokenClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(manager.ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(manager.secretKey)
}

// ParseAccessToken - 解析并校验 Access Token
// 参数 tokenString: 客户端传入的 Bearer Token
// 返回值：解析后的声明体与可能的错误
func (manager *JWTManager) ParseAccessToken(tokenString string) (*AccessTokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AccessTokenClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, appconst.ErrUnauthorized
		}

		return manager.secretKey, nil
	})
	if err != nil {
		return nil, appconst.ErrUnauthorized
	}

	claims, ok := token.Claims.(*AccessTokenClaims)
	if !ok || !token.Valid {
		return nil, appconst.ErrUnauthorized
	}

	return claims, nil
}
