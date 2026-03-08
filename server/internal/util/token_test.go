// token_test.go - 校验令牌工具函数的基础行为
package util

import (
	"testing"
	"time"
)

// TestGenerateRefreshToken - 验证 Refresh Token 长度符合预期
// 参数 t: 测试上下文
// 返回值：无
func TestGenerateRefreshToken(t *testing.T) {
	token, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("生成 Refresh Token 失败: %v", err)
	}

	if len(token) != 64 {
		t.Fatalf("Refresh Token 长度不正确: %d", len(token))
	}
}

// TestJWTManager - 验证 Access Token 可以被成功签发与解析
// 参数 t: 测试上下文
// 返回值：无
func TestJWTManager(t *testing.T) {
	manager := NewJWTManager("test-secret", 15*time.Minute)
	token, err := manager.GenerateAccessToken(12)
	if err != nil {
		t.Fatalf("生成 Access Token 失败: %v", err)
	}

	claims, err := manager.ParseAccessToken(token)
	if err != nil {
		t.Fatalf("解析 Access Token 失败: %v", err)
	}

	if claims.UserID != 12 {
		t.Fatalf("解析出的用户 ID 不正确: %d", claims.UserID)
	}
}
