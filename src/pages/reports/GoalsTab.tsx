import { useState } from 'react';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { Ico } from '../../components/common/icons';
import { adaptAmountForDisplay, createCurrencyDisplayContext, getDisplayCurrencySemanticHint } from '../../utils/currencyDisplay';
import type { DisplayCurrency } from '../../utils/format';
import type { Goal, ThemeFonts, ThemePalette, ThemeRadii } from '../../domain/types';

type GoalsTabProps = {
  goals: Goal[];
  currency: DisplayCurrency;
  setGoals: (updater: Goal[] | ((prev: Goal[]) => Goal[])) => void;
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
};

type DraftGoal = { name: string; target: string; saved: string; icon: string };

const EMOJIS = ['🎯', '✈️', '💻', '🏠', '🚗', '📱', '🎓', '💍', '⛵', '🎮'];

export function GoalsTab({ goals, currency, setGoals, t, r, f }: GoalsTabProps) {
  const [adding, setAdding] = useState(false);
  const [newGoal, setNewGoal] = useState<DraftGoal>({ name: '', target: '', saved: '', icon: '🎯' });
  const currencyContext = createCurrencyDisplayContext(currency);
  const semanticHint = getDisplayCurrencySemanticHint(currencyContext);
  const displayMoney = (amount: number) => adaptAmountForDisplay({ amount, ...currencyContext }).formattedMoney;

  const addGoal = () => {
    if (!newGoal.name || !newGoal.target) return;
    setGoals((p) => [
      ...p,
      {
        id: Date.now(),
        name: newGoal.name,
        target: parseInt(newGoal.target, 10),
        saved: parseInt(newGoal.saved, 10) || 0,
        icon: newGoal.icon,
        color: t.goalColor,
      },
    ]);
    setNewGoal({ name: '', target: '', saved: '', icon: '🎯' });
    setAdding(false);
  };

  return (
    <div aria-label="目標分頁內容">
      <div aria-label="目標幣別口徑提示" style={{ fontSize: '10px', color: t.secondary, marginBottom: '8px' }}>{semanticHint}</div>
      {goals.map((g) => {
        const pct = g.saved / g.target;
        return (
          <div key={g.id} style={{ background: t.surface, borderRadius: r.card, padding: '14px', border: `1px solid ${t.border}`, marginBottom: '10px', boxShadow: t.cardShadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '26px' }}>{g.icon}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: '700', color: t.primary }}>{g.name}</div><div style={{ fontSize: '11px', color: t.secondary }}>{displayMoney(g.saved)} / {displayMoney(g.target)}</div></div>
              {pct >= 1 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: t.incomeChip, borderRadius: '50px', padding: '4px 10px' }}>
                  <Ico C={Trophy} size={13} color={t.income} sw={2} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: t.income }}>達成！</span>
                </div>
              ) : (
                <span style={{ fontSize: '16px', fontWeight: '800', color: g.color, fontFamily: f.display }}>{Math.round(pct * 100)}%</span>
              )}
            </div>
            <div style={{ height: '8px', background: t.barBg, borderRadius: '50px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${Math.min(pct, 1) * 100}%`, background: g.color, borderRadius: '50px' }} />
            </div>
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
              {[1000, 5000, 10000].map((v) => (
                <button key={v} className="press" onClick={() => setGoals((p) => p.map((x) => (x.id === g.id ? { ...x, saved: Math.min(x.saved + v, x.target) } : x)))} style={{ flex: 1, background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '5px 0', fontSize: '11px', cursor: 'pointer' }}>+{(v / 1000).toFixed(0)}K</button>
              ))}
              <button className="press" onClick={() => setGoals((p) => p.filter((x) => x.id !== g.id))} style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '5px 8px', cursor: 'pointer', display: 'flex' }}>
                <Ico C={Trash2} size={13} color={t.secondary} sw={2} />
              </button>
            </div>
          </div>
        );
      })}

      {adding ? (
        <div style={{ background: t.surface, borderRadius: r.card, padding: '14px', border: `1px solid ${t.border}`, boxShadow: t.cardShadow }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setNewGoal((p) => ({ ...p, icon: e }))} style={{ fontSize: '18px', background: newGoal.icon === e ? t.chipActive : 'none', border: `1px solid ${newGoal.icon === e ? t.chipActive : t.border}`, borderRadius: '8px', padding: '4px 6px', cursor: 'pointer' }}>{e}</button>
            ))}
          </div>
          {([
            ['name', '目標名稱', 'text'],
            ['target', '目標金額', 'number'],
            ['saved', '已存金額', 'number'],
          ] as const).map(([k, ph, tp]) => (
            <input key={k} type={tp} value={newGoal[k]} onChange={(e) => setNewGoal((p) => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.input, padding: '10px 12px', fontSize: '13px', marginBottom: '8px' }} />
          ))}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="press" onClick={addGoal} style={{ flex: 1, background: t.chipActive, color: t.chipActiveText, border: 'none', borderRadius: r.input, padding: '11px' }}>新增</button>
            <button className="press" onClick={() => setAdding(false)} style={{ flex: 1, background: t.surfaceAlt, color: t.secondary, border: 'none', borderRadius: r.input, padding: '11px' }}>取消</button>
          </div>
        </div>
      ) : (
        <button className="press" onClick={() => setAdding(true)} style={{ width: '100%', background: t.surfaceAlt, color: t.secondary, border: `2px dashed ${t.border}`, borderRadius: r.card, padding: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Ico C={Plus} size={16} color={t.secondary} sw={2} /> 新增儲蓄目標
        </button>
      )}
    </div>
  );
}
