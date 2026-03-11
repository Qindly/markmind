// isRequestCanceled.ts - 判断 axios 请求是否因主动取消而失败
import axios from 'axios';

/**
 * isRequestCanceled - 判断当前错误是否属于主动取消请求。
 * 参数 error: 请求抛出的未知错误。
 * 返回值：如果是取消请求导致的错误则返回 true。
 */
export function isRequestCanceled(error: unknown): boolean {
  if (axios.isCancel(error)) {
    return true;
  }

  return axios.isAxiosError(error) && error.code === 'ERR_CANCELED';
}
