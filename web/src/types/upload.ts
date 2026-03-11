// upload.ts - 定义图片上传接口使用的前端类型
export interface UploadedImage {
  url: string;
}

export interface UploadImageResponseData {
  image: UploadedImage;
}
