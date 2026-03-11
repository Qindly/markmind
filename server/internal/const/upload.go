// upload.go - 定义图片上传模块使用的业务错误码、错误变量与大小限制
package appconst

import "errors"

const (
	// ErrCodeImageRequired - 未上传图片文件。
	ErrCodeImageRequired = 40010
	// ErrCodeImageTooLarge - 图片体积超过限制。
	ErrCodeImageTooLarge = 40011
	// ErrCodeUnsupportedImageType - 图片格式不受支持。
	ErrCodeUnsupportedImageType = 40012

	// MaxImageUploadSize - 单张图片允许上传的最大体积，固定为 10MB。
	MaxImageUploadSize int64 = 10 * 1024 * 1024
)

var (
	// ErrImageRequired - 请求中缺少图片文件。
	ErrImageRequired = errors.New("请上传图片文件")
	// ErrImageTooLarge - 图片体积超过本期限制。
	ErrImageTooLarge = errors.New("图片大小不能超过 10MB")
	// ErrUnsupportedImageType - 当前图片格式不在支持范围内。
	ErrUnsupportedImageType = errors.New("仅支持 png、jpg、jpeg、webp、gif 格式的图片")
)
