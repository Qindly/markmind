// useDebouncedValue.ts - 提供通用的值防抖 Hook
import { useEffect, useState } from 'react';

/**
 * useDebouncedValue - 在输入值稳定一段时间后再输出最新值。
 * 参数 value: 当前实时值。
 * 参数 delay: 防抖等待时长，单位毫秒。
 * 返回值：延迟更新后的稳定值。
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerID = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timerID);
    };
  }, [delay, value]);

  return debouncedValue;
}
