import type { CSSProperties } from 'react';
import { Home, ArrowUpDown, BarChart2, Settings, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Ico } from '../common/icons';
import type { ThemeFonts, ThemePalette, ThemeRadii } from '../../domain/types';
import type { AppTab } from '../../store/appStore';

type NavItem = { label: string; C: LucideIcon } | null;

type BottomNavProps = {
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
  screen: AppTab;
  onScreenChange: (tab: AppTab) => void;
  onAdd: () => void;
};

const NAV: NavItem[] = [
  { label: '總覽', C: Home },
  { label: '收支', C: ArrowUpDown },
  null,
  { label: '報表', C: BarChart2 },
  { label: '設定', C: Settings },
];

const TAB_BY_INDEX: Record<number, AppTab> = { 0: 0, 1: 1, 3: 3, 4: 4 };

export function BottomNav({ t, r, f, screen, onScreenChange, onAdd }: BottomNavProps) {
  return (
    <div style={{ background: t.navBg, borderTop: `1px solid ${t.navBorder}`, borderRadius: r.nav, display: 'flex', alignItems: 'center', height: '80px', flexShrink: 0, paddingBottom: '8px', transition: 'background 0.3s' }}>
      {NAV.map((item, i) => {
        if (!item) {
          return (
            <div key="fab" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div
                className="press"
                onClick={onAdd}
                aria-label="新增交易"
                style={{ width: '52px', height: '52px', borderRadius: r.fab, background: t.fabBg, display: 'flex', alignItems: 'center', justifyContent: 'center', '--fg': `${t.fabBg}88`, '--fr': `${t.fabBg}22`, boxShadow: `0 4px 20px ${t.fabBg}88`, transform: 'translateY(-14px)', cursor: 'pointer', userSelect: 'none', animation: 'fabPulse 3s ease-in-out infinite', transition: 'transform 0.1s' } as CSSProperties}
              >
                <Ico C={Plus} size={22} color={t.fabText} sw={2.5} />
              </div>
            </div>
          );
        }

        const tab = TAB_BY_INDEX[i];
        const active = screen === tab;

        return (
          <div
            key={i}
            className="press"
            onClick={() => onScreenChange(tab)}
            aria-label={`切換到${item.label}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer', paddingTop: '4px', transition: 'transform 0.1s' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: active ? t.accentSoft : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.22s' }}>
              <Ico C={item.C} size={18} color={active ? t.tabActive : t.tabInactive} sw={active ? 2 : 1.5} />
            </div>
            <span style={{ fontSize: '9px', fontFamily: f.body, color: active ? t.tabActive : t.tabInactive, fontWeight: active ? '600' : '400', transition: 'color 0.22s' }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
