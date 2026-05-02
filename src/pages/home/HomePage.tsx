import { AlertTriangle, ArrowUpDown, RefreshCw, Sparkles, Target } from 'lucide-react';
import { useBarReady, useCountUp } from '../../hooks/uiHooks';
import { CURRENCY_SYMBOL, fmtD, formatMoney, formatSignedMoney } from '../../utils/format';
import { adaptAmountForDisplay, createCurrencyDisplayContext } from '../../utils/currencyDisplay';
import { BAR_DATA, CATS, FREQ, MONTHS } from '../../domain/constants';
import { AnimBar, Card, IB, SecLabel, SkeletonCard } from '../../components/common/ui';
import type { HomePageProps } from '../pageTypes';

export function HomePage({ txns, budgets, recurring, goals, loading, currency, recentQuickEntries = [], onQuickEntryOpen, t, r, f }: HomePageProps) {
  const income = txns.filter((x) => x.amount > 0).reduce((s, x) => s + x.amount, 0);
  const expense = txns.filter((x) => x.amount < 0).reduce((s, x) => s + Math.abs(x.amount), 0);
  const balance = income - expense;
  const sr = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  const dispBal = useCountUp(balance);
  const maxBar = Math.max(...BAR_DATA);
  const ready = useBarReady();

  const alerts = CATS.map((cat) => {
    const spent = txns.filter((x) => x.cat === cat && x.amount < 0).reduce((s, x) => s + Math.abs(x.amount), 0);
    const limit = budgets[cat] || 0;
    const pct = limit > 0 ? spent / limit : 0;
    return { cat, spent, limit, pct };
  })
    .filter((x) => x.pct >= 0.7 && x.limit > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2);

  const dueSummary = (() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);
    const in7Str = `${in7.getFullYear()}-${String(in7.getMonth() + 1).padStart(2, '0')}-${String(in7.getDate()).padStart(2, '0')}`;
    const activeRecurring = recurring.filter((x) => x.active);
    return {
      todayCount: activeRecurring.filter((x) => x.nextDate === today).length,
      due7Count: activeRecurring.filter((x) => x.nextDate > today && x.nextDate <= in7Str).length,
      overdueCount: activeRecurring.filter((x) => x.nextDate < today).length,
      activeCount: activeRecurring.length,
    };
  })();

  const recurringVisible = recurring
    .filter((x) => x.active)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
    .slice(0, 2);

  const hasRecurringAlert = dueSummary.todayCount > 0 || dueSummary.overdueCount > 0;
  const recurringSummaryColor = hasRecurringAlert ? t.negative : t.secondary;

  if (loading) {
    return (
      <div style={{ padding: '14px' }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} t={t} r={r} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '24px' }}>
      <div style={{ background: t.hero, borderRadius: r.card, margin: '14px 14px 12px', padding: '20px 20px 16px', boxShadow: t.shadow, animation: 'popIn 0.5s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ fontSize: '10px', color: t.heroSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>四月結餘</div>
        <div style={{ fontFamily: f.display, fontSize: '32px', fontWeight: 'bold', color: t.heroText, lineHeight: 1, marginBottom: '16px' }}>{formatMoney(dispBal, currency)}</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            ['收入', formatSignedMoney(income, currency)],
            ['支出', `-${formatMoney(expense, currency)}`],
            ['儲蓄率', `${sr}%`],
          ].map(([lbl, val], i) => (
            <div key={lbl} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: r.card === '28px' ? '16px' : '10px', padding: '9px 10px', opacity: 0, animation: `fadeIn 0.4s ease ${i * 100 + 200}ms both` }}>
              <div style={{ fontSize: '10px', color: t.heroSub }}>{lbl}</div>
              <div style={{ fontFamily: f.display, fontSize: '13px', fontWeight: '700', color: t.heroText }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '38px' }}>
          {BAR_DATA.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '100%' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: ready ? `${(v / maxBar) * 100}%` : '4px', minHeight: '4px', background: i === 5 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.28)', borderRadius: `${r.bar} ${r.bar} 2px 2px`, transition: `height 0.55s cubic-bezier(.4,0,.2,1) ${i * 55}ms` }} />
              </div>
              <span style={{ fontSize: '8px', color: t.heroSub }}>{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 14px', marginBottom: '12px' }}>
        <SecLabel C={Sparkles} label="快速記帳" t={t} />
        <Card t={t} r={r} delay={80}>
          <div style={{ padding: '12px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: recentQuickEntries.length > 0 ? '10px' : 0 }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: t.primary }}>一句話快速輸入</div>
                <div style={{ fontSize: '10px', color: t.secondary }}>支援收入、負數、幣別，例如：收入 300、-50、USD 20 lunch</div>
              </div>
              <button
                className="press"
                aria-label="首頁快速記一筆"
                onClick={() => onQuickEntryOpen?.()}
                style={{ border: 'none', background: t.chipActive, color: t.chipActiveText, borderRadius: r.chip, padding: '8px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
              >
                快速記一筆
              </button>
            </div>
            {recentQuickEntries.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {recentQuickEntries.slice(0, 4).map((entry) => (
                  <button
                    key={entry}
                    className="press"
                    aria-label={`首頁最近快速輸入${entry}`}
                    onClick={() => onQuickEntryOpen?.(entry)}
                    style={{ border: `1px solid ${t.border}`, background: t.surfaceAlt, color: t.primary, borderRadius: r.chip, padding: '6px 8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {goals.length > 0 && (
        <div style={{ padding: '0 14px', marginBottom: '12px' }}>
          <SecLabel C={Target} label="儲蓄目標" t={t} />
          <Card t={t} r={r} delay={100}>
            {goals.map((g, i) => {
              const pct = g.saved / g.target;
              return (
                <div key={g.id} style={{ padding: '11px 13px', borderBottom: i < goals.length - 1 ? `1px solid ${t.divider}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                    <span style={{ fontSize: '20px' }}>{g.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: t.primary }}>{g.name}</div>
                      <div style={{ fontSize: '10px', color: t.secondary }}>{formatMoney(g.saved, currency)} / {formatMoney(g.target, currency)}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: g.color }}>{Math.round(pct * 100)}%</span>
                  </div>
                  <AnimBar pct={pct} color={g.color} bg={t.barBg} r={r} delay={i * 100 + 200} />
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {alerts.length > 0 && (
        <div style={{ padding: '0 14px', marginBottom: '12px' }}>
          <SecLabel C={AlertTriangle} label="預算警示" t={t} />
          {alerts.map(({ cat, pct }, i) => {
            const col = pct >= 1 ? t.budgetOver : t.budgetWarn;
            return (
              <div key={cat} style={{ background: t.surface, borderRadius: r.card, padding: '11px 13px', border: `1px solid ${col}44`, marginBottom: '6px', boxShadow: t.cardShadow, opacity: 0, animation: `slideInR 0.35s ease ${i * 80}ms both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <IB cat={cat} t={{ ...t, expenseChip: t.warnChip, expenseIcon: col }} r={r} size={30} isz={14} />
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: '600', color: t.primary }}>{cat}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: col }}>{Math.round(pct * 100)}%</span>
                </div>
                <AnimBar pct={Math.min(pct, 1)} color={col} bg={t.barBg} r={r} />
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: '0 14px', marginBottom: '12px' }}>
        <SecLabel C={RefreshCw} label="即將扣款" t={t} />
        <Card t={t} r={r} delay={200}>
          <div aria-label="首頁定期提醒摘要" style={{ padding: '10px 13px', fontSize: '11px', color: recurringSummaryColor, borderBottom: recurringVisible.length > 0 ? `1px solid ${t.divider}` : 'none' }}>
            今日到期 {dueSummary.todayCount} 項 · 7 天內到期 {dueSummary.due7Count} 項 · 逾期未處理 {dueSummary.overdueCount} 項
          </div>
          {recurringVisible
            .map((rec, i) => (
              <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 13px', borderBottom: i < recurringVisible.length - 1 ? `1px solid ${t.divider}` : 'none' }}>
                <IB tx={{ name: rec.name, cat: rec.cat, amount: rec.amount }} t={t} r={r} size={34} isz={15} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: t.primary }}>{rec.name}</div>
                  <div style={{ fontSize: '10px', color: t.secondary }}>{FREQ[rec.freq]} · {rec.nextDate.slice(5).replace('-', '/')}</div>
                </div>
                <div style={{ fontFamily: f.display, fontSize: '13px', fontWeight: '700', color: rec.amount > 0 ? t.positive : t.negative }}>{formatSignedMoney(rec.amount, currency)}</div>
              </div>
            ))}
          {recurringVisible.length === 0 && (
            <div style={{ padding: '10px 13px', fontSize: '11px', color: t.secondary }}>
              {dueSummary.activeCount === 0 ? '目前沒有啟用中的定期帳目。' : '目前沒有可顯示的到期項目。'}
            </div>
          )}
        </Card>
      </div>

      <div style={{ padding: '0 14px' }}>
        <SecLabel C={ArrowUpDown} label="最近紀錄" t={t} />
        <Card t={t} r={r} style={{ overflow: 'hidden' }} delay={300}>
          {[...txns]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 4)
            .map((tx, i, arr) => (
              <div key={tx.id} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${t.divider}` : 'none', opacity: 0, animation: `rowIn 0.3s ease ${i * 50 + 300}ms both` }}>
                {(() => {
                  const amountView = adaptAmountForDisplay({ amount: tx.amount, ...createCurrencyDisplayContext(currency), originalCurrency: tx.originalCurrency });
                  const showCurrencySemantic = amountView.originalCurrency !== amountView.displayCurrency;
                  return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 13px' }}>
                  <IB tx={tx} t={t} r={r} size={36} isz={16} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: t.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</div>
                    <div style={{ fontSize: '10px', color: t.secondary }}>{tx.cat} · {fmtD(tx.date)}</div>
                    {showCurrencySemantic && <div style={{ fontSize: '10px', color: t.secondary }}>原始 {CURRENCY_SYMBOL[amountView.originalCurrency]}（未換算）</div>}
                  </div>
                  <div style={{ fontFamily: f.display, fontSize: '13px', fontWeight: '700', color: tx.amount > 0 ? t.positive : t.negative }}>{`${tx.amount > 0 ? '+' : ''}${amountView.formattedMoney}`}</div>
                </div>
                  );
                })()}
              </div>
            ))}
        </Card>
      </div>
    </div>
  );
}
