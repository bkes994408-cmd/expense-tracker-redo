import { useMemo, useState } from 'react';
import { ArrowRightCircle, BarChart2, PiggyBank, Wallet } from 'lucide-react';
import { useBarReady } from '../../hooks/uiHooks';
import { formatAmount, formatMoney } from '../../utils/format';
import { createCurrencyDisplayContext, getDisplayCurrencySemanticHint } from '../../utils/currencyDisplay';
import type { DisplayCurrency } from '../../utils/format';
import { CAT_ICON, Box, Ico } from '../../components/common/icons';
import { AnimBar, Card, Seg } from '../../components/common/ui';
import type { BudgetMap, Goal, ThemeFonts, ThemePalette, ThemeRadii, Transaction } from '../../domain/types';

type ReportTabProps = {
  txns: Transaction[];
  summaryTxns?: Transaction[];
  currency: DisplayCurrency;
  budgets?: BudgetMap;
  goals?: Goal[];
  onJumpToSection?: (section: 'budget' | 'goals') => void;
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
};

export function ReportTab({ txns, summaryTxns, currency, budgets, goals, onJumpToSection, t, r, f }: ReportTabProps) {
  const SUMMARY_TOP_N = 3;
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);
  const [timeMode, setTimeMode] = useState<'month' | 'quarter'>('month');
  const [period, setPeriod] = useState<3 | 6 | 12>(6);
  const ready = useBarReady();
  const monthTxns = summaryTxns ?? txns;
  const currencyContext = createCurrencyDisplayContext(currency);
  const semanticHint = getDisplayCurrencySemanticHint(currencyContext);
  const budgetMap = budgets ?? ({} as BudgetMap);
  const goalList = goals ?? [];

  const totalBudget = Object.values(budgetMap).reduce((sum, value) => sum + value, 0);
  const spentByBudgetCategory = Object.entries(budgetMap)
    .map(([cat, limit]) => {
      const spent = monthTxns
        .filter((txn) => txn.amount < 0 && txn.cat === cat)
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
      const usage = limit > 0 ? spent / limit : 0;
      return { cat, limit, spent, usage };
    });
  const totalSpentForBudget = spentByBudgetCategory.reduce((sum, item) => sum + item.spent, 0);
  const overallBudgetUsage = totalBudget > 0 ? totalSpentForBudget / totalBudget : 0;
  const overspentCats = spentByBudgetCategory.filter((item) => item.limit > 0 && item.usage >= 1);
  const nearLimitCats = spentByBudgetCategory.filter((item) => item.limit > 0 && item.usage >= 0.85 && item.usage < 1);
  const formatTopCategorySummary = (items: typeof overspentCats) => {
    if (items.length === 0) return '目前無';
    const names = items.slice(0, SUMMARY_TOP_N).map((item) => item.cat).join('、');
    const more = items.length - SUMMARY_TOP_N;
    return more > 0 ? `${names} +${more}` : names;
  };

  const totalGoalTarget = goalList.reduce((sum, goal) => sum + Math.max(goal.target, 0), 0);
  const totalGoalSaved = goalList.reduce((sum, goal) => sum + Math.min(Math.max(goal.saved, 0), Math.max(goal.target, 0)), 0);
  const overallGoalProgress = totalGoalTarget > 0 ? totalGoalSaved / totalGoalTarget : 0;
  const rankedGoals = goalList
    .map((goal) => {
      const clampedTarget = Math.max(goal.target, 0);
      const clampedSaved = Math.min(Math.max(goal.saved, 0), clampedTarget);
      const progress = clampedTarget > 0 ? clampedSaved / clampedTarget : 0;
      const remaining = Math.max(clampedTarget - clampedSaved, 0);
      const isNearComplete = progress >= 0.8 && progress < 1;
      return { ...goal, progress, remaining, isNearComplete };
    })
    .sort((a, b) => {
      if (b.progress !== a.progress) return b.progress - a.progress;
      if (a.remaining !== b.remaining) return a.remaining - b.remaining;
      if (a.target !== b.target) return a.target - b.target;
      return a.id - b.id;
    });
  const closestGoal = rankedGoals[0];
  const nearCompleteGoals = rankedGoals.filter((goal) => goal.isNearComplete);

  const { monthKeys, trendData, sorted, total } = useMemo(() => {
    const exp = txns.filter((x) => x.amount < 0);
    const keys = Array.from({ length: period }, (_, index) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (period - 1 - index));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const byMonth: Record<string, number> = {};
    const byCat: Record<string, number> = {};

    exp.forEach((tx) => {
      const key = tx.date.slice(0, 7);
      if (!keys.includes(key)) return;
      byMonth[key] = (byMonth[key] ?? 0) + Math.abs(tx.amount);
      byCat[tx.cat] = (byCat[tx.cat] ?? 0) + Math.abs(tx.amount);
    });

    const monthTrend = keys.map((key) => byMonth[key] ?? 0);
    const quarterOrder: string[] = [];
    const quarterMap: Record<string, number> = {};

    keys.forEach((key, index) => {
      const month = Number(key.slice(5, 7));
      const quarter = Math.ceil(month / 3);
      const qKey = `${key.slice(0, 4)}-Q${quarter}`;
      if (!quarterOrder.includes(qKey)) quarterOrder.push(qKey);
      quarterMap[qKey] = (quarterMap[qKey] ?? 0) + monthTrend[index];
    });

    const trend = timeMode === 'month'
      ? monthTrend
      : quarterOrder.map((key) => quarterMap[key] ?? 0);
    const labels = timeMode === 'month' ? keys : quarterOrder;
    const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const totalExpense = Object.values(byCat).reduce((s, v) => s + v, 0) || 1;

    return { monthKeys: labels, trendData: trend, sorted: sortedCats, total: totalExpense };
  }, [txns, period, timeMode]);

  const hasTrendData = trendData.some((v) => v > 0);
  const fallbackActiveMonthKey = useMemo(() => {
    if (!hasTrendData) return null;
    const nonZero = trendData.findLastIndex((value) => value > 0);
    const fallbackIndex = nonZero >= 0 ? nonZero : trendData.length - 1;
    return monthKeys[fallbackIndex] ?? monthKeys[monthKeys.length - 1] ?? null;
  }, [hasTrendData, monthKeys, trendData]);
  const resolvedActiveMonthKey = activeMonthKey && monthKeys.includes(activeMonthKey)
    ? activeMonthKey
    : fallbackActiveMonthKey;
  const activeBar = resolvedActiveMonthKey ? monthKeys.indexOf(resolvedActiveMonthKey) : -1;
  const normalizedActiveBar = activeBar >= 0 ? activeBar : null;
  const maxBar = Math.max(...trendData, 1);
  const latestIndex = trendData.length - 1;
  const prevIndex = trendData.length - 2;
  const latestValue = latestIndex >= 0 ? trendData[latestIndex] ?? 0 : 0;
  const prevValue = prevIndex >= 0 ? trendData[prevIndex] ?? 0 : 0;
  const hasMoMBaseline = prevIndex >= 0 && prevValue > 0;
  const periodRate = hasMoMBaseline ? ((latestValue - prevValue) / prevValue) * 100 : null;
  const periodLabel = timeMode === 'month' ? '月' : '季';
  const compareLabel = timeMode === 'month' ? '環比（月對月）' : '環比（季對季）';
  const shortcutStyle = {
    marginTop: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    border: `1px solid ${t.divider}`,
    background: t.surface,
    color: t.secondary,
    borderRadius: r.chip,
    padding: '4px 8px',
    fontSize: '11px',
    cursor: 'pointer',
  } as const;

  const segState = sorted.reduce<{ deg: number; segs: string[] }>((state, [, val], i) => {
    const segmentDeg = (val / total) * 360;
    state.segs.push(`${t.donut[i % t.donut.length]} ${state.deg}deg ${state.deg + segmentDeg}deg`);
    return { deg: state.deg + segmentDeg, segs: state.segs };
  }, { deg: 0, segs: [] });
  const segs = segState.segs;

  return (
    <div>
      <Card t={t} r={r} style={{ padding: '14px', marginBottom: '12px' }}>
        <div style={{ fontSize: '10px', fontWeight: '600', color: t.secondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
          報表決策摘要（僅供檢視）
        </div>
        <div aria-label="報表決策摘要提示" style={{ fontSize: '11px', color: t.secondary, marginBottom: '10px' }}>
          口徑：本月預算/目標 + 近期趨勢區間；依目前資料即時計算。
        </div>
        <div aria-label="報表幣別口徑提示" style={{ fontSize: '11px', color: t.secondary, marginBottom: '10px' }}>
          {semanticHint}
        </div>

        <div aria-label="報表預算摘要" style={{ border: `1px solid ${t.divider}`, borderRadius: r.card, padding: '10px', marginBottom: '10px', background: t.surfaceAlt }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: t.primary, marginBottom: '4px' }}>預算使用摘要</div>
          {totalBudget <= 0 ? (
            <div style={{ fontSize: '12px', color: t.secondary }}>尚未設定預算，請到「預算」分頁設定後回來查看使用率。</div>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: t.secondary, marginBottom: '6px' }}>
                本月總預算使用率：<span style={{ color: t.primary, fontWeight: '700' }}>{Math.round(overallBudgetUsage * 100)}%</span>（{formatMoney(totalSpentForBudget, currency)} / {formatMoney(totalBudget, currency)}）
              </div>
              <div style={{ fontSize: '12px', color: t.secondary, marginBottom: nearLimitCats.length > 0 ? '4px' : 0 }}>
                已超支分類：<span style={{ color: overspentCats.length > 0 ? t.budgetOver : t.secondary, fontWeight: '700' }}>{overspentCats.length}</span>
                {`（${formatTopCategorySummary(overspentCats)}）`}
              </div>
              <div style={{ fontSize: '12px', color: nearLimitCats.length > 0 ? t.budgetWarn : t.secondary }}>
                接近超支提醒：<span style={{ fontWeight: '700' }}>{nearLimitCats.length}</span>
                {`（${formatTopCategorySummary(nearLimitCats)}）`}
              </div>
            </>
          )}
          <button
            className="press"
            type="button"
            aria-label="前往預算分頁查看摘要對應內容"
            onClick={() => onJumpToSection?.('budget')}
            style={shortcutStyle}
          >
            <Ico C={ArrowRightCircle} size={12} color={t.secondary} sw={2} />
            <span>前往預算查看</span>
          </button>
        </div>

        <div aria-label="報表目標摘要" style={{ border: `1px solid ${t.divider}`, borderRadius: r.card, padding: '10px', background: t.surfaceAlt }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: t.primary, marginBottom: '4px' }}>儲蓄目標摘要</div>
          {goalList.length === 0 ? (
            <div style={{ fontSize: '12px', color: t.secondary }}>目前沒有儲蓄目標，請到「目標」分頁新增後回來查看整體進度。</div>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: t.secondary, marginBottom: '6px' }}>
                目標整體進度：<span style={{ color: t.primary, fontWeight: '700' }}>{Math.round(overallGoalProgress * 100)}%</span>（{formatMoney(totalGoalSaved, currency)} / {formatMoney(totalGoalTarget, currency)}）
              </div>
              {closestGoal && (
                <div style={{ fontSize: '12px', color: t.secondary }}>
                  目前最接近完成：<span style={{ color: t.primary, fontWeight: '700' }}>{closestGoal.icon} {closestGoal.name}</span>（{Math.round(closestGoal.progress * 100)}%）
                </div>
              )}
              <div style={{ fontSize: '12px', color: t.secondary, marginTop: '4px' }}>
                即將完成（&ge;80%）：
                {nearCompleteGoals.length > 0
                  ? (
                    <span style={{ color: t.primary, fontWeight: '700' }}>
                      {nearCompleteGoals.slice(0, SUMMARY_TOP_N).map((goal) => `${goal.icon} ${goal.name}（${Math.round(goal.progress * 100)}%）`).join('、')}
                      {nearCompleteGoals.length > SUMMARY_TOP_N ? ` +${nearCompleteGoals.length - SUMMARY_TOP_N}` : ''}
                    </span>
                  )
                  : '目前無'}
              </div>
            </>
          )}
          <button
            className="press"
            type="button"
            aria-label="前往目標分頁查看摘要對應內容"
            onClick={() => onJumpToSection?.('goals')}
            style={shortcutStyle}
          >
            <Ico C={ArrowRightCircle} size={12} color={t.secondary} sw={2} />
            <span>前往目標查看</span>
          </button>
        </div>
      </Card>

      <Card t={t} r={r} style={{ padding: '14px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Ico C={BarChart2} size={12} color={t.secondary} sw={2} />
          <span style={{ fontSize: '10px', fontWeight: '600', color: t.secondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>月支出趨勢</span>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <Seg
            options={[
              ['month', '月'],
              ['quarter', '季'],
            ]}
            value={timeMode}
            onChange={(value) => setTimeMode(value as 'month' | 'quarter')}
            t={t}
            r={r}
            f={f}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <Seg
            options={[
              ['3', '近 3 月'],
              ['6', '近 6 月'],
              ['12', '近 12 月'],
            ]}
            value={String(period)}
            onChange={(value) => setPeriod(Number(value) as 3 | 6 | 12)}
            t={t}
            r={r}
            f={f}
          />
        </div>

        {hasTrendData && normalizedActiveBar !== null && (
          <div aria-label="月支出目前選取月份" style={{ marginBottom: '8px', border: `1px solid ${t.accent}`, background: t.accentSoft, borderRadius: r.input, padding: '8px 10px' }}>
            <div style={{ fontSize: '11px', color: t.secondary }}>目前選取{periodLabel}區間</div>
            <div style={{ fontSize: '13px', color: t.primary, fontFamily: f.display, fontWeight: '700' }}>
              {monthKeys[normalizedActiveBar]}：{formatMoney(Math.round(trendData[normalizedActiveBar]), currency)}
            </div>
          </div>
        )}
        {!hasTrendData && <div style={{ fontSize: '12px', color: t.secondary, marginBottom: '6px' }}>所選期間尚無支出資料，新增交易後會顯示趨勢與分類占比。</div>}
        <div aria-label="報表時間區間摘要" style={{ fontSize: '11px', color: t.secondary, marginBottom: '8px' }}>
          {`${timeMode === 'month' ? '月分析' : '季分析'} · 觀察最近 ${period} 個月（${monthKeys[0] ?? '-'} → ${monthKeys[monthKeys.length - 1] ?? '-'}）`}
        </div>
        <div aria-label="月對月變化率" style={{ fontSize: '11px', color: t.secondary, marginBottom: '8px' }}>
          {prevIndex < 0
            ? `${compareLabel}：資料不足（至少需要兩個${periodLabel}區間）。`
            : !hasMoMBaseline
              ? `${compareLabel}：${monthKeys[prevIndex]} 為 0，無法計算變化率。`
              : `${compareLabel}：${periodRate !== null && periodRate > 0 ? '↑' : '↓'} ${Math.abs(periodRate ?? 0).toFixed(1)}%（${monthKeys[prevIndex]} → ${monthKeys[latestIndex]}）`}
        </div>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', height: '72px' }}>
          {trendData.map((v, i) => (
            <div key={monthKeys[i]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', cursor: 'pointer' }} onMouseEnter={() => setActiveMonthKey(monthKeys[i])} onClick={() => setActiveMonthKey(monthKeys[i])} onTouchStart={() => setActiveMonthKey(monthKeys[i])}>
              <div style={{ minHeight: '14px', fontSize: '10px', fontWeight: i === normalizedActiveBar ? '700' : '500', color: i === normalizedActiveBar ? t.primary : t.secondary, opacity: v > 0 ? 1 : 0.75 }}>
                {v > 0 ? formatAmount(Math.round(v), currency) : '0'}
              </div>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div title={`${monthKeys[i]}：${formatMoney(Math.round(v), currency)}`} style={{ width: '100%', height: ready ? `${(v / maxBar) * 100}%` : '4px', minHeight: hasTrendData ? '4px' : '2px', background: i === normalizedActiveBar && hasTrendData ? t.accent : i === trendData.length - 1 && hasTrendData ? t.barFg : t.barBg, borderRadius: `${r.bar} ${r.bar} 2px 2px`, transition: `height 0.55s cubic-bezier(.4,0,.2,1) ${i * 35}ms`, outline: i === normalizedActiveBar ? `2px solid ${t.accent}` : 'none', outlineOffset: '1px' }} />
              </div>
              <div style={{ fontSize: '10px', color: i === normalizedActiveBar ? t.primary : t.tertiary, fontWeight: i === normalizedActiveBar ? '700' : '500' }}>
                {timeMode === 'month' ? monthKeys[i].slice(5).replace('-', '/') : monthKeys[i].replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card t={t} r={r} style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
          <Ico C={PiggyBank} size={12} color={t.secondary} sw={2} />
          <span style={{ fontSize: '10px', fontWeight: '600', color: t.secondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>支出分類排行與占比</span>
        </div>

        {sorted.length === 0 ? (
          <div style={{ border: `1px dashed ${t.divider}`, borderRadius: r.card, padding: '16px', textAlign: 'center', color: t.secondary, fontSize: '12px' }}>
            目前期間沒有支出分類可分析，先新增一筆支出再回來查看排行。
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '86px', height: '86px', borderRadius: '50%', background: `conic-gradient(${segs.join(', ')})` }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '46px', height: '46px', borderRadius: '50%', background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico C={Wallet} size={18} color={t.secondary} sw={1.5} /></div>
              </div>
              <div style={{ flex: 1 }}>
                {sorted.slice(0, 4).map(([cat, val], i) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: t.donut[i % t.donut.length] }} />
                    <span style={{ fontSize: '11px', color: t.secondary, flex: 1 }}>{cat}</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: t.primary }}>{Math.round((val / total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {sorted.map(([cat, val], i) => (
              <div key={cat} style={{ marginBottom: '9px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Ico C={CAT_ICON[cat as keyof typeof CAT_ICON] || Box} size={13} color={t.secondary} sw={1.75} /><span style={{ fontSize: '12px', color: t.secondary }}>{cat}</span></div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: t.primary, fontFamily: f.display }}>{formatMoney(val, currency)} ({Math.round((val / total) * 100)}%)</span>
                </div>
                <AnimBar pct={val / total} color={t.donut[i % t.donut.length]} bg={t.barBg} r={r} />
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  );
}
