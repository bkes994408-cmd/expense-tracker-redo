import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SortAsc, SortDesc } from 'lucide-react';
import { CATS } from '../../domain/constants';
import { fmtD, groupByDate } from '../../utils/format';
import type { DisplayCurrency } from '../../utils/format';
import { Ico } from '../../components/common/icons';
import { Chip } from '../../components/common/ui';
import type { ThemeFonts, ThemePalette, ThemeRadii, Transaction } from '../../domain/types';
import { TxnRow } from './TxnRow';

type RecordsTabProps = {
  txns: Transaction[];
  currency: DisplayCurrency;
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
};

type SortKey = 'date' | 'amount' | 'name';
type SortDir = 'asc' | 'desc';

export function RecordsTab({ txns, currency, t, r, f, onEdit, onDelete }: RecordsTabProps) {
  const [cat, setCat] = useState('全部');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showSearch, setShowSearch] = useState(false);
  const [openRowId, setOpenRowId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const catList = ['全部', ...CATS, '收入'];

  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 100);
  }, [showSearch]);

  const filtered = useMemo(() => {
    let list = txns;
    if (cat !== '全部') list = cat === '收入' ? list.filter((x) => x.amount > 0) : list.filter((x) => x.cat === cat);
    if (q.trim()) list = list.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()) || x.cat.includes(q));

    return [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sort === 'date') return a.date.localeCompare(b.date) * dir;
      if (sort === 'amount') return (Math.abs(a.amount) - Math.abs(b.amount)) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
  }, [txns, cat, q, sort, sortDir]);

  const activeOpenRowId = openRowId !== null && filtered.some((tx) => tx.id === openRowId) ? openRowId : null;
  const grouped = groupByDate(filtered);

  const toggleSort = (s: SortKey) => {
    if (sort === s) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(s);
      setSortDir('desc');
    }
  };

  return (
    <>
      <div style={{ padding: '8px 14px 0', display: 'flex', gap: '6px', alignItems: 'center' }}>
        {showSearch ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.chip, padding: '6px 10px' }}>
            <Ico C={Search} size={14} color={t.secondary} sw={2} />
            <input ref={searchRef} value={q} onChange={(e) => { setQ(e.target.value); setOpenRowId(null); }} placeholder="搜尋…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', fontFamily: f.body, color: t.primary }} />
            <button onClick={() => { setShowSearch(false); setQ(''); setOpenRowId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex' }}>✕</button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', gap: '5px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {catList.map((c) => <Chip key={c} label={c} active={cat === c} onClick={() => { setCat(c); setOpenRowId(null); }} t={t} r={r} />)}
            </div>
            <button className="press" onClick={() => { setShowSearch(true); setOpenRowId(null); }} style={{ background: t.surfaceAlt, border: 'none', borderRadius: r.chip, padding: '7px', cursor: 'pointer', display: 'flex' }}>
              <Ico C={Search} size={16} color={t.secondary} sw={2} />
            </button>
          </>
        )}
      </div>

      <div style={{ padding: '6px 14px 0', display: 'flex', gap: '5px' }}>
        {([
          ['date', '日期'],
          ['amount', '金額'],
          ['name', '名稱'],
        ] as const).map(([s, lbl]) => (
          <button key={s} className="press" onClick={() => { toggleSort(s); setOpenRowId(null); }} style={{ background: sort === s ? t.chipActive : t.chip, color: sort === s ? t.chipActiveText : t.chipText, border: 'none', borderRadius: r.chip, padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {lbl}
            {sort === s && <Ico C={sortDir === 'desc' ? SortDesc : SortAsc} size={11} color={sort === s ? t.chipActiveText : t.chipText} sw={2} />}
          </button>
        ))}
      </div>

      <div aria-label="交易列表區域" onClick={(e) => {
        if (e.target === e.currentTarget) setOpenRowId(null);
      }} style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 80px' }}>
        {grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.secondary }}>{q ? '找不到相符的記錄' : '此月份沒有紀錄'}</div>
        ) : (
          grouped.map(([date, items]) => (
            <div key={date} style={{ marginBottom: '14px' }}>
              <div onClick={() => setOpenRowId(null)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px', cursor: openRowId !== null ? 'pointer' : 'default' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: t.secondary, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{fmtD(date)}</span>
              </div>
              <div onClick={(e) => {
                if (e.target === e.currentTarget) setOpenRowId(null);
              }} style={{ background: t.surface, borderRadius: r.card, border: `1px solid ${t.border}`, boxShadow: t.cardShadow, overflow: 'hidden' }}>
                {items.map((tx, i) => (
                  <div key={tx.id}>
                    <TxnRow tx={tx} currency={currency} t={t} r={r} f={f} index={i} onEdit={onEdit} onDelete={onDelete} isOpen={activeOpenRowId === tx.id} onOpenChange={(open) => setOpenRowId((current) => (open ? tx.id : (current === tx.id ? null : current)))} />
                    {i < items.length - 1 && <div style={{ height: '1px', background: t.divider, margin: '0 14px' }} />}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
