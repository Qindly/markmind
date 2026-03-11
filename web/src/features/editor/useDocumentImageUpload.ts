// useDocumentImageUpload.ts - 管理编辑器图片粘贴上传与占位符替换逻辑
import { useCallback, useState } from 'react';
import type { EditorView } from '@codemirror/view';

import { uploadImage } from '../../api/upload';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../lib/getErrorMessage';
import { prepareImageForUpload } from '../../lib/imageCompress';

const uploadPlaceholderPrefix = 'markmind-image-upload';

interface UploadPlaceholder {
  marker: string;
}

export interface UseDocumentImageUploadResult {
  isUploadingImages: boolean;
  uploadingImageCount: number;
  handleImagePaste: (imageFiles: File[], view: EditorView) => Promise<void>;
}

/**
 * useDocumentImageUpload - 处理编辑器内的图片粘贴上传与 Markdown 自动插入。
 * 返回值：上传状态与粘贴图片处理回调。
 */
export function useDocumentImageUpload(): UseDocumentImageUploadResult {
  const [uploadingImageCount, setUploadingImageCount] = useState(0);

  const handleImagePaste = useCallback(async (imageFiles: File[], view: EditorView) => {
    if (imageFiles.length === 0) {
      return;
    }

    const placeholders = imageFiles.map(() => createUploadPlaceholder());
    insertUploadPlaceholders(
      view,
      placeholders.map((placeholder) => placeholder.marker),
    );
    setUploadingImageCount((currentCount) => currentCount + placeholders.length);

    for (const [index, imageFile] of imageFiles.entries()) {
      const placeholder = placeholders[index];

      try {
        const preparedImage = await prepareImageForUpload(imageFile);
        const response = await uploadImage(preparedImage);
        replaceUploadPlaceholder(view, placeholder.marker, createMarkdownImageSnippet(response.image.url));
      } catch (error) {
        replaceUploadPlaceholder(view, placeholder.marker, '');
        const message = getErrorMessage(error, '图片上传失败，请稍后重试');
        toast({
          description: imageFiles.length > 1 ? `第 ${index + 1} 张图片上传失败：${message}` : message,
          variant: 'destructive',
        });
      } finally {
        setUploadingImageCount((currentCount) => Math.max(0, currentCount - 1));
      }
    }
  }, []);

  return {
    isUploadingImages: uploadingImageCount > 0,
    uploadingImageCount,
    handleImagePaste,
  };
}

function createUploadPlaceholder(): UploadPlaceholder {
  const markerID = crypto.randomUUID();
  return {
    marker: `<!-- ${uploadPlaceholderPrefix}:${markerID} -->`,
  };
}

function insertUploadPlaceholders(view: EditorView, markers: string[]) {
  const insertionText = markers.join('\n\n');
  const selection = view.state.selection.main;

  view.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: insertionText,
    },
    selection: {
      anchor: selection.from + insertionText.length,
    },
    scrollIntoView: true,
  });
  view.focus();
}

function replaceUploadPlaceholder(view: EditorView, marker: string, replacement: string) {
  const documentText = view.state.doc.toString();
  const startIndex = documentText.indexOf(marker);
  if (startIndex < 0) {
    return;
  }

  view.dispatch({
    changes: {
      from: startIndex,
      to: startIndex + marker.length,
      insert: replacement,
    },
  });
}

function createMarkdownImageSnippet(url: string): string {
  return `![图片](${url})`;
}
