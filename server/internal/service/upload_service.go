// upload_service.go - 编排编辑器图片上传与文件落盘逻辑
package service

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path"
	"path/filepath"
	"time"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/config"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/util"
)

// UploadServicer - 图片上传服务接口。
type UploadServicer interface {
	UploadImage(ctx context.Context, fileHeader *multipart.FileHeader) (*dto.UploadImageResponse, error)
}

type uploadService struct {
	config config.Config
}

// NewUploadService - 创建图片上传服务实现。
// 参数 cfg: 服务端运行配置。
// 返回值：图片上传服务实例。
func NewUploadService(cfg config.Config) UploadServicer {
	return &uploadService{config: cfg}
}

func (service *uploadService) UploadImage(
	ctx context.Context,
	fileHeader *multipart.FileHeader,
) (*dto.UploadImageResponse, error) {
	_ = ctx

	if fileHeader == nil || fileHeader.Size <= 0 {
		return nil, appconst.ErrImageRequired
	}

	if fileHeader.Size > appconst.MaxImageUploadSize {
		return nil, appconst.ErrImageTooLarge
	}

	uploadedFile, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("打开上传图片失败: %w", err)
	}
	defer uploadedFile.Close()

	extension, err := util.DetectImageExtension(uploadedFile)
	if err != nil {
		return nil, err
	}

	fileName, err := util.GenerateUploadedImageFileName(extension)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	relativeDirectory := filepath.Join(now.Format("2006"), now.Format("01"))
	targetDirectory := filepath.Join(service.config.UploadRootDir, relativeDirectory)
	if err := os.MkdirAll(targetDirectory, 0o755); err != nil {
		return nil, fmt.Errorf("创建图片上传目录失败: %w", err)
	}

	targetPath := filepath.Join(targetDirectory, fileName)
	targetFile, err := os.Create(targetPath)
	if err != nil {
		return nil, fmt.Errorf("创建图片文件失败: %w", err)
	}

	copySucceeded := false
	defer func() {
		_ = targetFile.Close()
		if !copySucceeded {
			_ = os.Remove(targetPath)
		}
	}()

	if _, err := io.Copy(targetFile, uploadedFile); err != nil {
		return nil, fmt.Errorf("保存图片文件失败: %w", err)
	}

	copySucceeded = true
	publicURL := path.Join(service.config.UploadPublicBasePath, filepath.ToSlash(relativeDirectory), fileName)

	return &dto.UploadImageResponse{
		Image: dto.UploadedImageResponseData{
			URL: publicURL,
		},
	}, nil
}
