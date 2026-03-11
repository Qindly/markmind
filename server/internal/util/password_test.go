// password_test.go - 校验密码工具函数的基础行为
package util

import "testing"

// TestHashAndComparePassword - 验证密码哈希后可以被正确校验
// 参数 t: 测试上下文
// 返回值：无
func TestHashAndComparePassword(t *testing.T) {
	hashedPassword, err := HashPassword("markmind-secret")
	if err != nil {
		t.Fatalf("密码哈希失败: %v", err)
	}

	if err := ComparePassword(hashedPassword, "markmind-secret"); err != nil {
		t.Fatalf("密码比对失败: %v", err)
	}

	if err := ComparePassword(hashedPassword, "wrong-password"); err == nil {
		t.Fatal("错误密码应该返回失败")
	}
}
