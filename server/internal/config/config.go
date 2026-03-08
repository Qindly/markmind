// config.go - ?????????????
package config

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
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
	defaultRefreshCookieName   = "markmind_refresh_token"
	defaultCookieSameSite      = "Lax"
	defaultAuthRateLimitWindow = time.Minute
	defaultAuthRateLimitMax    = 10
)

// Config - ????????
type Config struct {
	AppEnv                  string
	ServerPort              string
	GinMode                 string
	DatabaseURL             string
	RedisAddr               string
	RedisPassword           string
	RedisDB                 int
	JWTSecret               string
	FrontendOrigin          string
	AccessTokenTTL          time.Duration
	RefreshTokenTTL         time.Duration
	RefreshCookieName       string
	CookieDomain            string
	CookieSecure            bool
	CookieHTTPOnly          bool
	CookieSameSite          string
	AuthRateLimitWindow     time.Duration
	AuthRateLimitMaxRequest int
}

// Load - ??????????????
// ??????????????
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
	frontendOrigin, hasFrontendOrigin := getEnvWithFlag("FRONTEND_ORIGIN", defaultFrontendOrigin)
	accessTokenTTL, err := getEnvAsDuration("ACCESS_TOKEN_TTL", 15*time.Minute)
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
			return Config{}, fmt.Errorf("?????? JWT ????: %w", err)
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
		FrontendOrigin:          frontendOrigin,
		AccessTokenTTL:          accessTokenTTL,
		RefreshTokenTTL:         refreshTokenTTL,
		RefreshCookieName:       refreshCookieName,
		CookieDomain:            cookieDomain,
		CookieSecure:            cookieSecure,
		CookieHTTPOnly:          cookieHTTPOnly,
		CookieSameSite:          cookieSameSite,
		AuthRateLimitWindow:     authRateLimitWindow,
		AuthRateLimitMaxRequest: authRateLimitMaxRequest,
	}

	if err := validateConfig(cfg, hasDatabaseURL, hasRedisAddr, hasJWTSecret, hasFrontendOrigin); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

// IsProduction - ??????????????
// ????????????? true
func (config Config) IsProduction() bool {
	return isProduction(config.AppEnv, config.GinMode)
}

func validateConfig(cfg Config, hasDatabaseURL bool, hasRedisAddr bool, hasJWTSecret bool, hasFrontendOrigin bool) error {
	if cfg.AuthRateLimitWindow <= 0 {
		return fmt.Errorf("AUTH_RATE_LIMIT_WINDOW ???? 0")
	}

	if cfg.AuthRateLimitMaxRequest <= 0 {
		return fmt.Errorf("AUTH_RATE_LIMIT_MAX_REQUESTS ???? 0")
	}

	if strings.TrimSpace(cfg.RefreshCookieName) == "" {
		return fmt.Errorf("REFRESH_COOKIE_NAME ????")
	}

	if !cfg.IsProduction() {
		return nil
	}

	if !hasDatabaseURL {
		return fmt.Errorf("?????????? DATABASE_URL")
	}

	if !hasRedisAddr {
		return fmt.Errorf("?????????? REDIS_ADDR")
	}

	if !hasJWTSecret || strings.TrimSpace(cfg.JWTSecret) == "" {
		return fmt.Errorf("?????????? JWT_SECRET")
	}

	if !hasFrontendOrigin {
		return fmt.Errorf("?????????? FRONTEND_ORIGIN")
	}

	if !cfg.CookieSecure {
		return fmt.Errorf("???????? COOKIE_SECURE=true")
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

func getEnvWithFlag(key string, fallback string) (string, bool) {
	value, exists := os.LookupEnv(key)
	if exists {
		return value, true
	}

	return fallback, false
}

func getEnvAsInt(key string, fallback int) (int, error) {
	value, exists := os.LookupEnv(key)
	if !exists || strings.TrimSpace(value) == "" {
		return fallback, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("%s ??????: %w", key, err)
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
		return false, fmt.Errorf("%s ???????: %w", key, err)
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
		return 0, fmt.Errorf("%s ????????: %w", key, err)
	}

	return parsed, nil
}
