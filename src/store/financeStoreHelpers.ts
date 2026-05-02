import { INITIAL_BUDGETS, INITIAL_GOALS, INITIAL_RECURRING, INITIAL_TRANSACTIONS } from '../domain/initialData';
import { normalizeRecurringItem } from '../domain/recurring';
import type { BudgetMap, Goal, RecurringItem, Transaction } from '../domain/types';
import { DEFAULT_BASE_CURRENCY } from '../utils/currencyDisplay';

export type FinanceSlice = {
  transactions: Transaction[];
  recurring: RecurringItem[];
  goals: Goal[];
  budgets: BudgetMap;
};

export function getCleanFinanceState(): FinanceSlice {
  return {
    transactions: INITIAL_TRANSACTIONS,
    recurring: INITIAL_RECURRING.map(normalizeRecurringItem),
    goals: INITIAL_GOALS,
    budgets: INITIAL_BUDGETS,
  };
}

export function resolveUpdater<T>(prev: T, updater: T | ((prev: T) => T)): T {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
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

export function migrateFinanceState(persistedState: unknown, version: number): FinanceSlice {
  if (version < 2 && isLegacySeedData(persistedState)) {
    return getCleanFinanceState();
  }

  const state = persistedState as FinanceSlice;
  if (!state || typeof state !== 'object') {
    return getCleanFinanceState();
  }

  return {
    ...state,
    transactions: Array.isArray(state.transactions)
      ? state.transactions.map((item) => normalizeTransactionCurrency(item as Transaction))
      : [],
    recurring: Array.isArray(state.recurring)
      ? state.recurring.map((item) => normalizeRecurringItem(item as RecurringItem))
      : [],
  };
}
