package config

import "testing"

func TestLoadGeneratesJWTSecretInDevelopment(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("GIN_MODE", "debug")
	t.Setenv("JWT_SECRET", "")

	config, err := Load()
	if err != nil {
		t.Fatalf("加载配置失败: %v", err)
	}

	if config.JWTSecret == "" {
		t.Fatal("开发环境应自动生成 JWT 密钥")
	}
}

func TestLoadRejectsMissingJWTSecretInProduction(t *testing.T) {
	t.Setenv("GIN_MODE", "release")
	t.Setenv("DATABASE_URL", "postgres://markmind:markmind@postgres:5432/markmind?sslmode=disable")
	t.Setenv("REDIS_ADDR", "redis:6379")
	t.Setenv("FRONTEND_ORIGIN", "http://localhost:58000")
	t.Setenv("COOKIE_SECURE", "true")
	t.Setenv("JWT_SECRET", "")

	if _, err := Load(); err == nil {
		t.Fatal("生产环境缺少 JWT_SECRET 时应返回错误")
	}
}

func TestLoadRejectsInsecureCookieInProduction(t *testing.T) {
	t.Setenv("GIN_MODE", "release")
	t.Setenv("DATABASE_URL", "postgres://markmind:markmind@postgres:5432/markmind?sslmode=disable")
	t.Setenv("REDIS_ADDR", "redis:6379")
	t.Setenv("FRONTEND_ORIGIN", "http://localhost:58000")
	t.Setenv("JWT_SECRET", "markmind-test-secret")
	t.Setenv("COOKIE_SECURE", "false")

	if _, err := Load(); err == nil {
		t.Fatal("生产环境缺少安全 Cookie 配置时应返回错误")
	}
}

func TestLoadParsesTrustedProxies(t *testing.T) {
	t.Setenv("TRUSTED_PROXIES", "127.0.0.1, ::1, 172.16.0.0/12")

	config, err := Load()
	if err != nil {
		t.Fatalf("加载配置失败: %v", err)
	}

	if len(config.TrustedProxies) != 3 {
		t.Fatalf("受信任代理数量不正确: %d", len(config.TrustedProxies))
	}

	if config.TrustedProxies[0] != "127.0.0.1" || config.TrustedProxies[1] != "::1" || config.TrustedProxies[2] != "172.16.0.0/12" {
		t.Fatalf("受信任代理解析结果不正确: %#v", config.TrustedProxies)
	}
}
