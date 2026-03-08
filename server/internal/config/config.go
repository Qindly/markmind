// config.go - 负责加载应用运行配置
package config

import (
	"os"
	"strconv"
	"time"
)

// Config - 应用运行配置集合
type Config struct {
	ServerPort        string
	GinMode           string
	DatabaseURL       string
	RedisAddr         string
	RedisPassword     string
	RedisDB           int
	JWTSecret         string
	FrontendOrigin    string
	AccessTokenTTL    time.Duration
	RefreshTokenTTL   time.Duration
	RefreshCookieName string
	CookieDomain      string
	CookieSecure      bool
	CookieHTTPOnly    bool
	CookieSameSite    string
}

// Load - 从环境变量加载应用配置
// 返回值：带默认值的配置对象
func Load() Config {
	return Config{
		ServerPort:        getEnv("SERVER_PORT", "8080"),
		GinMode:           getEnv("GIN_MODE", "debug"),
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://markmind:markmind@localhost:5432/markmind?sslmode=disable"),
		RedisAddr:         getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:     getEnv("REDIS_PASSWORD", ""),
		RedisDB:           getEnvAsInt("REDIS_DB", 0),
		JWTSecret:         getEnv("JWT_SECRET", "markmind-dev-secret"),
		FrontendOrigin:    getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
		AccessTokenTTL:    getEnvAsDuration("ACCESS_TOKEN_TTL", 15*time.Minute),
		RefreshTokenTTL:   getEnvAsDuration("REFRESH_TOKEN_TTL", 7*24*time.Hour),
		RefreshCookieName: getEnv("REFRESH_COOKIE_NAME", "markmind_refresh_token"),
		CookieDomain:      getEnv("COOKIE_DOMAIN", ""),
		CookieSecure:      getEnvAsBool("COOKIE_SECURE", false),
		CookieHTTPOnly:    getEnvAsBool("COOKIE_HTTP_ONLY", true),
		CookieSameSite:    getEnv("COOKIE_SAME_SITE", "Lax"),
	}
}

func getEnv(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func getEnvAsBool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func getEnvAsDuration(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}

	return parsed
}
