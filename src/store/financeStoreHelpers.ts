import type { BudgetMap, Goal, RecurringItem, Transaction } from '../domain/types';
import { getCleanFinanceState, migrateFinanceState } from './financeMigrations';

export type FinanceSlice = {
  transactions: Transaction[];
  recurring: RecurringItem[];
  goals: Goal[];
  budgets: BudgetMap;
};

export function resolveUpdater<T>(prev: T, updater: T | ((prev: T) => T)): T {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
}

export { getCleanFinanceState, migrateFinanceState };
