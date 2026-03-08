// password.go - 封装密码哈希与比对逻辑
package util

import (
	"fmt"

	appconst "github.com/Qindly/markmind/internal/const"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword - 使用 bcrypt 对明文密码进行哈希
// 参数 password: 用户输入的明文密码
// 返回值：哈希后的密码字符串与可能的错误
func HashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("密码哈希失败: %w", err)
	}

	return string(hashedBytes), nil
}

// ComparePassword - 校验明文密码与哈希值是否匹配
// 参数 hashedPassword: 数据库存储的哈希密码
// 参数 plainPassword: 用户输入的明文密码
// 返回值：可能的错误，匹配成功时返回 nil
func ComparePassword(hashedPassword string, plainPassword string) error {
	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword)); err != nil {
		return appconst.ErrInvalidCredentials
	}

	return nil
}
