import { Trash2, Check } from 'lucide-react';
import { Ico } from './icons';
import type { ThemeFonts, ThemePalette } from '../../domain/types';

type ToastItem = {
  id: number;
  msg: string;
  type: 'ok' | 'warn';
};

type ToastStackProps = {
  toasts: ToastItem[];
  t: ThemePalette;
  f: ThemeFonts;
};

export function ToastStack({ toasts, t, f }: ToastStackProps) {
  return (
    <>
      {toasts.map((toast, i) => (
        <div key={toast.id} style={{ position: 'absolute', bottom: `${88 + i * 44}px`, left: '50%', background: toast.type === 'warn' ? t.negative : t.primary, color: t.bg, padding: '8px 16px', borderRadius: '50px', fontSize: '12px', fontFamily: f.body, fontWeight: '600', pointerEvents: 'none', zIndex: 200, whiteSpace: 'nowrap', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: '6px', animation: 'toastIn 0.3s cubic-bezier(.34,1.56,.64,1) both' }}>
          <Ico C={toast.type === 'warn' ? Trash2 : Check} size={12} color={t.bg} sw={2.5} />
          {toast.msg}
        </div>
      ))}
    </>
  );
}
