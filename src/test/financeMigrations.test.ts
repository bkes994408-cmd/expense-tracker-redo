import { describe, expect, it } from 'vitest';
import { INITIAL_BUDGETS, INITIAL_GOALS, INITIAL_RECURRING, INITIAL_TRANSACTIONS } from '../domain/initialData';
import { FINANCE_MIGRATIONS, FINANCE_SCHEMA_VERSION, migrateFinanceStateWithReport } from '../store/financeMigrations';

describe('finance migration registry', () => {
  it('keeps schema version aligned with the latest registered migration', () => {
    const latestMigrationVersion = Math.max(...FINANCE_MIGRATIONS.map((item) => item.toVersion));

    expect(FINANCE_SCHEMA_VERSION).toBe(latestMigrationVersion);
  });

  it('resets legacy demo seed data and reports the reset', () => {
    const seedState = {
      transactions: [
        { id: 1, name: '午餐・拉麵', cat: '餐飲', amount: -180, date: '2026-04-05', time: '12:30' },
        { id: 2, name: '全聯採購', cat: '購物', amount: -740, date: '2026-04-05', time: '10:15' },
      ],
      recurring: [{ id: 1, name: 'Netflix', cat: '娛樂', amount: -390, freq: 'monthly', nextDate: '2026-05-02', active: true }],
      goals: [{ id: 1, name: '日本旅遊基金', target: 80000, saved: 34000, icon: '✈️', color: '#6366F1' }],
      budgets: { ...INITIAL_BUDGETS, 餐飲: 5000 },
    };

    const { state, report } = migrateFinanceStateWithReport(seedState, 0);

    expect(state.transactions).toEqual(INITIAL_TRANSACTIONS);
    expect(state.recurring).toEqual(INITIAL_RECURRING);
    expect(state.goals).toEqual(INITIAL_GOALS);
    expect(state.budgets).toEqual(INITIAL_BUDGETS);
    expect(report.changedCounts.resetLegacySeed).toBe(1);
    expect(report.descriptions).toContain('Remove legacy demo seed data so first launch starts clean.');
  });

  it('backfills transaction currency and recurring fields with a report', () => {
    const { state, report } = migrateFinanceStateWithReport({
      transactions: [{ id: 77, name: 'legacy txn', cat: '餐飲', amount: -80, date: '2026-04-01', time: '08:00' }],
      recurring: [{ id: 1, name: 'legacy rec', cat: '娛樂', amount: -149, freq: 'monthly', nextDate: '2026-05-01', active: true }],
      goals: [],
      budgets: { ...INITIAL_BUDGETS },
    }, 4);

    expect(state.transactions[0].originalCurrency).toBe('NTD');
    expect(state.recurring[0].autoPost).toBe(false);
    expect(state.recurring[0].autoPostMode).toBe('off');
    expect(state.recurring[0].lastAutoPostCycle).toBeNull();
    expect(state.recurring[0].pendingCycle).toBeNull();
    expect(report.changedCounts.normalizedTransactions).toBe(1);
    expect(report.changedCounts.normalizedRecurring).toBe(1);
  });

  it('falls back to clean state when persisted payload is invalid', () => {
    const { state, report } = migrateFinanceStateWithReport(null, Number.NaN);

    expect(state).toEqual({
      transactions: INITIAL_TRANSACTIONS,
      recurring: INITIAL_RECURRING,
      goals: INITIAL_GOALS,
      budgets: INITIAL_BUDGETS,
    });
    expect(report.warnings[0]).toContain('invalid');
  });
});
