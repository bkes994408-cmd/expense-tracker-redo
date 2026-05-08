import { INITIAL_BUDGETS, INITIAL_GOALS, INITIAL_RECURRING, INITIAL_TRANSACTIONS } from '../domain/initialData';
import { normalizeRecurringItem } from '../domain/recurring';
import type { RecurringItem, Transaction } from '../domain/types';
import { DEFAULT_BASE_CURRENCY } from '../utils/currencyDisplay';
import type { FinanceSlice } from './financeStoreHelpers';

export const FINANCE_SCHEMA_VERSION = 5;

export type FinanceMigrationReport = {
  fromVersion: number;
  toVersion: number;
  descriptions: string[];
  changedCounts: {
    resetLegacySeed: number;
    normalizedTransactions: number;
    normalizedRecurring: number;
  };
  warnings: string[];
};

export type FinanceMigrationResult = {
  state: FinanceSlice;
  report: FinanceMigrationReport;
};

type FinanceMigration = {
  fromVersion: number;
  toVersion: number;
  description: string;
  run: (state: FinanceSlice, report: FinanceMigrationReport) => FinanceSlice;
};

export function getCleanFinanceState(): FinanceSlice {
  return {
    transactions: INITIAL_TRANSACTIONS,
    recurring: INITIAL_RECURRING.map(normalizeRecurringItem),
    goals: INITIAL_GOALS,
    budgets: INITIAL_BUDGETS,
  };
}

function createReport(fromVersion: number): FinanceMigrationReport {
  return {
    fromVersion,
    toVersion: FINANCE_SCHEMA_VERSION,
    descriptions: [],
    changedCounts: {
      resetLegacySeed: 0,
      normalizedTransactions: 0,
      normalizedRecurring: 0,
    },
    warnings: [],
  };
}

function toFinanceSlice(persistedState: unknown, report: FinanceMigrationReport): FinanceSlice {
  if (!persistedState || typeof persistedState !== 'object') {
    report.warnings.push('Persisted finance state is missing or invalid; using clean state.');
    return getCleanFinanceState();
  }

  const state = persistedState as Partial<FinanceSlice>;
  return {
    transactions: Array.isArray(state.transactions) ? state.transactions as Transaction[] : [],
    recurring: Array.isArray(state.recurring) ? state.recurring as RecurringItem[] : [],
    goals: Array.isArray(state.goals) ? state.goals : [],
    budgets: state.budgets && typeof state.budgets === 'object' ? state.budgets as FinanceSlice['budgets'] : INITIAL_BUDGETS,
  };
}

function isLegacySeedData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const state = data as Partial<FinanceSlice>;
  const txns = Array.isArray(state.transactions) ? state.transactions : [];
  const recurring = Array.isArray(state.recurring) ? state.recurring : [];
  const goals = Array.isArray(state.goals) ? state.goals : [];

  const legacyTxnNames = ['午餐・拉麵', '全聯採購', '薪資入帳', '路易莎咖啡'];
  const legacyRecurring = ['Netflix', 'Spotify', '電費'];
  const legacyGoals = ['日本旅遊基金', 'MacBook Pro'];

  const txnHits = txns.filter((x) => legacyTxnNames.includes(x.name)).length;
  const recHits = recurring.filter((x) => legacyRecurring.includes(x.name)).length;
  const goalHits = goals.filter((x) => legacyGoals.includes(x.name)).length;

  return txns.length > 0 && txnHits >= 2 && recHits >= 1 && goalHits >= 1;
}

function normalizeTransactionCurrency(tx: Transaction): Transaction {
  return {
    ...tx,
    originalCurrency: tx.originalCurrency ?? DEFAULT_BASE_CURRENCY,
  };
}

function normalizeTransactions(state: FinanceSlice, report: FinanceMigrationReport): FinanceSlice {
  let changed = 0;
  const transactions = state.transactions.map((item) => {
    if (!item.originalCurrency) changed += 1;
    return normalizeTransactionCurrency(item);
  });
  report.changedCounts.normalizedTransactions += changed;
  return { ...state, transactions };
}

function normalizeRecurring(state: FinanceSlice, report: FinanceMigrationReport): FinanceSlice {
  let changed = 0;
  const recurring = state.recurring.map((item) => {
    if (!item.autoPostMode || typeof item.lastAutoPostCycle === 'undefined' || typeof item.pendingCycle === 'undefined') changed += 1;
    return normalizeRecurringItem(item);
  });
  report.changedCounts.normalizedRecurring += changed;
  return { ...state, recurring };
}

export const FINANCE_MIGRATIONS: FinanceMigration[] = [
  {
    fromVersion: 0,
    toVersion: 2,
    description: 'Remove legacy demo seed data so first launch starts clean.',
    run: (state, report) => {
      if (!isLegacySeedData(state)) return state;
      report.changedCounts.resetLegacySeed += 1;
      return getCleanFinanceState();
    },
  },
  {
    fromVersion: 2,
    toVersion: 4,
    description: 'Normalize recurring auto-post fields.',
    run: normalizeRecurring,
  },
  {
    fromVersion: 4,
    toVersion: 5,
    description: 'Backfill transaction originalCurrency with base currency fallback.',
    run: normalizeTransactions,
  },
];

export function migrateFinanceStateWithReport(persistedState: unknown, version: number): FinanceMigrationResult {
  const safeVersion = Number.isFinite(version) ? version : 0;
  const report = createReport(safeVersion);
  let state = toFinanceSlice(persistedState, report);

  for (const migration of FINANCE_MIGRATIONS) {
    if (safeVersion < migration.toVersion) {
      report.descriptions.push(migration.description);
      state = migration.run(state, report);
    }
  }

  // Always normalize current payloads too. This keeps the migration idempotent and repairs partial data.
  state = normalizeRecurring(normalizeTransactions(state, report), report);

  return { state, report };
}

export function migrateFinanceState(persistedState: unknown, version: number): FinanceSlice {
  return migrateFinanceStateWithReport(persistedState, version).state;
}
