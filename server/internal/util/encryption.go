// encryption.go - 提供用于敏感配置加密存储的对称加密工具
package util

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
)

// TextEncryptor - 使用基于 AES-GCM 的对称加密方案处理文本。
type TextEncryptor struct {
	key []byte
}

// NewTextEncryptor - 根据应用密钥创建文本加密器。
// 参数 secret: 用于派生对称密钥的原始密钥字符串。
// 返回值：文本加密器实例与可能出现的错误。
func NewTextEncryptor(secret string) (*TextEncryptor, error) {
	if secret == "" {
		return nil, fmt.Errorf("加密密钥不能为空")
	}

	keyDigest := sha256.Sum256([]byte(secret))
	return &TextEncryptor{
		key: keyDigest[:],
	}, nil
}

// Encrypt - 加密明文字符串。
// 参数 plainText: 待加密的原始文本。
// 返回值：Base64 编码后的密文与可能出现的错误。
func (encryptor *TextEncryptor) Encrypt(plainText string) (string, error) {
	block, err := aes.NewCipher(encryptor.key)
	if err != nil {
		return "", fmt.Errorf("创建 AES Cipher 失败: %w", err)
	}

	aead, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("创建 GCM 实例失败: %w", err)
	}

	nonce := make([]byte, aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("生成随机 nonce 失败: %w", err)
	}

	cipherText := aead.Seal(nonce, nonce, []byte(plainText), nil)
	return base64.StdEncoding.EncodeToString(cipherText), nil
}

// Decrypt - 解密 Base64 编码后的密文字符串。
// 参数 encodedCipherText: Base64 编码后的密文。
// 返回值：解密后的明文与可能出现的错误。
func (encryptor *TextEncryptor) Decrypt(encodedCipherText string) (string, error) {
	rawCipherText, err := base64.StdEncoding.DecodeString(encodedCipherText)
	if err != nil {
		return "", fmt.Errorf("Base64 密文解码失败: %w", err)
	}

	block, err := aes.NewCipher(encryptor.key)
	if err != nil {
		return "", fmt.Errorf("创建 AES Cipher 失败: %w", err)
	}

	aead, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("创建 GCM 实例失败: %w", err)
	}

	nonceSize := aead.NonceSize()
	if len(rawCipherText) < nonceSize {
		return "", fmt.Errorf("密文长度非法")
	}

	nonce := rawCipherText[:nonceSize]
	cipherPayload := rawCipherText[nonceSize:]
	plainText, err := aead.Open(nil, nonce, cipherPayload, nil)
	if err != nil {
		return "", fmt.Errorf("解密密文失败: %w", err)
	}

	return string(plainText), nil
}
