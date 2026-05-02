import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Info } from 'lucide-react';
import { useBarReady, useMounted } from '../../hooks/uiHooks';
import { Box, CAT_ICON, getIC, Ico } from './icons';
import type { Category, ThemeFonts, ThemePalette, ThemeRadii, Transaction } from '../../domain/types';

type CardProps = {
  t: ThemePalette;
  r: ThemeRadii;
  children: ReactNode;
  style?: CSSProperties;
  delay?: number;
};

export function Card({ t, r, children, style = {}, delay = 0 }: CardProps) {
  const on = useMounted(delay);
  return (
    <div
      style={{
        background: t.surface,
        borderRadius: r.card,
        border: `1px solid ${t.border}`,
        boxShadow: t.cardShadow,
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(10px)',
        transition: 'opacity 0.38s ease,transform 0.38s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type ChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  t: ThemePalette;
  r: ThemeRadii;
  C?: LucideIcon;
  isz?: number;
};

export function Chip({ label, active, onClick, t, r, C, isz = 13 }: ChipProps) {
  return (
    <button
      className="press"
      onClick={onClick}
      style={{
        background: active ? t.chipActive : t.chip,
        color: active ? t.chipActiveText : t.chipText,
        border: 'none',
        borderRadius: r.chip,
        padding: '6px 13px',
        fontSize: '12px',
        fontFamily: 'inherit',
        fontWeight: active ? '600' : '400',
        cursor: 'pointer',
        transition: 'background 0.18s,color 0.18s',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}
    >
      {C && <Ico C={C} size={isz} color={active ? t.chipActiveText : t.chipText} sw={2} />}
      {label}
    </button>
  );
}

type SegProps<T extends string> = {
  options: ReadonlyArray<readonly [T, string]>;
  value: T;
  onChange: (value: T) => void;
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
};

export function Seg<T extends string>({ options, value, onChange, t, r, f }: SegProps<T>) {
  return (
    <div style={{ display: 'flex', background: t.surfaceAlt, borderRadius: r.input, padding: '3px', gap: '2px' }}>
      {options.map(([id, lbl]) => (
        <button
          key={id}
          className="press"
          onClick={() => onChange(id)}
          style={{
            flex: 1,
            background: value === id ? t.chipActive : 'transparent',
            color: value === id ? t.chipActiveText : t.secondary,
            border: 'none',
            borderRadius: r.input,
            padding: '8px',
            fontSize: '12px',
            fontFamily: f.body,
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s,color 0.2s',
          }}
        >
          {lbl}
        </button>
      ))}
    </div>
  );
}

type ToggleProps = { on: boolean; onToggle: () => void; t: ThemePalette };

export function Toggle({ on, onToggle, t }: ToggleProps) {
  return (
    <div onClick={onToggle} style={{ width: '44px', height: '24px', borderRadius: '50px', background: on ? t.chipActive : t.chip, position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '2px', left: on ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: on ? t.chipActiveText : t.secondary, transition: 'left 0.25s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.22)' }} />
    </div>
  );
}

type IBProps = {
  tx?: Pick<Transaction, 'name' | 'cat' | 'amount'>;
  cat?: Category;
  t: ThemePalette;
  r: ThemeRadii;
  size?: number;
  isz?: number;
};

export function IB({ tx, cat, t, r, size = 40, isz = 18 }: IBProps) {
  const isInc = tx ? tx.amount > 0 : cat === '收入';
  const C = tx ? getIC(tx) : CAT_ICON[cat ?? '其他'] || Box;
  return (
    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: r.icon, background: isInc ? t.incomeChip : t.expenseChip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
      <Ico C={C} size={isz} color={isInc ? t.incomeIcon : t.expenseIcon} sw={1.75} />
    </div>
  );
}

type SecLabelProps = { C: LucideIcon; label: string; t: ThemePalette };

export function SecLabel({ C, label, t }: SecLabelProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
      <Ico C={C} size={12} color={t.secondary} sw={2} />
      <span style={{ fontSize: '10px', fontWeight: '600', color: t.secondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

type AnimBarProps = { pct: number; color: string; bg: string; r: ThemeRadii; delay?: number };

export function AnimBar({ pct, color, bg, delay = 0 }: AnimBarProps) {
  const ready = useBarReady();
  return (
    <div style={{ height: '4px', background: bg, borderRadius: '50px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: ready ? `${Math.min(pct, 1) * 100}%` : '0%', background: color, borderRadius: '50px', transition: `width 0.7s cubic-bezier(.4,0,.2,1) ${delay}ms` }} />
    </div>
  );
}

type SkeletonProps = {
  t: ThemePalette;
  w?: string;
  h?: number;
  radius?: string;
  style?: CSSProperties;
};

export function Skeleton({ t, w = '100%', h = 14, radius = '6px', style = {} }: SkeletonProps) {
  return <div style={{ width: w, height: `${h}px`, borderRadius: radius, background: t.shimmer, backgroundSize: '800px 100%', animation: 'shimmer 1.5s infinite', ...style }} />;
}

export function SkeletonCard({ t, r }: { t: ThemePalette; r: ThemeRadii }) {
  return (
    <Card t={t} r={r} style={{ padding: '14px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton t={t} w="40px" h={40} radius={r.icon} />
        <div style={{ flex: 1 }}><Skeleton t={t} w="55%" h={13} style={{ marginBottom: '6px' }} /><Skeleton t={t} w="35%" h={10} /></div>
        <Skeleton t={t} w="60px" h={16} />
      </div>
    </Card>
  );
}

type RiskNoticeProps = {
  title: string;
  body: string;
  tone?: 'neutral' | 'warn';
  t: ThemePalette;
  r: ThemeRadii;
  ariaLabel?: string;
};

export function RiskNotice({ title, body, tone = 'neutral', t, r, ariaLabel }: RiskNoticeProps) {
  const isWarn = tone === 'warn';
  const borderColor = isWarn ? t.negative : t.divider;
  const iconBg = isWarn ? t.negative : t.surfaceAlt;
  const iconColor = isWarn ? '#fff' : t.accent;
  const background = isWarn ? t.accentSoft : t.surfaceAlt;

  return (
    <div aria-label={ariaLabel} style={{ border: `1px solid ${borderColor}`, borderRadius: r.input, padding: '10px', background, fontSize: '11px', lineHeight: 1.45, color: t.secondary, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '999px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        <Ico C={isWarn ? AlertTriangle : Info} size={12} color={iconColor} sw={2} />
      </div>
      <div>
        <div style={{ color: t.primary, fontWeight: 700, marginBottom: '2px' }}>{title}</div>
        <div>{body}</div>
      </div>
    </div>
  );
}
