// config_test.go - ???????????????
package config

import "testing"

// TestLoadGeneratesJWTSecretInDevelopment - ??????????? JWT ??
// ?? t: ?????
// ?????
func TestLoadGeneratesJWTSecretInDevelopment(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("GIN_MODE", "debug")
	t.Setenv("JWT_SECRET", "")

	config, err := Load()
	if err != nil {
		t.Fatalf("??????????: %v", err)
	}

	if config.JWTSecret == "" {
		t.Fatal("????????? JWT ??")
	}
}

// TestLoadRejectsMissingJWTSecretInProduction - ???????? JWT ??????
// ?? t: ?????
// ?????
func TestLoadRejectsMissingJWTSecretInProduction(t *testing.T) {
	t.Setenv("GIN_MODE", "release")
	t.Setenv("DATABASE_URL", "postgres://markmind:markmind@postgres:5432/markmind?sslmode=disable")
	t.Setenv("REDIS_ADDR", "redis:6379")
	t.Setenv("FRONTEND_ORIGIN", "http://localhost:58000")
	t.Setenv("COOKIE_SECURE", "true")
	t.Setenv("JWT_SECRET", "")

	if _, err := Load(); err == nil {
		t.Fatal("?????? JWT_SECRET ??????")
	}
}

// TestLoadRejectsInsecureCookieInProduction - ?????????? Cookie ????
// ?? t: ?????
// ?????
func TestLoadRejectsInsecureCookieInProduction(t *testing.T) {
	t.Setenv("GIN_MODE", "release")
	t.Setenv("DATABASE_URL", "postgres://markmind:markmind@postgres:5432/markmind?sslmode=disable")
	t.Setenv("REDIS_ADDR", "redis:6379")
	t.Setenv("FRONTEND_ORIGIN", "http://localhost:58000")
	t.Setenv("JWT_SECRET", "markmind-test-secret")
	t.Setenv("COOKIE_SECURE", "false")

	if _, err := Load(); err == nil {
		t.Fatal("?????? COOKIE_SECURE ??????")
	}
}
