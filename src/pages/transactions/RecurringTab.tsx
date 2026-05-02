import { CalendarDays, Edit3, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FREQ } from '../../domain/constants';
import { shiftRecurringDate } from '../../domain/recurring';
import { formatMoney, formatSignedMoney } from '../../utils/format';
import type { DisplayCurrency } from '../../utils/format';
import { Ico } from '../../components/common/icons';
import { Card, IB, Seg, Toggle } from '../../components/common/ui';
import type { RecurringAutoPostMode, RecurringConfirmDateStrategy, RecurringItem, ThemeFonts, ThemePalette, ThemeRadii } from '../../domain/types';

type RecurringTabProps = {
  recurring: RecurringItem[];
  currency: DisplayCurrency;
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
  onChange: (id: number, active: boolean) => void;
  onBatchResult?: (result: { action: 'enable' | 'disable' | 'confirm-pending' | 'skip-pending'; affected: number; target: number; names?: string[] }) => void;
  onSave: (id: number, patch: Partial<RecurringItem>) => void;
  onDelete: (id: number) => void;
  onConfirmPending?: (id: number, strategy: RecurringConfirmDateStrategy) => void;
  onSkipPending?: (id: number) => void;
};

const AUTO_POST_MODE_TEXT: Record<RecurringAutoPostMode, string> = {
  off: '關閉',
  on: '自動入帳',
  confirm: '待確認',
};

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function RecurringTab({ recurring, currency, t, r, f, onChange, onBatchResult, onSave, onDelete, onConfirmPending, onSkipPending }: RecurringTabProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftAmount, setDraftAmount] = useState('0');
  const [draftFreq, setDraftFreq] = useState<RecurringItem['freq']>('monthly');
  const [draftNextDate, setDraftNextDate] = useState('');
  const [draftAutoPostMode, setDraftAutoPostMode] = useState<RecurringAutoPostMode>('off');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'today' | 'due7' | 'overdue' | 'pending'>('all');
  const [nameQuery, setNameQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmDateStrategy, setConfirmDateStrategy] = useState<RecurringConfirmDateStrategy>('today');
  const [referenceNow] = useState(() => Date.now());

  const active = recurring.filter((x) => x.active);
  const mo = active.reduce((s, x) => {
    const m: Record<string, number> = { daily: 30, weekly: 4.3, monthly: 1, yearly: 1 / 12 };
    return s + x.amount * (m[x.freq] ?? 1);
  }, 0);

  const { todayCount, due7Count, overdueCount, pendingCount } = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);
    const in7Str = `${in7.getFullYear()}-${String(in7.getMonth() + 1).padStart(2, '0')}-${String(in7.getDate()).padStart(2, '0')}`;

    const activeItems = recurring.filter((x) => x.active && /^\d{4}-\d{2}-\d{2}$/.test(x.nextDate));
    return {
      todayCount: activeItems.filter((x) => x.nextDate === todayStr).length,
      due7Count: activeItems.filter((x) => x.nextDate > todayStr && x.nextDate <= in7Str).length,
      overdueCount: activeItems.filter((x) => x.nextDate < todayStr).length,
      pendingCount: recurring.filter((x) => x.active && !!x.pendingCycle).length,
    };
  }, [recurring]);

  const visibleList = useMemo(() => {
    const byStatus = recurring.filter((x) => {
      if (statusFilter === 'active') return x.active;
      if (statusFilter === 'inactive') return !x.active;
      return true;
    });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);
    const in7Str = `${in7.getFullYear()}-${String(in7.getMonth() + 1).padStart(2, '0')}-${String(in7.getDate()).padStart(2, '0')}`;
    const byDue = byStatus.filter((x) => {
      if (dueFilter === 'all') return true;
      if (dueFilter === 'pending') return x.active && !!x.pendingCycle;
      if (!x.active || !/^\d{4}-\d{2}-\d{2}$/.test(x.nextDate)) return false;
      if (dueFilter === 'today') return x.nextDate === todayStr;
      if (dueFilter === 'due7') return x.nextDate > todayStr && x.nextDate <= in7Str;
      if (dueFilter === 'overdue') return x.nextDate < todayStr;
      return true;
    });

    const keyword = nameQuery.trim().toLowerCase();
    const byQuery = keyword
      ? byDue.filter((x) => `${x.name} ${x.cat}`.toLowerCase().includes(keyword))
      : byDue;

    return byQuery.sort((a, b) => {
      const tA = new Date(a.nextDate).getTime();
      const tB = new Date(b.nextDate).getTime();
      if (tA !== tB) return tA - tB;
      if (a.active !== b.active) return Number(b.active) - Number(a.active);
      return a.name.localeCompare(b.name, 'zh-Hant');
    });
  }, [recurring, statusFilter, dueFilter, nameQuery]);

  const upcomingSoon = useMemo(() => {
    const now = referenceNow;
    const in7Days = now + 7 * 24 * 60 * 60 * 1000;
    return recurring
      .filter((x) => x.active)
      .filter((x) => {
        const ts = new Date(x.nextDate).getTime();
        return Number.isFinite(ts) && ts >= now && ts <= in7Days;
      })
      .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
  }, [recurring, referenceNow]);

  const visibleIds = visibleList.map((x) => x.id);
  const selectedVisibleIds = selectedIds.filter((id) => visibleIds.includes(id));

  function toggleSelect(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function batchSetActive(nextActive: boolean) {
    const targetIds = selectedVisibleIds.length > 0 ? selectedVisibleIds : visibleIds;
    if (targetIds.length === 0) {
      onBatchResult?.({ action: nextActive ? 'enable' : 'disable', affected: 0, target: 0 });
      return;
    }
    let affected = 0;
    recurring.forEach((rec) => {
      if (targetIds.includes(rec.id) && rec.active !== nextActive) {
        onChange(rec.id, nextActive);
        affected += 1;
      }
    });
    onBatchResult?.({ action: nextActive ? 'enable' : 'disable', affected, target: targetIds.length });
  }

  function batchPendingAction(action: 'confirm-pending' | 'skip-pending') {
    const selectedPendingIds = selectedVisibleIds.filter((id) => recurring.some((x) => x.id === id && !!x.pendingCycle));
    const visiblePendingIds = visibleList.filter((x) => !!x.pendingCycle).map((x) => x.id);
    const targetIds = selectedPendingIds.length > 0 ? selectedPendingIds : visiblePendingIds;
    if (targetIds.length === 0) {
      onBatchResult?.({ action, affected: 0, target: 0, names: [] });
      return;
    }

    const targets = recurring.filter((x) => targetIds.includes(x.id) && !!x.pendingCycle);
    targets.forEach((rec) => {
      if (action === 'confirm-pending') onConfirmPending?.(rec.id, confirmDateStrategy);
      if (action === 'skip-pending') onSkipPending?.(rec.id);
    });
    onBatchResult?.({ action, affected: targets.length, target: targetIds.length, names: targets.map((x) => x.name) });
  }

  function markAsHandled(rec: RecurringItem) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let nextDate = shiftRecurringDate(rec.nextDate, rec.freq, 1);
    while (DATE_ONLY_RE.test(nextDate) && nextDate <= today) {
      nextDate = shiftRecurringDate(nextDate, rec.freq, 1);
    }
    onSave(rec.id, { nextDate });
  }

  function postponeOnce(rec: RecurringItem) {
    const nextDate = shiftRecurringDate(rec.nextDate, rec.freq, 1);
    onSave(rec.id, { nextDate });
  }

  return (
    <div>
      <Card t={t} r={r} style={{ padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <Ico C={RefreshCw} size={12} color={t.secondary} sw={2} />
          <span style={{ fontSize: '10px', color: t.secondary }}>每月預估定期支出</span>
        </div>
        <div style={{ fontFamily: f.display, fontSize: '22px', fontWeight: '700', color: mo < 0 ? t.negative : t.positive, marginBottom: '8px' }}>
          {mo < 0 ? '' : '+'}{formatMoney(Math.round(Math.abs(mo)), currency)}
        </div>
        <div style={{ fontSize: '11px', color: t.secondary }}>
          {upcomingSoon.length > 0 ? `7 天內到期 ${upcomingSoon.length} 項：${upcomingSoon.slice(0, 2).map((x) => `${x.name} (${x.nextDate.slice(5).replace('-', '/')})`).join('、')}${upcomingSoon.length > 2 ? '…' : ''}` : '7 天內沒有到期項目。'}
        </div>
      </Card>

      {recurring.length === 0 && <Card t={t} r={r} style={{ padding: '18px', textAlign: 'center', color: t.secondary }}>尚無定期帳目，可從新增記錄開啟「設為定期帳目」。</Card>}

      {recurring.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <Seg options={[['all', '全部'], ['active', '啟用中'], ['inactive', '已停用']]} value={statusFilter} onChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')} t={t} r={r} f={f} />
        </div>
      )}

      {recurring.length > 0 && (
        <div style={{ position: 'sticky', top: 0, zIndex: 20, marginBottom: '10px', padding: '10px 0 8px', background: t.bg, borderBottom: `1px solid ${t.divider}` }}>
          <input
            aria-label="搜尋定期帳目"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="搜尋名稱或分類"
            style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.input, padding: '8px 10px', fontSize: '12px', color: t.primary, marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <button className="press" aria-label="全部到期篩選" onClick={() => setDueFilter('all')} style={{ border: `1px solid ${dueFilter === 'all' ? t.accent : t.border}`, background: dueFilter === 'all' ? t.accentSoft : t.surface, color: t.primary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>全部到期項目</button>
            <button className="press" aria-label="只看今日到期" onClick={() => setDueFilter('today')} style={{ border: `1px solid ${dueFilter === 'today' ? t.accent : t.border}`, background: dueFilter === 'today' ? t.accentSoft : t.surface, color: t.primary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>今日到期 ({todayCount})</button>
            <button className="press" aria-label="只看7天內到期" onClick={() => setDueFilter('due7')} style={{ border: `1px solid ${dueFilter === 'due7' ? t.accent : t.border}`, background: dueFilter === 'due7' ? t.accentSoft : t.surface, color: t.primary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>7 天內到期 ({due7Count})</button>
            <button className="press" aria-label="只看逾期未處理" onClick={() => setDueFilter('overdue')} style={{ border: `1px solid ${dueFilter === 'overdue' ? t.accent : t.border}`, background: dueFilter === 'overdue' ? t.accentSoft : t.surface, color: t.primary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>逾期未處理 ({overdueCount})</button>
            <button className="press" aria-label="只看待確認" onClick={() => setDueFilter('pending')} style={{ border: `1px solid ${dueFilter === 'pending' ? t.accent : t.border}`, background: dueFilter === 'pending' ? t.accentSoft : t.surface, color: t.primary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>待確認 ({pendingCount})</button>
            <button className="press" aria-label="批次啟用" onClick={() => batchSetActive(true)} style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.primary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>批次啟用</button>
            <button className="press" aria-label="批次停用" onClick={() => batchSetActive(false)} style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.primary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>批次停用</button>
            <button className="press" aria-label="批次確認入帳" onClick={() => batchPendingAction('confirm-pending')} style={{ border: `1px solid ${t.accent}`, background: t.accentSoft, color: t.primary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>批次確認入帳</button>
            <button className="press" aria-label="批次略過本輪" onClick={() => batchPendingAction('skip-pending')} style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.secondary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>批次略過本輪</button>
            <button className="press" aria-label="全選目前篩選結果" onClick={() => setSelectedIds(visibleIds)} style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.secondary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>全選目前篩選</button>
            <button className="press" aria-label="清除選取" onClick={() => setSelectedIds([])} style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.secondary, borderRadius: r.chip, padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>清除選取</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: t.secondary }}>
              確認入帳日期
              <select aria-label="確認入帳日期策略" value={confirmDateStrategy} onChange={(e) => setConfirmDateStrategy(e.target.value as RecurringConfirmDateStrategy)} style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.chip, padding: '4px 8px', fontSize: '11px', color: t.primary }}>
                <option value="today">今天（確認當天）</option>
                <option value="cycle">到期日（週期日）</option>
              </select>
            </label>
          </div>
          <div aria-label="定期帳目到期提醒摘要" style={{ fontSize: '11px', color: t.secondary, marginBottom: '6px' }}>
            今日到期 {todayCount} 項 · 7 天內到期 {due7Count} 項 · 逾期未處理 {overdueCount} 項 · 待確認 {pendingCount} 項
          </div>
          <div aria-label="定期帳目批次摘要" style={{ fontSize: '11px', color: t.secondary }}>
            已選取 {selectedVisibleIds.length} / 目前篩選 {visibleList.length} 筆（總共 {recurring.length} 筆）
          </div>
        </div>
      )}

      {recurring.length > 0 && visibleList.length === 0 && (
        <Card t={t} r={r} style={{ padding: '14px', marginBottom: '12px', textAlign: 'center', color: t.secondary, fontSize: '12px' }}>
          目前篩選條件下沒有符合的到期提醒項目，請切換篩選或新增一筆定期帳目。
        </Card>
      )}

      {visibleList.length > 0 && (
        <div style={{ background: t.surface, borderRadius: r.card, border: `1px solid ${t.border}`, boxShadow: t.cardShadow, overflow: 'hidden' }}>
          {visibleList.map((rec, i) => (
            <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 13px', borderBottom: i < visibleList.length - 1 ? `1px solid ${t.divider}` : 'none', opacity: rec.active ? 1 : 0.5 }}>
              <input aria-label={`選取${rec.name}`} type="checkbox" checked={selectedIds.includes(rec.id)} onChange={() => toggleSelect(rec.id)} />
              <IB tx={{ name: rec.name, cat: rec.cat, amount: rec.amount }} t={t} r={r} size={38} isz={16} />
              {editing === rec.id ? (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="名稱" style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.chip, padding: '4px 8px', marginBottom: '6px', fontSize: '12px', color: t.primary }} />
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '6px' }}>
                      <input type="number" value={draftAmount} onChange={(e) => setDraftAmount(e.target.value)} style={{ width: '80px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.chip, padding: '4px 8px', fontSize: '12px', color: t.primary }} />
                      <select value={draftFreq} onChange={(e) => setDraftFreq(e.target.value as RecurringItem['freq'])} style={{ flex: 1, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.chip, padding: '4px 8px', fontSize: '12px', color: t.primary }}>
                        {Object.entries(FREQ).map(([id, text]) => <option key={id} value={id}>{text}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Ico C={CalendarDays} size={12} color={t.secondary} sw={2} />
                      <span style={{ fontSize: '10px', color: t.secondary }}>下次扣款日期（會影響排序與近期提醒）</span>
                    </div>
                    <input aria-label={`下次扣款日期${rec.name}`} type="date" value={draftNextDate} onChange={(e) => setDraftNextDate(e.target.value)} style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.chip, padding: '4px 8px', fontSize: '12px', color: t.primary }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: t.secondary }}>
                      <select aria-label={`自動入帳模式${rec.name}`} value={draftAutoPostMode} onChange={(e) => setDraftAutoPostMode(e.target.value as RecurringAutoPostMode)} style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.chip, padding: '4px 8px', fontSize: '11px', color: t.primary }}>
                        <option value="off">關閉（僅提醒）</option>
                        <option value="on">開啟（到期自動入帳）</option>
                        <option value="confirm">待確認（到期待確認）</option>
                      </select>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="press" aria-label={`儲存${rec.name}`} onClick={() => { const next = Number.parseFloat(draftAmount); onSave(rec.id, { name: draftName || rec.name, amount: Number.isFinite(next) ? Math.sign(rec.amount || -1) * Math.abs(next) : rec.amount, freq: draftFreq, nextDate: draftNextDate || rec.nextDate, autoPostMode: draftAutoPostMode, autoPost: draftAutoPostMode === 'on' }); setEditing(null); }} style={{ border: 'none', background: t.chipActive, borderRadius: r.chip, padding: '6px', display: 'flex' }}><Ico C={Save} size={14} color={t.chipActiveText} sw={2} /></button>
                    <button className="press" aria-label={`取消編輯${rec.name}`} onClick={() => setEditing(null)} style={{ border: `1px solid ${t.border}`, background: 'none', borderRadius: r.chip, padding: '6px', display: 'flex' }}><Ico C={X} size={14} color={t.secondary} sw={2} /></button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: t.primary }}>{rec.name}</div>
                    <div style={{ fontSize: '10px', color: t.secondary }}>{FREQ[rec.freq]} · 下次 {rec.nextDate.slice(5).replace('-', '/')} · 自動入帳：{AUTO_POST_MODE_TEXT[rec.autoPostMode ?? (rec.autoPost ? 'on' : 'off')]}</div>
                    {rec.pendingCycle && (
                      <div style={{ marginTop: '6px', fontSize: '10px', color: t.warn }}>
                        待確認輪次：{rec.pendingCycle.slice(5).replace('-', '/')}（尚未入帳）
                      </div>
                    )}
                    {rec.active && DATE_ONLY_RE.test(rec.nextDate) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <button
                          className="press"
                          aria-label={`標記已處理${rec.name}`}
                          onClick={() => markAsHandled(rec)}
                          style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.primary, borderRadius: r.chip, padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          標記已處理
                        </button>
                        <button
                          className="press"
                          aria-label={`延後一次${rec.name}`}
                          onClick={() => postponeOnce(rec)}
                          style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.secondary, borderRadius: r.chip, padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          延後一次
                        </button>
                        {rec.pendingCycle && (
                          <>
                            <button
                              className="press"
                              aria-label={`確認入帳${rec.name}`}
                              onClick={() => onConfirmPending?.(rec.id, confirmDateStrategy)}
                              style={{ border: `1px solid ${t.accent}`, background: t.accentSoft, color: t.primary, borderRadius: r.chip, padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              確認入帳
                            </button>
                            <button
                              className="press"
                              aria-label={`略過本輪${rec.name}`}
                              onClick={() => onSkipPending?.(rec.id)}
                              style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.secondary, borderRadius: r.chip, padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              略過本輪
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ fontFamily: f.display, fontSize: '13px', fontWeight: '700', color: rec.amount > 0 ? t.positive : t.negative }}>
                      {formatSignedMoney(rec.amount, currency)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button className="press" aria-label={`編輯${rec.name}`} onClick={() => { setEditing(rec.id); setDraftName(rec.name); setDraftAmount(String(Math.abs(rec.amount))); setDraftFreq(rec.freq); setDraftNextDate(rec.nextDate); setDraftAutoPostMode(rec.autoPostMode ?? (rec.autoPost ? 'on' : 'off')); }} style={{ border: `1px solid ${t.border}`, background: 'none', borderRadius: r.chip, padding: '4px 7px', display: 'flex' }}><Ico C={Edit3} size={12} color={t.secondary} sw={2} /></button>
                      <select aria-label={`切換自動入帳模式${rec.name}`} value={rec.autoPostMode ?? (rec.autoPost ? 'on' : 'off')} onChange={(e) => { const mode = e.target.value as RecurringAutoPostMode; onSave(rec.id, { autoPostMode: mode, autoPost: mode === 'on' }); }} style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.secondary, borderRadius: r.chip, padding: '4px 6px', fontSize: '10px' }}>
                        <option value="off">關</option>
                        <option value="on">自動</option>
                        <option value="confirm">確認</option>
                      </select>
                      <button className="press" aria-label={`刪除${rec.name}`} onClick={() => onDelete(rec.id)} style={{ border: `1px solid ${t.border}`, background: 'none', borderRadius: r.chip, padding: '4px 7px', display: 'flex' }}><Ico C={Trash2} size={12} color={t.secondary} sw={2} /></button>
                      <Toggle on={rec.active} onToggle={() => onChange(rec.id, !rec.active)} t={t} />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
