import { useRef, useState } from 'react';

export type ToastItem = { id: number; msg: string; type: 'ok' | 'warn' };

export function useToastQueue(timeoutMs: number = 2400) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeqRef = useRef(1);

  function toast(msg: string, type: 'ok' | 'warn' = 'ok') {
    const id = Date.now() * 1000 + toastSeqRef.current++;
    setToasts((q) => [...q, { id, msg, type }]);
    setTimeout(() => setToasts((q) => q.filter((x) => x.id !== id)), timeoutMs);
  }

  return { toasts, toast };
}
