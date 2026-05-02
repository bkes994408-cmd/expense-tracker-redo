import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { BudgetMap, Goal, RecurringItem, Transaction } from '../domain/types';
import { safeStorage } from './persistence';
import { getCleanFinanceState, migrateFinanceState, resolveUpdater, type FinanceSlice } from './financeStoreHelpers';

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
        name: 'expense-tracker-redo-finance',
        version: 5,
        storage: createJSONStorage(() => storage),
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
