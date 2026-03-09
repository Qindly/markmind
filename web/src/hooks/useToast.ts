// useToast.ts - 提供全站顶部消息的状态管理与触发方法
import * as React from 'react';

import type { ToastProps } from '../components/ui/Toast';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 220;

type ToastVariant = ToastProps['variant'];

export interface ToasterToast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface State {
  toasts: ToasterToast[];
}

type ToastInput = Omit<ToasterToast, 'id' | 'open' | 'onOpenChange'>;

type Action =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

const toastTimeouts = new Map<string, number>();
const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };
let toastCount = 0;

function generateToastID(): string {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = window.setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((toastItem) =>
          toastItem.id === action.toast.id ? { ...toastItem, ...action.toast } : toastItem,
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toastItem) => addToRemoveQueue(toastItem.id));
      }

      return {
        ...state,
        toasts: state.toasts.map((toastItem) =>
          toastId === undefined || toastItem.id === toastId ? { ...toastItem, open: false } : toastItem,
        ),
      };
    }

    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }

      return {
        ...state,
        toasts: state.toasts.filter((toastItem) => toastItem.id !== action.toastId),
      };

    default:
      return state;
  }
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

/**
 * toast - 触发一条全站顶部消息。
 * 参数 props: 消息内容、视觉变体和持续时间。
 * 返回值：当前消息的更新与关闭方法。
 */
export function toast(props: ToastInput) {
  const id = generateToastID();

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });
  const update = (nextProps: Partial<ToastInput>) => dispatch({ type: 'UPDATE_TOAST', toast: { id, ...nextProps } });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismiss();
        }
      },
    },
  });

  return { id, dismiss, update };
}

/**
 * useToast - 读取当前消息状态并提供关闭方法。
 * 返回值：当前消息列表、触发函数与关闭函数。
 */
export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}