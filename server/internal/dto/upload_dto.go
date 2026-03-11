// upload_dto.go - 定义图片上传接口的响应结构体
package dto

// UploadedImageResponseData - 上传完成后返回给前端的图片信息。
type UploadedImageResponseData struct {
	URL string `json:"url"`
}

// UploadImageResponse - 图片上传接口响应体。
type UploadImageResponse struct {
	Image UploadedImageResponseData `json:"image"`
}
