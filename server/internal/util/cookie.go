// cookie.go - 统一处理 Refresh Token Cookie 的读写
package util

import (
	"net/http"
	"strings"
	"time"

	"github.com/Qindly/markmind/internal/config"
	"github.com/gin-gonic/gin"
)

// SetRefreshTokenCookie - 向客户端写入 Refresh Token Cookie
// 参数 ctx: Gin 请求上下文
// 参数 cfg: 应用配置
// 参数 token: Refresh Token 内容
// 返回值：无
func SetRefreshTokenCookie(ctx *gin.Context, cfg config.Config, token string) {
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     cfg.RefreshCookieName,
		Value:    token,
		Path:     "/",
		Domain:   cfg.CookieDomain,
		MaxAge:   int(cfg.RefreshTokenTTL.Seconds()),
		HttpOnly: cfg.CookieHTTPOnly,
		Secure:   cfg.CookieSecure,
		SameSite: parseSameSite(cfg.CookieSameSite),
	})
}

// ClearRefreshTokenCookie - 清除客户端中的 Refresh Token Cookie
// 参数 ctx: Gin 请求上下文
// 参数 cfg: 应用配置
// 返回值：无
func ClearRefreshTokenCookie(ctx *gin.Context, cfg config.Config) {
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     cfg.RefreshCookieName,
		Value:    "",
		Path:     "/",
		Domain:   cfg.CookieDomain,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: cfg.CookieHTTPOnly,
		Secure:   cfg.CookieSecure,
		SameSite: parseSameSite(cfg.CookieSameSite),
	})
}

func parseSameSite(value string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}
