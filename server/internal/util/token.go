// token.go - 生成随机 Refresh Token
package util

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

// GenerateRefreshToken - 生成 32 字节随机 Refresh Token
// 返回值：十六进制编码的随机字符串与可能的错误
func GenerateRefreshToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", fmt.Errorf("生成随机令牌失败: %w", err)
	}

	return hex.EncodeToString(buffer), nil
}
