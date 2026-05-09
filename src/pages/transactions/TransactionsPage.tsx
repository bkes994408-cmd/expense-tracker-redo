import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from '../../domain/constants';
import { Ico } from '../../components/common/icons';
import { Seg } from '../../components/common/ui';
import type { TransactionsPageProps } from '../pageTypes';
import { RecordsTab } from './RecordsTab';
import { RecurringTab } from './RecurringTab';

export function TransactionsPage({ txns, recurring, currency, t, r, f, onEdit, onDelete, onReapplyCategoryRules, onRecChange, onRecBatchResult, onRecSave, onRecDelete, onRecConfirmPending, onRecSkipPending, month, setMonth }: TransactionsPageProps) {
  const [tab, setTab] = useState<'records' | 'recurring'>('records');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px 0', gap: '8px' }}>
        <button className="press" onClick={() => setMonth((m) => Math.max(m - 1, 0))} style={{ background: t.surfaceAlt, border: 'none', borderRadius: r.chip, padding: '6px', cursor: 'pointer', display: 'flex' }}>
          <Ico C={ChevronLeft} size={16} color={t.secondary} sw={2} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: f.display, fontSize: '15px', fontWeight: '700', color: t.primary }}>2026年 {MONTH_NAMES[month]}</div>
        <button className="press" onClick={() => setMonth((m) => Math.min(m + 1, 11))} style={{ background: t.surfaceAlt, border: 'none', borderRadius: r.chip, padding: '6px', cursor: 'pointer', display: 'flex' }}>
          <Ico C={ChevronRight} size={16} color={t.secondary} sw={2} />
        </button>
      </div>

      <div style={{ padding: '8px 14px 0' }}>
        <Seg options={[['records', '記錄'], ['recurring', '定期帳目']]} value={tab} onChange={(value) => setTab(value as 'records' | 'recurring')} t={t} r={r} f={f} />
      </div>

      {tab === 'records' ? (
        <RecordsTab txns={txns} currency={currency} t={t} r={r} f={f} onEdit={onEdit} onDelete={onDelete} onReapplyCategoryRules={onReapplyCategoryRules} />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 80px' }}>
          <RecurringTab recurring={recurring} currency={currency} t={t} r={r} f={f} onChange={onRecChange} onBatchResult={onRecBatchResult} onSave={onRecSave} onDelete={onRecDelete} onConfirmPending={onRecConfirmPending} onSkipPending={onRecSkipPending} />
        </div>
      )}
    </div>
  );
}
