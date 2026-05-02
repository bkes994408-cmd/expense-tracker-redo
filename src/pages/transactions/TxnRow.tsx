import type { KeyboardEvent, MouseEvent, PointerEvent, TouchEvent } from 'react';
import { useRef, useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { CURRENCY_SYMBOL, type DisplayCurrency } from '../../utils/format';
import { adaptAmountForDisplay, createCurrencyDisplayContext } from '../../utils/currencyDisplay';
import { useMounted } from '../../hooks/uiHooks';
import { Ico } from '../../components/common/icons';
import { IB } from '../../components/common/ui';
import type { ThemeFonts, ThemePalette, ThemeRadii, Transaction } from '../../domain/types';

type TxnRowProps = {
  tx: Transaction;
  currency: DisplayCurrency;
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
  index?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function TxnRow({ tx, currency, t, r, f, onEdit, onDelete, index = 0, isOpen, onOpenChange }: TxnRowProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dying, setDying] = useState(false);
  const sX = useRef<number | null>(null);
  const sY = useRef<number | null>(null);
  const startDx = useRef(0);
  const axisLock = useRef<'x' | 'y' | null>(null);
  const lastMoveX = useRef<number | null>(null);
  const lastMoveAt = useRef<number | null>(null);
  const velocityX = useRef(0);
  const on = useMounted(index * 35);

  const MAX = 130;
  const THR = 60;
  const FLICK_VELOCITY = 0.45;
  const OVERSHOOT = 24;
  const visualDx = typeof isOpen === 'boolean' && !dragging ? (isOpen ? -MAX : 0) : dx;
  const resolvedOpen = isOpen ?? visualDx !== 0;

  const applyOpenState = (open: boolean) => {
    setDx(open ? -MAX : 0);
    onOpenChange?.(open);
  };

  const startDrag = (clientX: number, clientY = 0) => {
    const now = Date.now();
    sX.current = clientX;
    sY.current = clientY;
    startDx.current = visualDx;
    axisLock.current = null;
    lastMoveX.current = clientX;
    lastMoveAt.current = now;
    velocityX.current = 0;
    setDragging(false);
  };

  const moveDrag = (clientX: number, clientY = 0) => {
    if (sX.current === null || sY.current === null) return;
    const deltaX = clientX - sX.current;
    const deltaY = clientY - sY.current;

    if (!axisLock.current) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      axisLock.current = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y';
    }

    if (axisLock.current !== 'x') return;

    const now = Date.now();
    if (lastMoveX.current !== null && lastMoveAt.current !== null) {
      const deltaTime = Math.max(now - lastMoveAt.current, 1);
      velocityX.current = (clientX - lastMoveX.current) / deltaTime;
    }
    lastMoveX.current = clientX;
    lastMoveAt.current = now;

    if (Math.abs(deltaX) > 5) setDragging(true);

    const rawDx = startDx.current + deltaX;
    let nextDx = rawDx;
    if (rawDx < -MAX) {
      const overshoot = Math.min(Math.abs(rawDx + MAX) * 0.35, OVERSHOOT);
      nextDx = -MAX - overshoot;
    } else if (rawDx > 0) {
      const overshoot = Math.min(rawDx * 0.35, OVERSHOOT);
      nextDx = overshoot;
    }

    setDx(nextDx);
  };

  const endDrag = () => {
    sX.current = null;
    sY.current = null;
    axisLock.current = null;
    lastMoveX.current = null;
    lastMoveAt.current = null;
    setDragging(false);

    const currentDx = visualDx;
    const currentVelocity = velocityX.current;
    const shouldOpenByVelocity = currentVelocity <= -FLICK_VELOCITY;
    const shouldCloseByVelocity = currentVelocity >= FLICK_VELOCITY;
    const shouldOpenByDistance = currentDx <= -THR;
    const shouldCloseByDistance = currentDx >= -THR / 2;
    velocityX.current = 0;

    let nextOpen = resolvedOpen;
    if (shouldOpenByVelocity) nextOpen = true;
    else if (shouldCloseByVelocity) nextOpen = false;
    else if (shouldOpenByDistance) nextOpen = true;
    else if (shouldCloseByDistance) nextOpen = false;
    else nextOpen = Math.abs(currentDx) >= THR;

    setDx(nextOpen ? -MAX : 0);
    onOpenChange?.(nextOpen);
  };

  const down = (e: MouseEvent<HTMLDivElement>) => {
    startDrag(e.clientX, e.clientY);
  };

  const move = (e: MouseEvent<HTMLDivElement>) => {
    moveDrag(e.clientX, e.clientY);
  };

  const up = () => {
    endDrag();
  };

  const pointerDown = (e: PointerEvent<HTMLDivElement>) => {
    startDrag(e.clientX, e.clientY);
  };

  const pointerMove = (e: PointerEvent<HTMLDivElement>) => {
    moveDrag(e.clientX, e.clientY);
  };

  const pointerUp = () => {
    endDrag();
  };

  const touchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    startDrag(touch.clientX, touch.clientY);
  };

  const touchMove = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    moveDrag(touch.clientX, touch.clientY);
  };

  const touchEnd = () => {
    endDrag();
  };

  const kill = () => {
    setDying(true);
    setTimeout(() => onDelete(tx.id), 360);
  };

  const keyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && resolvedOpen) {
      e.preventDefault();
      applyOpenState(false);
      return;
    }

    if ((e.key === 'Enter' || e.key === ' ') && !dragging) {
      e.preventDefault();
      if (resolvedOpen) {
        applyOpenState(false);
      } else {
        onEdit(tx);
      }
    }
  };

  const revealDx = Math.min(Math.abs(visualDx), MAX);
  const lp = Math.min(revealDx / MAX, 1);
  const actionLabelOpacity = Math.max(0, (lp - 0.22) / 0.78);
  const rowLift = dragging ? Math.min(lp * 6, 6) : 0;
  const ew = Math.round(lp * 60);
  const dw = Math.round(lp * 64);
  const amountView = adaptAmountForDisplay({ amount: tx.amount, ...createCurrencyDisplayContext(currency), originalCurrency: tx.originalCurrency });
  const showCurrencySemantic = amountView.originalCurrency !== amountView.displayCurrency;

  return (
    <div
      style={{
        maxHeight: dying ? '0' : '80px',
        opacity: dying ? 0 : on ? 1 : 0,
        transform: dying ? 'translateX(110%)' : on ? 'none' : 'translateX(-10px)',
        transition: 'opacity 0.35s,transform 0.35s',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'stretch',
            pointerEvents: visualDx < -THR / 2 ? 'auto' : 'none',
          }}
        >
          <div aria-label={`編輯${tx.name}`} onClick={() => { applyOpenState(false); onEdit(tx); }} style={{ width: `${ew}px`, background: t.swipeEdit, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
            {ew > 28 && <Ico C={Edit3} size={17} color="#fff" sw={2} />}
            {ew > 42 && <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', opacity: actionLabelOpacity, transform: `translateY(${(1 - actionLabelOpacity) * 4}px)` }}>編輯</span>}
          </div>
          <div aria-label={`刪除${tx.name}`} onClick={kill} style={{ width: `${dw}px`, background: t.swipeDel, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
            {dw > 28 && <Ico C={Trash2} size={17} color="#fff" sw={2} />}
            {dw > 42 && <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', opacity: actionLabelOpacity, transform: `translateY(${(1 - actionLabelOpacity) * 4}px)` }}>刪除</span>}
          </div>
        </div>

        <div
          aria-label={`交易列${tx.name}`}
          aria-expanded={resolvedOpen}
          role="button"
          tabIndex={0}
          data-swipe-state={resolvedOpen ? 'open' : 'closed'}
          data-swipe-progress={lp.toFixed(2)}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onMouseDown={down}
          onMouseMove={move}
          onMouseUp={up}
          onMouseLeave={up}
          onTouchStart={touchStart}
          onTouchMove={touchMove}
          onTouchEnd={touchEnd}
          onTouchCancel={touchEnd}
          onKeyDown={keyDown}
          onClick={() => {
            if (dragging) return;
            if (resolvedOpen) {
              applyOpenState(false);
              return;
            }
            onEdit(tx);
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 14px',
            cursor: 'pointer',
            background: t.surface,
            transform: `translateX(${visualDx}px) translateY(${-rowLift}px)`,
            transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease',
            userSelect: 'none',
            touchAction: 'pan-y',
            boxShadow: dragging || resolvedOpen ? '0 8px 18px rgba(15,23,42,0.10)' : 'none',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <IB tx={tx} t={t} r={r} size={40} isz={18} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: t.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</div>
            <div style={{ fontSize: '11px', color: t.secondary, marginTop: '1px' }}>{tx.cat} · {tx.time}</div>
            {showCurrencySemantic && (
              <div aria-label={`交易幣別語意${tx.name}`} style={{ fontSize: '10px', color: t.secondary, marginTop: '2px' }}>
                原始 {CURRENCY_SYMBOL[amountView.originalCurrency]} → 顯示 {CURRENCY_SYMBOL[amountView.displayCurrency]}（未換算）
              </div>
            )}
          </div>
          <div style={{ fontFamily: f.display, fontSize: '14px', fontWeight: '700', color: tx.amount > 0 ? t.positive : t.negative, flexShrink: 0 }}>
            {`${tx.amount > 0 ? '+' : ''}${amountView.formattedMoney}`}
          </div>
        </div>
      </div>
    </div>
  );
}
