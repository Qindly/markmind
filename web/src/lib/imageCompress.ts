// imageCompress.ts - 提供编辑器图片粘贴上传前的前端压缩工具
const MAX_UPLOADED_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_BITMAP_EDGE = 2400;
const COMPRESS_QUALITY = 0.82;

const BITMAP_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const DIRECT_UPLOAD_IMAGE_TYPES = new Set(['image/gif']);

interface LoadedImageResult {
  image: HTMLImageElement;
  objectURL: string;
}

// prepareImageForUpload - 在上传前对粘贴图片做格式校验与压缩处理。
// 参数 file: 从剪贴板读取到的原始文件。
// 返回值：可直接上传的图片文件。
export async function prepareImageForUpload(file: File): Promise<File> {
  const normalizedType = file.type.toLowerCase();
  if (!normalizedType.startsWith('image/')) {
    throw new Error('请粘贴图片文件后再试');
  }

  if (DIRECT_UPLOAD_IMAGE_TYPES.has(normalizedType)) {
    if (file.size > MAX_UPLOADED_IMAGE_SIZE) {
      throw new Error('图片大小不能超过 10MB');
    }

    return file;
  }

  if (!BITMAP_IMAGE_TYPES.has(normalizedType)) {
    throw new Error('仅支持 png、jpg、jpeg、webp、gif 格式的图片');
  }

  const { image, objectURL } = await loadImageFromFile(file);
  try {
    const canvas = document.createElement('canvas');
    const [targetWidth, targetHeight] = calculateTargetSize(image.naturalWidth, image.naturalHeight);
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('浏览器暂不支持图片压缩，请稍后再试');
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    const compressedBlob = await canvasToBlob(canvas, 'image/webp', COMPRESS_QUALITY);
    const compressedFile = new File([compressedBlob], buildCompressedFileName(file.name), {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    if (compressedFile.size > MAX_UPLOADED_IMAGE_SIZE && file.size > MAX_UPLOADED_IMAGE_SIZE) {
      throw new Error('压缩后的图片仍然超过 10MB，请裁剪后再试');
    }

    if (compressedFile.size >= file.size && file.size <= MAX_UPLOADED_IMAGE_SIZE) {
      return file;
    }

    if (compressedFile.size > MAX_UPLOADED_IMAGE_SIZE) {
      throw new Error('图片大小不能超过 10MB');
    }

    return compressedFile;
  } finally {
    URL.revokeObjectURL(objectURL);
    image.src = '';
  }
}

function loadImageFromFile(file: File): Promise<LoadedImageResult> {
  return new Promise((resolve, reject) => {
    const objectURL = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => resolve({ image, objectURL });
    image.onerror = () => {
      URL.revokeObjectURL(objectURL);
      reject(new Error('图片解析失败，请重新复制后再试'));
    };

    image.src = objectURL;
  });
}

function calculateTargetSize(width: number, height: number): [number, number] {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= MAX_BITMAP_EDGE) {
    return [width, height];
  }

  const scale = MAX_BITMAP_EDGE / longestEdge;
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片压缩失败，请稍后重试'));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}

function buildCompressedFileName(originalName: string): string {
  const trimmedName = originalName.trim();
  const baseName = trimmedName ? trimmedName.replace(/\.[^.]+$/, '') : 'pasted-image';
  return `${baseName || 'pasted-image'}.webp`;
}
