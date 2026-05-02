import { useState } from 'react';
import { Check, Edit3 } from 'lucide-react';
import { CATS } from '../../domain/constants';
import { adaptAmountForDisplay, createCurrencyDisplayContext, getDisplayCurrencySemanticHint } from '../../utils/currencyDisplay';
import type { DisplayCurrency } from '../../utils/format';
import { Ico } from '../../components/common/icons';
import { AnimBar, Card } from '../../components/common/ui';
import type { BudgetMap, ThemeFonts, ThemePalette, ThemeRadii, Transaction } from '../../domain/types';

type BudgetTabProps = {
  txns: Transaction[];
  currency: DisplayCurrency;
  budgets: BudgetMap;
  setBudgets: (updater: BudgetMap | ((prev: BudgetMap) => BudgetMap)) => void;
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
};

export function BudgetTab({ txns, currency, budgets, setBudgets, t, r, f }: BudgetTabProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const currencyContext = createCurrencyDisplayContext(currency);
  const semanticHint = getDisplayCurrencySemanticHint(currencyContext);
  const displayMoney = (amount: number) => adaptAmountForDisplay({ amount, ...currencyContext }).formattedMoney;

  const totalB = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalS = txns.filter((x) => x.amount < 0).reduce((s, x) => s + Math.abs(x.amount), 0);
  const oPct = totalB > 0 ? totalS / totalB : 0;
  const oCol = oPct >= 1 ? t.budgetOver : oPct >= 0.7 ? t.budgetWarn : t.budgetOk;

  return (
    <div aria-label="預算分頁內容">
      <Card t={t} r={r} style={{ padding: '14px', marginBottom: '12px' }}>
        <div style={{ fontSize: '10px', color: t.secondary, marginBottom: '4px' }}>本月總預算</div>
        <div aria-label="預算幣別口徑提示" style={{ fontSize: '10px', color: t.secondary, marginBottom: '6px' }}>{semanticHint}</div>
        <div style={{ fontFamily: f.display, fontSize: '20px', fontWeight: '700', color: t.primary, marginBottom: '8px' }}>
          {displayMoney(totalS)}<span style={{ fontSize: '13px', color: t.secondary, fontFamily: f.body, fontWeight: '400' }}> / {displayMoney(totalB)}</span>
        </div>
        <AnimBar pct={Math.min(oPct, 1)} color={oCol} bg={t.barBg} r={r} />
      </Card>

      {CATS.map((cat) => {
        const spent = txns.filter((x) => x.cat === cat && x.amount < 0).reduce((s, x) => s + Math.abs(x.amount), 0);
        const limit = budgets[cat] ?? 0;
        const pct = limit > 0 ? spent / limit : 0;
        const col = pct >= 1 ? t.budgetOver : pct >= 0.7 ? t.budgetWarn : t.budgetOk;
        const isE = editing === cat;

        return (
          <div key={cat} style={{ background: t.surface, borderRadius: r.card, padding: '12px 13px', border: `1px solid ${t.border}`, marginBottom: '8px', boxShadow: t.cardShadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: t.primary }}>{cat}</span>
              {isE ? (
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <input type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)} autoFocus style={{ width: '80px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.chip, padding: '4px 8px', fontSize: '12px', color: t.primary, outline: 'none', textAlign: 'right' }} />
                  <button
                    className="press"
                    aria-label={`儲存${cat}預算`}
                    onClick={() => {
                      setBudgets((p) => ({ ...p, [cat]: parseInt(editVal, 10) || 0 }));
                      setEditing(null);
                    }}
                    style={{ background: t.chipActive, color: t.chipActiveText, border: 'none', borderRadius: r.chip, padding: '5px 8px', cursor: 'pointer', display: 'flex' }}
                  >
                    <Ico C={Check} size={13} color={t.chipActiveText} sw={2.5} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: t.primary, fontFamily: f.display }}>{displayMoney(limit)}</span>
                  <button
                    className="press"
                    aria-label={`編輯${cat}預算`}
                    onClick={() => {
                      setEditing(cat);
                      setEditVal(String(limit));
                    }}
                    style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: '7px', padding: '3px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Ico C={Edit3} size={11} color={t.secondary} sw={2} /><span style={{ fontSize: '10px', color: t.secondary }}>編輯</span>
                  </button>
                </div>
              )}
            </div>
            <AnimBar pct={Math.min(pct, 1)} color={col} bg={t.barBg} r={r} />
          </div>
        );
      })}
    </div>
  );
}
