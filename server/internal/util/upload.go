// upload.go - 提供图片上传涉及的格式校验与文件名生成工具
package util

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"

	appconst "github.com/Qindly/markmind/internal/const"
)

var supportedImageMIMETypes = map[string]string{
	"image/png":  "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/gif":  "gif",
}

// DetectImageExtension - 检测上传图片的真实 MIME 类型并返回对应扩展名。
// 参数 file: 已打开的上传文件流。
// 返回值：安全扩展名与可能出现的错误。
func DetectImageExtension(file multipart.File) (string, error) {
	buffer := make([]byte, 512)
	bytesRead, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("读取上传图片头部失败: %w", err)
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("重置上传图片读取位置失败: %w", err)
	}

	contentType := strings.ToLower(http.DetectContentType(buffer[:bytesRead]))
	extension, exists := supportedImageMIMETypes[contentType]
	if !exists {
		return "", appconst.ErrUnsupportedImageType
	}

	return extension, nil
}

// GenerateUploadedImageFileName - 生成用于持久化存储的随机图片文件名。
// 参数 extension: 文件扩展名，不带点。
// 返回值：随机文件名与可能出现的错误。
func GenerateUploadedImageFileName(extension string) (string, error) {
	buffer := make([]byte, 16)
	if _, err := rand.Read(buffer); err != nil {
		return "", fmt.Errorf("生成图片文件名失败: %w", err)
	}

	return fmt.Sprintf("%s.%s", hex.EncodeToString(buffer), strings.TrimPrefix(extension, ".")), nil
}
