import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { BudgetMap, Goal, RecurringItem, Transaction } from '../domain/types';
import { createMigrationBackupStorage } from './migrationBackupStorage';
import { safeStorage } from './persistence';
import { FINANCE_SCHEMA_VERSION, getCleanFinanceState, migrateFinanceState } from './financeMigrations';
import { resolveUpdater, type FinanceSlice } from './financeStoreHelpers';

export const FINANCE_STORAGE_KEY = 'expense-tracker-redo-finance';

type FinanceState = FinanceSlice & {
  setTransactions: (updater: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  setRecurring: (updater: RecurringItem[] | ((prev: RecurringItem[]) => RecurringItem[])) => void;
  setGoals: (updater: Goal[] | ((prev: Goal[]) => Goal[])) => void;
  setBudgets: (updater: BudgetMap | ((prev: BudgetMap) => BudgetMap)) => void;
  resetAllData: () => void;
};

export function createFinanceStore(storage: StateStorage = safeStorage) {
  return create<FinanceState>()(
    persist(
      (set) => ({
        ...getCleanFinanceState(),
        setTransactions: (updater) => set((state) => ({ transactions: resolveUpdater(state.transactions, updater) })),
        setRecurring: (updater) => set((state) => ({ recurring: resolveUpdater(state.recurring, updater) })),
        setGoals: (updater) => set((state) => ({ goals: resolveUpdater(state.goals, updater) })),
        setBudgets: (updater) => set((state) => ({ budgets: resolveUpdater(state.budgets, updater) })),
        resetAllData: () => set(getCleanFinanceState()),
      }),
      {
        name: FINANCE_STORAGE_KEY,
        version: FINANCE_SCHEMA_VERSION,
        storage: createJSONStorage(() => createMigrationBackupStorage(storage, FINANCE_STORAGE_KEY, FINANCE_SCHEMA_VERSION)),
        partialize: (state) => ({
          transactions: state.transactions,
          recurring: state.recurring,
          goals: state.goals,
          budgets: state.budgets,
        }),
        migrate: migrateFinanceState,
      },
    ),
  );
}

export const useFinanceStore = createFinanceStore();
