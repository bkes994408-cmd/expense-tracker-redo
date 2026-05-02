import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { TransactionsPage } from '../pages/transactions/TransactionsPage';
import { INITIAL_BUDGETS, INITIAL_GOALS } from '../domain/initialData';
import type { Transaction } from '../domain/types';
import { f, r, t } from './testTheme';
const SAMPLE_TXNS: Transaction[] = [{ id: 1, name: '測試午餐', cat: '餐飲', amount: -120, date: '2026-04-10', time: '12:30' }];
const SAMPLE_RECURRING = [{ id: 1, name: '測試訂閱', cat: '娛樂' as const, amount: -149, freq: 'monthly' as const, nextDate: '2026-05-01', active: true }];

describe('smoke', () => {
  it('可切換 TransactionsPage tab', () => {
    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={SAMPLE_RECURRING}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        month={3}
        setMonth={() => {}}
      />,
    );

    expect(screen.getByText('測試午餐')).toBeInTheDocument();
    fireEvent.click(screen.getByText('定期帳目'));
    expect(screen.getByText('每月預估定期支出')).toBeInTheDocument();
  });

  it('ReportsPage 可切換到 budget tab', () => {
    render(
      <ReportsPage
        txns={SAMPLE_TXNS}
        budgets={INITIAL_BUDGETS}
        currency="NTD"
        setBudgets={() => {}}
        goals={INITIAL_GOALS}
        setGoals={() => {}}
        t={t}
        r={r}
        f={f}
      />,
    );

    fireEvent.click(screen.getByText('預算'));
    expect(screen.getByText('本月總預算')).toBeInTheDocument();
  });

  it('ReportsPage goals tab 可 quick add', () => {
    let goals = [...INITIAL_GOALS];
    const setGoals = (updater: typeof goals | ((prev: typeof goals) => typeof goals)) => {
      goals = typeof updater === 'function' ? updater(goals) : updater;
    };

    render(
      <ReportsPage
        txns={SAMPLE_TXNS}
        budgets={INITIAL_BUDGETS}
        currency="NTD"
        setBudgets={() => {}}
        goals={goals}
        setGoals={setGoals}
        t={t}
        r={r}
        f={f}
      />,
    );

    fireEvent.click(screen.getByText('目標'));
    fireEvent.click(screen.getByText('新增儲蓄目標'));
    fireEvent.change(screen.getByPlaceholderText('目標名稱'), { target: { value: '測試目標' } });
    fireEvent.change(screen.getByPlaceholderText('目標金額'), { target: { value: '10000' } });
    fireEvent.click(screen.getByText('新增'));

    expect(goals.some((g) => g.name === '測試目標')).toBe(true);
  });
});
