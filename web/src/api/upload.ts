// upload.ts - 封装编辑器图片上传接口请求
import { apiClient } from './client';

import type { ApiResponse } from '../types/api';
import type { UploadImageResponseData } from '../types/upload';

// uploadImage - 上传编辑器粘贴的单张图片。
// 参数 file: 待上传的图片文件。
// 返回值：上传成功后的图片访问地址。
export async function uploadImage(file: File): Promise<UploadImageResponseData> {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await apiClient.post<ApiResponse<UploadImageResponseData>>('/uploads/images', formData);
  return data.data;
}
