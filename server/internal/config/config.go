// config.go - 负责加载并校验服务端运行配置
package config

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const (
	defaultServerPort          = "8080"
	defaultGinMode             = "debug"
	defaultDatabaseURL         = "postgres://markmind:markmind@localhost:5432/markmind?sslmode=disable"
	defaultRedisAddr           = "localhost:6379"
	defaultFrontendOrigin      = "http://localhost:5173"
	defaultAIEncryptSecret     = "markmind-local-ai-secret-change-me"
	defaultAIRequestTimeout    = 60 * time.Second
	defaultRefreshCookieName   = "markmind_refresh_token"
	defaultCookieSameSite      = "Lax"
	defaultAuthRateLimitWindow = time.Minute
	defaultAuthRateLimitMax    = 10
)

// Config - 服务端运行时所需的配置集合。
type Config struct {
	AppEnv                  string
	ServerPort              string
	GinMode                 string
	DatabaseURL             string
	RedisAddr               string
	RedisPassword           string
	RedisDB                 int
	JWTSecret               string
	AIProviderEncryptSecret string
	AIRequestTimeout        time.Duration
	AIProviderDebug         bool
	FrontendOrigin          string
	TrustedProxies          []string
	AccessTokenTTL          time.Duration
	RefreshTokenTTL         time.Duration
	RefreshCookieName       string
	CookieDomain            string
	CookieSecure            bool
	CookieHTTPOnly          bool
	CookieSameSite          string
	AuthRateLimitWindow     time.Duration
	AuthRateLimitMaxRequest int
	UploadRootDir           string
	UploadPublicBasePath    string
}

// Load - 从环境变量加载配置并执行必要校验。
// 返回值为完整配置与可能出现的错误。
func Load() (Config, error) {
	appEnv, _ := getEnvWithFlag("APP_ENV", "")
	ginMode, _ := getEnvWithFlag("GIN_MODE", defaultGinMode)
	serverPort, _ := getEnvWithFlag("SERVER_PORT", defaultServerPort)
	databaseURL, hasDatabaseURL := getEnvWithFlag("DATABASE_URL", defaultDatabaseURL)
	redisAddr, hasRedisAddr := getEnvWithFlag("REDIS_ADDR", defaultRedisAddr)
	redisPassword, _ := getEnvWithFlag("REDIS_PASSWORD", "")
	redisDB, err := getEnvAsInt("REDIS_DB", 0)
	if err != nil {
		return Config{}, err
	}

	jwtSecret, hasJWTSecret := getEnvWithFlag("JWT_SECRET", "")
	aiProviderEncryptSecret, hasAIProviderEncryptSecret := getEnvWithFlag("AI_PROVIDER_ENCRYPTION_SECRET", defaultAIEncryptSecret)
	frontendOrigin, hasFrontendOrigin := getEnvWithFlag("FRONTEND_ORIGIN", defaultFrontendOrigin)
	trustedProxies := getEnvAsStringSlice("TRUSTED_PROXIES")
	accessTokenTTL, err := getEnvAsDuration("ACCESS_TOKEN_TTL", 15*time.Minute)
	if err != nil {
		return Config{}, err
	}

	aiRequestTimeout, err := getEnvAsDuration("AI_REQUEST_TIMEOUT", defaultAIRequestTimeout)
	if err != nil {
		return Config{}, err
	}

	aiProviderDebug, err := getEnvAsBool("AI_PROVIDER_DEBUG", false)
	if err != nil {
		return Config{}, err
	}

	refreshTokenTTL, err := getEnvAsDuration("REFRESH_TOKEN_TTL", 7*24*time.Hour)
	if err != nil {
		return Config{}, err
	}

	refreshCookieName, _ := getEnvWithFlag("REFRESH_COOKIE_NAME", defaultRefreshCookieName)
	cookieDomain, _ := getEnvWithFlag("COOKIE_DOMAIN", "")
	cookieSecure, err := getEnvAsBool("COOKIE_SECURE", isProduction(appEnv, ginMode))
	if err != nil {
		return Config{}, err
	}

	cookieHTTPOnly, err := getEnvAsBool("COOKIE_HTTP_ONLY", true)
	if err != nil {
		return Config{}, err
	}

	cookieSameSite, _ := getEnvWithFlag("COOKIE_SAME_SITE", defaultCookieSameSite)
	uploadRootDir, _ := getEnvWithFlag("UPLOAD_ROOT_DIR", getDefaultUploadRootDir())
	uploadPublicBasePath, _ := getEnvWithFlag("UPLOAD_PUBLIC_BASE_PATH", "/uploads")
	authRateLimitWindow, err := getEnvAsDuration("AUTH_RATE_LIMIT_WINDOW", defaultAuthRateLimitWindow)
	if err != nil {
		return Config{}, err
	}

	authRateLimitMaxRequest, err := getEnvAsInt("AUTH_RATE_LIMIT_MAX_REQUESTS", defaultAuthRateLimitMax)
	if err != nil {
		return Config{}, err
	}

	if jwtSecret == "" && !isProduction(appEnv, ginMode) {
		jwtSecret, err = generateDevelopmentSecret()
		if err != nil {
			return Config{}, fmt.Errorf("生成开发环境 JWT 密钥失败: %w", err)
		}
	}

	cfg := Config{
		AppEnv:                  appEnv,
		ServerPort:              serverPort,
		GinMode:                 ginMode,
		DatabaseURL:             databaseURL,
		RedisAddr:               redisAddr,
		RedisPassword:           redisPassword,
		RedisDB:                 redisDB,
		JWTSecret:               jwtSecret,
		AIProviderEncryptSecret: aiProviderEncryptSecret,
		AIRequestTimeout:        aiRequestTimeout,
		AIProviderDebug:         aiProviderDebug,
		FrontendOrigin:          frontendOrigin,
		TrustedProxies:          trustedProxies,
		AccessTokenTTL:          accessTokenTTL,
		RefreshTokenTTL:         refreshTokenTTL,
		RefreshCookieName:       refreshCookieName,
		CookieDomain:            cookieDomain,
		CookieSecure:            cookieSecure,
		CookieHTTPOnly:          cookieHTTPOnly,
		CookieSameSite:          cookieSameSite,
		AuthRateLimitWindow:     authRateLimitWindow,
		AuthRateLimitMaxRequest: authRateLimitMaxRequest,
		UploadRootDir:           normalizeUploadRootDir(uploadRootDir),
		UploadPublicBasePath:    normalizePublicBasePath(uploadPublicBasePath),
	}

	if err := validateConfig(cfg, hasDatabaseURL, hasRedisAddr, hasJWTSecret, hasAIProviderEncryptSecret, hasFrontendOrigin); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

// IsProduction - 判断当前配置是否处于生产环境。
// 当 APP_ENV 为 production 或 GIN_MODE 为 release 时返回 true。
func (config Config) IsProduction() bool {
	return isProduction(config.AppEnv, config.GinMode)
}

func validateConfig(
	cfg Config,
	hasDatabaseURL bool,
	hasRedisAddr bool,
	hasJWTSecret bool,
	hasAIProviderEncryptSecret bool,
	hasFrontendOrigin bool,
) error {
	if cfg.AuthRateLimitWindow <= 0 {
		return fmt.Errorf("AUTH_RATE_LIMIT_WINDOW 必须大于 0")
	}

	if cfg.AuthRateLimitMaxRequest <= 0 {
		return fmt.Errorf("AUTH_RATE_LIMIT_MAX_REQUESTS 必须大于 0")
	}

	if strings.TrimSpace(cfg.RefreshCookieName) == "" {
		return fmt.Errorf("REFRESH_COOKIE_NAME 不能为空")
	}

	if strings.TrimSpace(cfg.UploadRootDir) == "" {
		return fmt.Errorf("UPLOAD_ROOT_DIR 不能为空")
	}

	if strings.TrimSpace(cfg.AIProviderEncryptSecret) == "" {
		return fmt.Errorf("AI_PROVIDER_ENCRYPTION_SECRET 不能为空")
	}

	if cfg.AIRequestTimeout <= 0 {
		return fmt.Errorf("AI_REQUEST_TIMEOUT 必须大于 0")
	}

	if cfg.UploadPublicBasePath == "" || !strings.HasPrefix(cfg.UploadPublicBasePath, "/") {
		return fmt.Errorf("UPLOAD_PUBLIC_BASE_PATH 必须以 / 开头")
	}

	if !cfg.IsProduction() {
		return nil
	}

	if !hasDatabaseURL {
		return fmt.Errorf("生产环境必须显式配置 DATABASE_URL")
	}

	if !hasRedisAddr {
		return fmt.Errorf("生产环境必须显式配置 REDIS_ADDR")
	}

	if !hasJWTSecret || strings.TrimSpace(cfg.JWTSecret) == "" {
		return fmt.Errorf("生产环境必须显式配置 JWT_SECRET")
	}

	if !hasAIProviderEncryptSecret || strings.TrimSpace(cfg.AIProviderEncryptSecret) == "" {
		return fmt.Errorf("生产环境必须显式配置 AI_PROVIDER_ENCRYPTION_SECRET")
	}

	if !hasFrontendOrigin {
		return fmt.Errorf("生产环境必须显式配置 FRONTEND_ORIGIN")
	}

	if !cfg.CookieSecure {
		return fmt.Errorf("生产环境必须设置 COOKIE_SECURE=true")
	}

	return nil
}

func isProduction(appEnv string, ginMode string) bool {
	return strings.EqualFold(strings.TrimSpace(appEnv), "production") || strings.EqualFold(strings.TrimSpace(ginMode), "release")
}

func generateDevelopmentSecret() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return hex.EncodeToString(buffer), nil
}

func getDefaultUploadRootDir() string {
	return filepath.Clean(filepath.Join("..", "data", "uploads"))
}

func normalizeUploadRootDir(value string) string {
	trimmedValue := strings.TrimSpace(value)
	if trimmedValue == "" {
		return ""
	}

	return filepath.Clean(trimmedValue)
}

func normalizePublicBasePath(value string) string {
	trimmedValue := strings.TrimSpace(value)
	if trimmedValue == "" {
		return "/uploads"
	}

	if !strings.HasPrefix(trimmedValue, "/") {
		trimmedValue = "/" + trimmedValue
	}

	if trimmedValue == "/" {
		return trimmedValue
	}

	return strings.TrimRight(trimmedValue, "/")
}

func getEnvWithFlag(key string, fallback string) (string, bool) {
	value, exists := os.LookupEnv(key)
	if exists {
		return value, true
	}

	return fallback, false
}

func getEnvAsStringSlice(key string) []string {
	value, exists := os.LookupEnv(key)
	if !exists || strings.TrimSpace(value) == "" {
		return nil
	}

	items := strings.Split(value, ",")
	result := make([]string, 0, len(items))
	for _, item := range items {
		trimmed := strings.TrimSpace(item)
		if trimmed == "" {
			continue
		}

		result = append(result, trimmed)
	}

	if len(result) == 0 {
		return nil
	}

	return result
}

func getEnvAsInt(key string, fallback int) (int, error) {
	value, exists := os.LookupEnv(key)
	if !exists || strings.TrimSpace(value) == "" {
		return fallback, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("%s 解析为整数失败: %w", key, err)
	}

	return parsed, nil
}

func getEnvAsBool(key string, fallback bool) (bool, error) {
	value, exists := os.LookupEnv(key)
	if !exists || strings.TrimSpace(value) == "" {
		return fallback, nil
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return false, fmt.Errorf("%s 解析为布尔值失败: %w", key, err)
	}

	return parsed, nil
}

func getEnvAsDuration(key string, fallback time.Duration) (time.Duration, error) {
	value, exists := os.LookupEnv(key)
	if !exists || strings.TrimSpace(value) == "" {
		return fallback, nil
	}

	parsed, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("%s 解析为时间长度失败: %w", key, err)
	}

	return parsed, nil
}
