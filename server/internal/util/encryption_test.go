package util

import "testing"

func TestTextEncryptorEncryptAndDecrypt(t *testing.T) {
	encryptor, err := NewTextEncryptor("markmind-test-secret")
	if err != nil {
		t.Fatalf("创建文本加密器失败: %v", err)
	}

	plainText := "sk-test-1234567890"
	cipherText, err := encryptor.Encrypt(plainText)
	if err != nil {
		t.Fatalf("加密文本失败: %v", err)
	}

	if cipherText == plainText {
		t.Fatal("密文不应与明文相同")
	}

	decryptedText, err := encryptor.Decrypt(cipherText)
	if err != nil {
		t.Fatalf("解密文本失败: %v", err)
	}

	if decryptedText != plainText {
		t.Fatalf("解密结果不正确: %s", decryptedText)
	}
}
