import { useState } from 'react';
import { Seg } from '../../components/common/ui';
import type { ReportsPageProps } from '../pageTypes';
import { BudgetTab } from './BudgetTab';
import { GoalsTab } from './GoalsTab';
import { ReportTab } from './ReportTab';

export function ReportsPage({ txns, reportTxns, currency, budgets, setBudgets, goals, setGoals, t, r, f }: ReportsPageProps) {
  const [tab, setTab] = useState<'report' | 'budget' | 'goals'>('report');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 14px 0' }}>
        <Seg
          options={[
            ['report', '報表'],
            ['budget', '預算'],
            ['goals', '目標'],
          ]}
          value={tab}
          onChange={(value) => setTab(value as 'report' | 'budget' | 'goals')}
          t={t}
          r={r}
          f={f}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 80px' }} key={tab}>
        {tab === 'report' && (
          <ReportTab
            txns={reportTxns ?? txns}
            summaryTxns={txns}
            budgets={budgets}
            goals={goals}
            currency={currency}
            onJumpToSection={(section) => setTab(section)}
            t={t}
            r={r}
            f={f}
          />
        )}
        {tab === 'budget' && <BudgetTab txns={txns} currency={currency} budgets={budgets} setBudgets={setBudgets} t={t} r={r} f={f} />}
        {tab === 'goals' && <GoalsTab goals={goals} currency={currency} setGoals={setGoals} t={t} r={r} f={f} />}
      </div>
    </div>
  );
}
