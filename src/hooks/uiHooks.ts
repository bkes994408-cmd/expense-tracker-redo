import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, dur = 900) {
  const [v, setV] = useState(0);
  const ref = useRef(target);

  useEffect(() => {
    const from = ref.current;
    ref.current = target;

    let s: number | null = null;
    const step = (ts: number) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(from + (target - from) * e));
      if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, dur]);

  return v;
}

export function useMounted(delay = 0) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return on;
}

export function useBarReady() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setR(true), 100);
    return () => clearTimeout(t);
  }, []);
  return r;
}
